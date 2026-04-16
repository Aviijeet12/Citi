const {
  HttpError,
  authenticateRequest,
  created,
  ensureSchema,
  getPool,
  getRequest,
  getUserByEmail,
  handleError,
  hashPassword,
  issueAuthTokens,
  json,
  normalizeEmail,
  ok,
  recordAudit,
  requireFields,
  revokeRefreshToken,
  rotateRefreshToken,
  setUserRoles,
  verifyPassword,
} = require("@workshop/backend-common");

const SERVICE_NAME = "auth-service";

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

function resolveUrlOrigin(value) {
  try {
    const url = new URL(String(value || ""));
    if (!/^https?:$/.test(url.protocol)) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function resolvePublicBaseUrl(headers = {}, fallback) {
  const host = headers["x-forwarded-host"] || headers["host"];
  if (!host) {
    return fallback;
  }

  const proto = headers["x-forwarded-proto"] || headers["cloudfront-forwarded-proto"] || "http";
  return `${proto}://${host}`;
}

function isLocalEnv() {
  return process.env.IS_LOCAL === "true";
}

function resolveViewerOriginFromHeaders(headers = {}) {
  // CloudFront does not forward the Host header to Lambda Function URLs.
  // For user-initiated navigations (OAuth start), Referer/Origin will contain
  // the public site origin (CloudFront domain).
  const origin = resolveUrlOrigin(headers["origin"]);
  if (origin) return origin;

  const referer = resolveUrlOrigin(headers["referer"] || headers["referrer"]);
  if (referer) return referer;

  return null;
}

function createOAuthState(payload) {
  return Buffer.from(JSON.stringify(payload || {})).toString("base64url");
}

function parseOAuthState(value) {
  if (!value) return null;
  try {
    const decoded = Buffer.from(String(value), "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") return parsed;
    return null;
  } catch {
    return null;
  }
}

function resolveOAuthCallbackUrl(headers = {}, provider) {
  const configuredBase = process.env.OAUTH_REDIRECT_BASE_URL || process.env.API_BASE_URL;

  if (isLocalEnv()) {
    const localBase = trimTrailingSlash(resolvePublicBaseUrl(headers, "http://localhost:3001"));
    return `${localBase}/api/auth-service/${provider}/callback`;
  }

  const viewerOrigin = resolveViewerOriginFromHeaders(headers);
  const base = trimTrailingSlash(configuredBase || viewerOrigin || resolvePublicBaseUrl(headers, ""));
  return `${base}/api/auth-service/${provider}/callback`;
}

function resolveRedirectUriFromState(state, provider) {
  const payload = parseOAuthState(state);
  const redirectUri = payload?.redirect_uri;
  if (typeof redirectUri !== "string") return null;

  try {
    const url = new URL(redirectUri);
    if (!/^https?:$/.test(url.protocol)) return null;

    const expectedPath = `/api/auth-service/${provider}/callback`;
    if (!url.pathname.endsWith(expectedPath)) return null;

    return `${trimTrailingSlash(url.origin)}${expectedPath}`;
  } catch {
    return null;
  }
}

function resolveFrontendBaseUrl() {
  const configured = process.env.FRONTEND_URL;
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (isLocalEnv()) {
    return "http://localhost:3000";
  }

  return null;
}

function resolvePostAuthRedirectLocation(hashParams) {
  const base = resolveFrontendBaseUrl();
  if (base) {
    return `${base}/login#${hashParams}`;
  }

  // Production behind CloudFront: relative redirect keeps the viewer origin.
  return `/login#${hashParams}`;
}

/**
 * Handles social authentication logic: finding an existing user or creating a new one.
 */
async function handleSocialAuth(client, provider, socialId, email, displayName) {
  const normalizedEmail = normalizeEmail(email);
  const idColumn = `${provider}_id`;

  // 1. Try finding by social ID
  const byId = await client.query(`SELECT id FROM users WHERE ${idColumn} = $1`, [socialId]);
  if (byId.rowCount > 0) {
    return await getUserByEmail(client, normalizedEmail); // Return the full user object
  }

  // 2. Try finding by email
  const byEmail = await getUserByEmail(client, normalizedEmail);
  if (byEmail) {
    // Link the social ID to existing account
    await client.query(`UPDATE users SET ${idColumn} = $1, updated_at = NOW() WHERE id = $2`, [socialId, byEmail.id]);
    return byEmail;
  }

  // 3. Create new user
  await client.query("BEGIN");
  try {
    const insert = await client.query(
      `INSERT INTO users (email, display_name, password_hash, password_salt, status, role, ${idColumn}) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [normalizedEmail, displayName || normalizedEmail.split("@")[0], "social-auth", "social-auth", "active", "USER", socialId]
    );
    const userId = insert.rows[0].id;
    await setUserRoles(client, userId, ["contributor"]);
    await client.query("COMMIT");
    return await getUserByEmail(client, normalizedEmail);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

/**
 * Constructs a redirect response.
 */
function redirect(url) {
  return {
    statusCode: 302,
    headers: {
      Location: url,
      "Access-Control-Allow-Origin": "*",
    },
    body: "",
  };
}

exports.handler = async (event) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === "OPTIONS") {
    return ok({ service: SERVICE_NAME });
  }

  try {
    await ensureSchema();
    const request = getRequest(event, SERVICE_NAME);
    const pool = getPool();
    const client = await pool.connect();

    try {
      if (request.method === "POST" && request.segments[0] === "signup") {
        requireFields(request.body, ["email", "display_name", "password"]);
        await client.query("BEGIN");
        try {
          const email = normalizeEmail(request.body.email);
          const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
          if (existing.rowCount > 0) {
            throw new HttpError(400, "A user with this email already exists");
          }
          const password = await hashPassword(request.body.password);
          const systemRole = "USER";
          const roleCodes = ["contributor"];

          const insert = await client.query(
            "INSERT INTO users (email, display_name, password_hash, password_salt, status, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            [email, String(request.body.display_name).trim(), password.hash, password.salt, "active", systemRole]
          );
          const userId = insert.rows[0].id;
          await setUserRoles(client, userId, roleCodes);
          await recordAudit(client, userId, "auth.signup", "user", userId, { email });
          await client.query("COMMIT");

          const user = await getUserByEmail(client, email);
          const tokens = await issueAuthTokens(client, user);
          return ok({
            user: {
              id: user.id,
              email: user.email,
              display_name: user.display_name,
              status: user.status,
              role: user.role,
              role_codes: user.role_codes,
              permissions: user.permissions,
            },
            ...tokens,
          });
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }

      if (request.method === "POST" && request.segments[0] === "login") {
        requireFields(request.body, ["email", "password"]);
        const user = await getUserByEmail(client, request.body.email);
        if (!user || user.status !== "active") {
          throw new HttpError(401, "Invalid credentials");
        }
        const passwordValid = await verifyPassword(request.body.password, user.password_salt, user.password_hash);
        if (!passwordValid) {
          throw new HttpError(401, "Invalid credentials");
        }
        const tokens = await issueAuthTokens(client, user);
        await recordAudit(client, user.id, "auth.login", "user", user.id, { email: user.email });
        return ok({
          user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            status: user.status,
            role: user.role,
            role_codes: user.role_codes,
            permissions: user.permissions,
          },
          ...tokens,
        });
      }

      if (request.method === "POST" && request.segments[0] === "refresh") {
        requireFields(request.body, ["refresh_token"]);
        const tokens = await rotateRefreshToken(client, request.body.refresh_token);
        return ok(tokens);
      }

      if (request.method === "POST" && request.segments[0] === "logout") {
        await revokeRefreshToken(client, request.body.refresh_token);
        return created({ message: "Logged out" });
      }

      if (request.method === "GET" && request.segments[0] === "me") {
        const user = await authenticateRequest(client, request.headers);
        return ok({
          user: {
            id: user.id,
            email: user.email,
            display_name: user.display_name,
            status: user.status,
            role: user.role,
            role_codes: user.role_codes,
            permissions: user.permissions,
          },
        });
      }

      if (request.method === "GET" && request.segments[0] === "google" && request.segments[1] === "login") {
        const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        const callbackUrl = resolveOAuthCallbackUrl(request.headers, "google");
        const state = createOAuthState({ redirect_uri: callbackUrl });

        const options = {
          redirect_uri: callbackUrl,
          client_id: process.env.GOOGLE_CLIENT_ID,
          access_type: "offline",
          response_type: "code",
          prompt: "consent",
          scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"].join(" "),
          state,
        };
        const qs = new URLSearchParams(options);
        return redirect(`${rootUrl}?${qs.toString()}`);
      }

      if (request.method === "GET" && request.segments[0] === "google" && request.segments[1] === "callback") {
        const code = request.query.code;
        const tokenUrl = "https://oauth2.googleapis.com/token";

        const redirectUri =
          resolveRedirectUriFromState(request.query.state, "google") ||
          `${trimTrailingSlash(resolvePublicBaseUrl(request.headers, "http://localhost:3001"))}/api/auth-service/google/callback`;

        const tokenRes = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });
        const { access_token } = await tokenRes.json();
        const userRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=${access_token}`);
        const googleUser = await userRes.json();

        const user = await handleSocialAuth(client, "google", googleUser.id, googleUser.email, googleUser.name);
        const tokens = await issueAuthTokens(client, user);
        
        const params = new URLSearchParams({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            role: user.role
        });
        return redirect(resolvePostAuthRedirectLocation(params.toString()));
      }

      if (request.method === "GET" && request.segments[0] === "github" && request.segments[1] === "login") {
        const rootUrl = "https://github.com/login/oauth/authorize";
        const callbackUrl = resolveOAuthCallbackUrl(request.headers, "github");
        const state = createOAuthState({ redirect_uri: callbackUrl });

        const options = {
          client_id: process.env.GITHUB_CLIENT_ID,
          redirect_uri: callbackUrl,
          scope: "user:email",
          state,
        };
        const qs = new URLSearchParams(options);
        return redirect(`${rootUrl}?${qs.toString()}`);
      }

      if (request.method === "GET" && request.segments[0] === "github" && request.segments[1] === "callback") {
        const code = request.query.code;
        const tokenUrl = "https://github.com/login/oauth/access_token";
        const tokenRes = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
          }),
        });
        const { access_token } = await tokenRes.json();
        
        const userRes = await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${access_token}` } });
        const githubUser = await userRes.json();
        
        let email = githubUser.email;
        if (!email) {
            const emailsRes = await fetch("https://api.github.com/user/emails", { headers: { Authorization: `Bearer ${access_token}` } });
            const emails = await emailsRes.json();
            email = emails.find(e => e.primary && e.verified)?.email || emails[0]?.email;
        }

        const user = await handleSocialAuth(client, "github", String(githubUser.id), email, githubUser.name || githubUser.login);
        const tokens = await issueAuthTokens(client, user);

        const params = new URLSearchParams({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            role: user.role
        });
        return redirect(resolvePostAuthRedirectLocation(params.toString()));
      }

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};
