const {
  HttpError,
  authenticateRequest,
  created,
  ensureSchema,
  getPool,
  getRequest,
  getUserByEmail,
  handleError,
  issueAuthTokens,
  ok,
  recordAudit,
  requireFields,
  revokeRefreshToken,
  rotateRefreshToken,
  verifyPassword,
} = require("@workshop/backend-common");

const SERVICE_NAME = "auth-service";

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

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};
