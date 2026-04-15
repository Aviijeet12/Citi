const crypto = require("crypto");
const { Pool } = require("pg");
const { disconnectPrisma, getDatabaseUrl, getPrismaClient } = require("./prisma/client");

const pools = new Map();
let schemaPromise = null;

const DEFAULT_ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@acme.local";
const DEFAULT_ADMIN_PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin123!";
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-jwt-secret-change-me";
const ACCESS_TOKEN_TTL_SECONDS = Number.parseInt(process.env.ACCESS_TOKEN_TTL_SECONDS || "3600", 10);
const REFRESH_TOKEN_TTL_DAYS = Number.parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || "7", 10);
const SYSTEM_ROLES = Object.freeze(["USER", "MANAGER", "ADMIN"]);
const ASYNC_JOB_STATUSES = Object.freeze(["queued", "running", "completed", "failed"]);

const ROLE_CODE_TO_SYSTEM_ROLE = Object.freeze({
  admin: "ADMIN",
  manager: "MANAGER",
  contributor: "USER",
  viewer: "USER",
});

const SYSTEM_ROLE_TO_ROLE_CODES = Object.freeze({
  USER: ["viewer"],
  MANAGER: ["manager"],
  ADMIN: ["admin"],
});

const ROLE_PERMISSIONS = {
  admin: [
    "users.read",
    "users.write",
    "users.delete",
    "roles.manage",
    "teams.read",
    "teams.write",
    "teams.delete",
    "achievements.read",
    "achievements.write",
    "achievements.delete",
    "metadata.read",
    "metadata.write",
    "metadata.delete",
    "performance_reviews.read",
    "performance_reviews.write",
    "performance_reviews.delete",
    "development_plans.read",
    "development_plans.write",
    "development_plans.delete",
    "competencies.read",
    "competencies.write",
    "competencies.delete",
    "training_records.read",
    "training_records.write",
    "training_records.delete",
    "project_outcomes.read",
    "project_outcomes.write",
    "project_outcomes.delete",
    "reports.read",
  ],
  manager: [
    "users.read",
    "teams.read",
    "teams.write",
    "achievements.read",
    "achievements.write",
    "metadata.read",
    "metadata.write",
    "performance_reviews.read",
    "performance_reviews.write",
    "development_plans.read",
    "development_plans.write",
    "competencies.read",
    "competencies.write",
    "training_records.read",
    "training_records.write",
    "project_outcomes.read",
    "project_outcomes.write",
    "reports.read",
  ],
  contributor: [
    "teams.read",
    "teams.write",
    "achievements.read",
    "achievements.write",
    "metadata.read",
    "metadata.write",
    "performance_reviews.read",
    "development_plans.read",
    "development_plans.write",
    "competencies.read",
    "training_records.read",
    "training_records.write",
    "project_outcomes.read",
    "reports.read",
  ],
  viewer: [
    "teams.read",
    "achievements.read",
    "metadata.read",
    "performance_reviews.read",
    "development_plans.read",
    "competencies.read",
    "training_records.read",
    "project_outcomes.read",
    "reports.read",
  ],
};

function getDbConfig() {
  const isLocal = process.env.IS_LOCAL === "true" || !process.env.IS_LOCAL;
  return {
    host: process.env.POSTGRES_HOST || "localhost",
    port: Number.parseInt(process.env.POSTGRES_PORT || "5432", 10),
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASS || "postgres123",
    database: process.env.POSTGRES_NAME || "postgres",
    max: 10,
    idleTimeoutMillis: 10000,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  };
}

function getPool() {
  const config = getDbConfig();
  const key = JSON.stringify(config);
  if (!pools.has(key)) {
    pools.set(key, new Pool(config));
  }
  return pools.get(key);
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(key);
    });
  });
  return {
    salt,
    hash: derivedKey.toString("hex"),
  };
}

async function verifyPassword(password, salt, expectedHash) {
  const { hash } = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

function createBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function parseBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString();
}

function signJwt(payload, expiresInSeconds = ACCESS_TOKEN_TTL_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedHeader = createBase64Url(JSON.stringify(header));
  const encodedBody = createBase64Url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyJwt(token) {
  const [encodedHeader, encodedBody, encodedSignature] = String(token || "").split(".");
  if (!encodedHeader || !encodedBody || !encodedSignature) {
    throw new HttpError(401, "Invalid token format");
  }

  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(encodedSignature))) {
    throw new HttpError(401, "Invalid token signature");
  }

  const payload = JSON.parse(parseBase64Url(encodedBody));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new HttpError(401, "Token expired");
  }
  return payload;
}

function createRefreshTokenValue() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeRoleCodes(roleCodes) {
  const values = Array.isArray(roleCodes) ? roleCodes : [];
  const allowed = new Set(Object.keys(ROLE_PERMISSIONS));
  return [...new Set(values.map((value) => String(value || "").trim().toLowerCase()).filter((value) => allowed.has(value)))];
}

function isSystemRole(role) {
  return SYSTEM_ROLES.includes(String(role || "").trim());
}

function normalizeSystemRole(role) {
  const value = String(role || "").trim();
  if (!isSystemRole(value)) {
    throw new HttpError(400, "role must be one of USER, MANAGER, ADMIN");
  }
  return value;
}

function deriveSystemRoleFromRoleCodes(roleCodes) {
  const normalizedRoleCodes = normalizeRoleCodes(roleCodes);
  if (normalizedRoleCodes.includes("admin")) {
    return "ADMIN";
  }
  if (normalizedRoleCodes.includes("manager")) {
    return "MANAGER";
  }
  return "USER";
}

function mapSystemRoleToRoleCodes(role) {
  const normalizedRole = normalizeSystemRole(role);
  return [...SYSTEM_ROLE_TO_ROLE_CODES[normalizedRole]];
}

function lowerCaseHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

function parseBody(event) {
  if (!event.body) {
    return {};
  }
  const bodyText = event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
  try {
    return JSON.parse(bodyText);
  } catch (_error) {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}

function getRequest(event, serviceName) {
  const method = event.requestContext?.http?.method || event.httpMethod || "GET";
  const headers = lowerCaseHeaders(event.headers || {});
  const rawPath = event.rawPath || event.path || "/";
  const query = event.queryStringParameters || {};
  const requestId = event.requestContext?.requestId || headers["x-request-id"] || crypto.randomUUID();
  const pathParts = rawPath.split("/").filter(Boolean);
  let segments = pathParts;
  if (segments[0] === "api") {
    segments = segments.slice(1);
  }
  if (segments[0] === serviceName) {
    segments = segments.slice(1);
  }
  return {
    method: method.toUpperCase(),
    headers,
    query,
    segments,
    body: parseBody(event),
    rawPath,
    requestId,
  };
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
    body: payload === undefined ? "" : JSON.stringify(payload),
  };
}

function noContent() {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
    },
    body: "",
  };
}

function ok(payload) {
  return json(200, payload);
}

function created(payload) {
  return json(201, payload);
}

class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function handleError(error) {
  console.error(error);
  if (error instanceof HttpError) {
    return json(error.statusCode, {
      message: error.message,
      details: error.details || null,
    });
  }
  return json(500, {
    message: "Internal server error",
    details: process.env.IS_LOCAL === "true" ? error.message : null,
  });
}

async function ensureSchema() {
  if (schemaPromise) {
    return schemaPromise;
  }

  schemaPromise = (async () => {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'active',
          role TEXT NOT NULL DEFAULT 'USER',
          is_system_critical BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS employee_code TEXT,
        ADD COLUMN IF NOT EXISTS first_name TEXT,
        ADD COLUMN IF NOT EXISTS last_name TEXT,
        ADD COLUMN IF NOT EXISTS department TEXT,
        ADD COLUMN IF NOT EXISTS job_title TEXT,
        ADD COLUMN IF NOT EXISTS location TEXT,
        ADD COLUMN IF NOT EXISTS hire_date DATE,
        ADD COLUMN IF NOT EXISTS manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS career_level TEXT,
        ADD COLUMN IF NOT EXISTS is_high_potential BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS is_promotion_ready BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS attrition_risk TEXT,
        ADD COLUMN IF NOT EXISTS skills_summary TEXT,
        ADD COLUMN IF NOT EXISTS bio TEXT,
        ADD COLUMN IF NOT EXISTS role TEXT,
        ADD COLUMN IF NOT EXISTS is_system_critical BOOLEAN NOT NULL DEFAULT FALSE
      `);
      await client.query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'USER'");
      await client.query("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'users_role_check'
          ) THEN
            ALTER TABLE users
            ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'MANAGER', 'ADMIN'));
          END IF;
        END $$
      `);
      await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_code ON users(employee_code) WHERE employee_code IS NOT NULL");
      await client.query("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)");
      await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          code TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS permissions (
          code TEXT PRIMARY KEY,
          description TEXT NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS role_permissions (
          role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
          permission_code TEXT NOT NULL REFERENCES permissions(code) ON DELETE CASCADE,
          PRIMARY KEY (role_code, permission_code)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_roles (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role_code TEXT NOT NULL REFERENCES roles(code) ON DELETE CASCADE,
          PRIMARY KEY (user_id, role_code)
        )
      `);
      await client.query(`
        UPDATE users u
        SET role = CASE
          WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_code = 'admin') THEN 'ADMIN'
          WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_code = 'manager') THEN 'MANAGER'
          ELSE 'USER'
        END
        WHERE u.role IS NULL OR u.role NOT IN ('USER', 'MANAGER', 'ADMIN')
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          location TEXT,
          leader_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          org_leader_name TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS team_members (
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role_title TEXT,
          location TEXT,
          is_direct_staff BOOLEAN NOT NULL DEFAULT true,
          is_leader BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (team_id, user_id)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS achievements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
          owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          description TEXT,
          achievement_month DATE NOT NULL,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS metadata_definitions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL,
          key_name TEXT NOT NULL,
          label TEXT NOT NULL,
          data_type TEXT NOT NULL DEFAULT 'text',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(entity_type, key_name)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS metadata_values (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          definition_id UUID NOT NULL REFERENCES metadata_definitions(id) ON DELETE CASCADE,
          entity_type TEXT NOT NULL,
          entity_id UUID NOT NULL,
          value_text TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(definition_id, entity_id)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          revoked_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id UUID,
          details JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS async_jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_type TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'queued',
          requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
          input JSONB,
          result JSONB,
          error_message TEXT,
          started_at TIMESTAMPTZ,
          finished_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        ALTER TABLE async_jobs
        ADD COLUMN IF NOT EXISTS job_type TEXT,
        ADD COLUMN IF NOT EXISTS status TEXT,
        ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS input JSONB,
        ADD COLUMN IF NOT EXISTS result JSONB,
        ADD COLUMN IF NOT EXISTS error_message TEXT,
        ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);
      await client.query(`
        UPDATE async_jobs
        SET job_type = COALESCE(NULLIF(TRIM(job_type), ''), 'unknown'),
            status = CASE
                       WHEN status IN ('queued', 'running', 'completed', 'failed') THEN status
                       ELSE 'queued'
                     END,
            updated_at = NOW()
        WHERE job_type IS NULL
           OR TRIM(job_type) = ''
           OR status IS NULL
           OR status NOT IN ('queued', 'running', 'completed', 'failed')
      `);
      await client.query("ALTER TABLE async_jobs ALTER COLUMN job_type SET NOT NULL");
      await client.query("ALTER TABLE async_jobs ALTER COLUMN status SET DEFAULT 'queued'");
      await client.query("ALTER TABLE async_jobs ALTER COLUMN status SET NOT NULL");
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint
            WHERE conname = 'async_jobs_status_check'
          ) THEN
            ALTER TABLE async_jobs
            ADD CONSTRAINT async_jobs_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed'));
          END IF;
        END $$
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS async_job_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES async_jobs(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          payload JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS idx_async_jobs_status_created_at ON async_jobs(status, created_at)");
      await client.query("CREATE INDEX IF NOT EXISTS idx_async_jobs_requested_by ON async_jobs(requested_by)");
      await client.query("CREATE INDEX IF NOT EXISTS idx_async_job_events_job_id_created_at ON async_job_events(job_id, created_at)");
      await client.query(`
        CREATE TABLE IF NOT EXISTS competencies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          category TEXT,
          description TEXT,
          is_critical BOOLEAN NOT NULL DEFAULT FALSE,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS employee_competencies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          competency_id UUID NOT NULL REFERENCES competencies(id) ON DELETE CASCADE,
          current_level INTEGER NOT NULL DEFAULT 1,
          target_level INTEGER NOT NULL DEFAULT 1,
          evidence TEXT,
          last_assessed_at DATE,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, competency_id)
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS performance_reviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          review_period TEXT NOT NULL,
          review_date DATE NOT NULL,
          review_type TEXT NOT NULL DEFAULT 'annual',
          status TEXT NOT NULL DEFAULT 'draft',
          overall_rating NUMERIC(4,2) NOT NULL,
          strengths TEXT,
          improvement_areas TEXT,
          manager_feedback TEXT,
          employee_feedback TEXT,
          promotion_recommendation TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS development_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          target_role TEXT,
          status TEXT NOT NULL DEFAULT 'planned',
          start_date DATE,
          target_date DATE,
          progress_percent INTEGER NOT NULL DEFAULT 0,
          summary TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS development_plan_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plan_id UUID NOT NULL REFERENCES development_plans(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'planned',
          due_date DATE,
          completion_date DATE,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS training_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          competency_id UUID REFERENCES competencies(id) ON DELETE SET NULL,
          title TEXT NOT NULL,
          provider TEXT,
          status TEXT NOT NULL DEFAULT 'planned',
          completion_date DATE,
          hours NUMERIC(6,2),
          score NUMERIC(6,2),
          certification_name TEXT,
          notes TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_outcomes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
          owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          project_status TEXT NOT NULL DEFAULT 'planned',
          outcome_score NUMERIC(6,2),
          start_date DATE,
          end_date DATE,
          summary TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_contributors (
          project_id UUID NOT NULL REFERENCES project_outcomes(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          responsibility TEXT,
          PRIMARY KEY (project_id, user_id)
        )
      `);

      for (const roleCode of Object.keys(ROLE_PERMISSIONS)) {
        await client.query(
          `
            INSERT INTO roles (code, name)
            VALUES ($1, $2)
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
          `,
          [roleCode, roleCode[0].toUpperCase() + roleCode.slice(1)]
        );
      }

      const permissionCodes = [...new Set(Object.values(ROLE_PERMISSIONS).flat())];
      for (const permissionCode of permissionCodes) {
        await client.query(
          `
            INSERT INTO permissions (code, description)
            VALUES ($1, $2)
            ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description
          `,
          [permissionCode, `${permissionCode} permission`]
        );
      }

      await client.query("DELETE FROM role_permissions");
      for (const [roleCode, permissions] of Object.entries(ROLE_PERMISSIONS)) {
        for (const permissionCode of permissions) {
          await client.query(
            `
              INSERT INTO role_permissions (role_code, permission_code)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `,
            [roleCode, permissionCode]
          );
        }
      }

      const existingAdmin = await client.query("SELECT id FROM users WHERE email = $1", [DEFAULT_ADMIN_EMAIL]);
      if (existingAdmin.rowCount === 0) {
        const password = await hashPassword(DEFAULT_ADMIN_PASSWORD);
        const adminInsert = await client.query(
          `
            INSERT INTO users (email, display_name, password_hash, password_salt, role, is_system_critical)
            VALUES ($1, $2, $3, $4, 'ADMIN', TRUE)
            RETURNING id
          `,
          [DEFAULT_ADMIN_EMAIL, "Workshop Admin", password.hash, password.salt]
        );
        await client.query(
          `
            INSERT INTO user_roles (user_id, role_code)
            VALUES ($1, 'admin')
            ON CONFLICT DO NOTHING
          `,
          [adminInsert.rows[0].id]
        );
      }

      await client.query(
        `
          UPDATE users
          SET role = 'ADMIN',
              is_system_critical = TRUE,
              updated_at = NOW()
          WHERE email = $1
        `,
        [DEFAULT_ADMIN_EMAIL]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      schemaPromise = null;
      throw error;
    } finally {
      client.release();
    }
  })();

  return schemaPromise;
}

async function getUserRolesAndPermissions(client, userId) {
  const result = await client.query(
    `
      SELECT ur.role_code, rp.permission_code
      FROM user_roles ur
      LEFT JOIN role_permissions rp ON rp.role_code = ur.role_code
      WHERE ur.user_id = $1
    `,
    [userId]
  );
  return {
    roleCodes: [...new Set(result.rows.map((row) => row.role_code).filter(Boolean))],
    permissions: [...new Set(result.rows.map((row) => row.permission_code).filter(Boolean))],
  };
}

async function getUserById(client, userId) {
  const userResult = await client.query(
    `
      SELECT id, email, display_name, status, role, is_system_critical, created_at, updated_at,
             employee_code, first_name, last_name, department, job_title, location,
             hire_date, manager_user_id, career_level, is_high_potential,
             is_promotion_ready, attrition_risk, skills_summary, bio
      FROM users
      WHERE id = $1
    `,
    [userId]
  );
  if (userResult.rowCount === 0) {
    return null;
  }
  const user = userResult.rows[0];
  const { roleCodes, permissions } = await getUserRolesAndPermissions(client, user.id);
  return {
    ...user,
    role_codes: roleCodes,
    permissions,
  };
}

async function getUserByEmail(client, email) {
  const userResult = await client.query(
    `
      SELECT id, email, display_name, password_hash, password_salt, status, role, is_system_critical, created_at, updated_at,
             employee_code, first_name, last_name, department, job_title, location,
             hire_date, manager_user_id, career_level, is_high_potential,
             is_promotion_ready, attrition_risk, skills_summary, bio
      FROM users
      WHERE email = $1
    `,
    [normalizeEmail(email)]
  );
  if (userResult.rowCount === 0) {
    return null;
  }
  const user = userResult.rows[0];
  const { roleCodes, permissions } = await getUserRolesAndPermissions(client, user.id);
  return {
    ...user,
    role_codes: roleCodes,
    permissions,
  };
}

function getBearerToken(headers) {
  const authorization = String(headers?.authorization || "").trim();
  if (!authorization) {
    console.warn("[AUTH] Missing authorization header");
    throw new HttpError(401, "Authorization header is required");
  }

  const [scheme, token, ...rest] = authorization.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    console.warn("[AUTH] Malformed authorization header");
    throw new HttpError(401, "Malformed authorization header");
  }

  return token;
}

function authenticateTokenPayload(headers) {
  let payload;
  try {
    const token = getBearerToken(headers);
    payload = verifyJwt(token);
  } catch (error) {
    console.warn("[AUTH] Token verification failed", { reason: error.message });
    throw new HttpError(401, error.message || "Unauthorized");
  }

  if (payload.type !== "access") {
    console.warn("[AUTH] Invalid token type", { type: payload.type });
    throw new HttpError(401, "Invalid access token");
  }

  if (!payload.sub) {
    console.warn("[AUTH] Missing subject claim in token");
    throw new HttpError(401, "Invalid access token");
  }

  const role = isSystemRole(payload.role)
    ? payload.role
    : deriveSystemRoleFromRoleCodes(payload.role_codes);

  return {
    userId: payload.sub,
    role,
    tokenPayload: payload,
  };
}

async function authenticateRequest(client, headers) {
  const authPayload = authenticateTokenPayload(headers);
  const user = await getUserById(client, authPayload.userId);
  if (!user || user.status !== "active") {
    console.warn("[AUTH] User is inactive or missing", { userId: authPayload.userId });
    throw new HttpError(401, "User is not active");
  }

  const role = isSystemRole(user.role)
    ? user.role
    : isSystemRole(authPayload.role)
      ? authPayload.role
      : deriveSystemRoleFromRoleCodes(user.role_codes);

  return {
    ...user,
    role,
    auth: {
      userId: user.id,
      role,
      tokenPayload: authPayload.tokenPayload,
    },
  };
}

async function requirePermission(client, headers, permission) {
  const user = await authenticateRequest(client, headers);
  if (permission && !user.permissions.includes(permission)) {
    console.warn("[AUTHZ] Permission denied", {
      userId: user.id,
      role: user.role,
      permission,
    });
    throw new HttpError(403, "Access denied");
  }
  return user;
}

async function setUserRoles(client, userId, roleCodes) {
  const normalizedRoles = normalizeRoleCodes(roleCodes);
  await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
  for (const roleCode of normalizedRoles) {
    await client.query(
      `
        INSERT INTO user_roles (user_id, role_code)
        VALUES ($1, $2)
      `,
      [userId, roleCode]
    );
  }

  const systemRole = deriveSystemRoleFromRoleCodes(normalizedRoles);
  await client.query(
    `
      UPDATE users
      SET role = $2,
          updated_at = NOW()
      WHERE id = $1
    `,
    [userId, systemRole]
  );
}

async function issueAuthTokens(client, user) {
  const role = isSystemRole(user.role) ? user.role : deriveSystemRoleFromRoleCodes(user.role_codes);
  const accessToken = signJwt({
    sub: user.id,
    email: user.email,
    role,
    role_codes: user.role_codes,
    type: "access",
  });
  const refreshToken = createRefreshTokenValue();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await client.query(
    `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [user.id, hashToken(refreshToken), expiresAt]
  );
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_SECONDS,
  };
}

async function rotateRefreshToken(client, refreshToken) {
  const result = await client.query(
    `
      SELECT rt.id, rt.user_id
      FROM refresh_tokens rt
      JOIN users u ON u.id = rt.user_id
      WHERE rt.token_hash = $1
        AND rt.revoked_at IS NULL
        AND rt.expires_at > NOW()
        AND u.status = 'active'
    `,
    [hashToken(refreshToken)]
  );
  if (result.rowCount === 0) {
    throw new HttpError(401, "Refresh token is invalid or expired");
  }
  const tokenRow = result.rows[0];
  await client.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1", [tokenRow.id]);
  const user = await getUserById(client, tokenRow.user_id);
  return issueAuthTokens(client, user);
}

async function revokeRefreshToken(client, refreshToken) {
  if (!refreshToken) {
    return;
  }
  await client.query(
    `
      UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE token_hash = $1
        AND revoked_at IS NULL
    `,
    [hashToken(refreshToken)]
  );
}

function normalizeAsyncJobStatus(status) {
  const value = String(status || "").trim().toLowerCase();
  if (!ASYNC_JOB_STATUSES.includes(value)) {
    throw new HttpError(400, `status must be one of ${ASYNC_JOB_STATUSES.join(", ")}`);
  }
  return value;
}

function normalizeAsyncJobRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    job_type: row.job_type,
    status: row.status,
    requested_by: row.requested_by,
    input: row.input,
    result: row.result,
    error_message: row.error_message,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function clampInteger(value, { minimum = 1, maximum = 100, fallback = minimum } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.max(minimum, Math.min(maximum, parsed));
}

async function appendAsyncJobEvent(client, jobId, eventType, payload = null) {
  await client.query(
    `
      INSERT INTO async_job_events (job_id, event_type, payload)
      VALUES ($1, $2, $3::jsonb)
    `,
    [jobId, String(eventType || "").trim().toLowerCase(), payload ? JSON.stringify(payload) : null]
  );
}

async function createAsyncJob(client, { jobType, requestedBy = null, input = null } = {}) {
  const normalizedJobType = String(jobType || "").trim().toLowerCase();
  if (!normalizedJobType) {
    throw new HttpError(400, "jobType is required");
  }

  const insert = await client.query(
    `
      INSERT INTO async_jobs (job_type, status, requested_by, input, updated_at)
      VALUES ($1, 'queued', $2, $3::jsonb, NOW())
      RETURNING id, job_type, status, requested_by, input, result, error_message,
                started_at, finished_at, created_at, updated_at
    `,
    [normalizedJobType, requestedBy, input ? JSON.stringify(input) : null]
  );
  const job = normalizeAsyncJobRow(insert.rows[0]);
  await appendAsyncJobEvent(client, job.id, "queued", {
    job_type: job.job_type,
    requested_by: job.requested_by,
  });
  return job;
}

async function getAsyncJobById(client, jobId) {
  const result = await client.query(
    `
      SELECT id, job_type, status, requested_by, input, result, error_message,
             started_at, finished_at, created_at, updated_at
      FROM async_jobs
      WHERE id = $1
    `,
    [jobId]
  );
  if (result.rowCount === 0) {
    return null;
  }
  return normalizeAsyncJobRow(result.rows[0]);
}

async function listAsyncJobEvents(client, jobId, { since = null, limit = 100 } = {}) {
  const boundedLimit = clampInteger(limit, { minimum: 1, maximum: 200, fallback: 100 });

  const values = [jobId];
  const clauses = ["job_id = $1"];

  if (since) {
    const sinceDate = new Date(since);
    if (Number.isNaN(sinceDate.getTime())) {
      throw new HttpError(400, "since must be a valid ISO timestamp");
    }
    values.push(sinceDate.toISOString());
    clauses.push(`created_at > $${values.length}::timestamptz`);
  }

  values.push(boundedLimit);

  const result = await client.query(
    `
      SELECT id, job_id, event_type, payload, created_at
      FROM async_job_events
      WHERE ${clauses.join(" AND ")}
      ORDER BY created_at ASC
      LIMIT $${values.length}
    `,
    values
  );

  return result.rows.map((row) => ({
    id: row.id,
    job_id: row.job_id,
    event_type: row.event_type,
    payload: row.payload,
    created_at: row.created_at,
  }));
}

async function setAsyncJobStatus(client, jobId, { status, result = null, errorMessage = null } = {}) {
  const normalizedStatus = normalizeAsyncJobStatus(status);
  const update = await client.query(
    `
      UPDATE async_jobs
      SET status = $2,
          result = $3::jsonb,
          error_message = $4,
          started_at = CASE
                         WHEN $2 = 'running' AND started_at IS NULL THEN NOW()
                         ELSE started_at
                       END,
          finished_at = CASE
                          WHEN $2 IN ('completed', 'failed') THEN NOW()
                          ELSE NULL
                        END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, job_type, status, requested_by, input, result, error_message,
                started_at, finished_at, created_at, updated_at
    `,
    [jobId, normalizedStatus, result ? JSON.stringify(result) : null, errorMessage]
  );

  if (update.rowCount === 0) {
    throw new HttpError(404, "Job not found");
  }

  const job = normalizeAsyncJobRow(update.rows[0]);
  await appendAsyncJobEvent(client, job.id, normalizedStatus, {
    error_message: job.error_message,
    has_result: job.result !== null,
  });
  return job;
}

async function claimNextAsyncJob(client, { jobType = null } = {}) {
  const normalizedJobType = jobType ? String(jobType).trim().toLowerCase() : null;
  const claimed = await client.query(
    `
      WITH next_job AS (
        SELECT id
        FROM async_jobs
        WHERE status = 'queued'
          AND ($1::text IS NULL OR job_type = $1)
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE async_jobs aj
      SET status = 'running',
          started_at = COALESCE(aj.started_at, NOW()),
          updated_at = NOW()
      FROM next_job
      WHERE aj.id = next_job.id
      RETURNING aj.id, aj.job_type, aj.status, aj.requested_by, aj.input, aj.result, aj.error_message,
                aj.started_at, aj.finished_at, aj.created_at, aj.updated_at
    `,
    [normalizedJobType]
  );

  if (claimed.rowCount === 0) {
    return null;
  }

  const job = normalizeAsyncJobRow(claimed.rows[0]);
  await appendAsyncJobEvent(client, job.id, "running", {
    job_type: job.job_type,
  });
  return job;
}

async function recordAudit(client, actorUserId, action, entityType, entityId, details = null) {
  await client.query(
    `
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [actorUserId || null, action, entityType, entityId || null, details ? JSON.stringify(details) : null]
  );
}

function requireFields(body, fieldNames) {
  for (const fieldName of fieldNames) {
    if (body[fieldName] === undefined || body[fieldName] === null || String(body[fieldName]).trim() === "") {
      throw new HttpError(400, `${fieldName} is required`);
    }
  }
}

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return ["true", "1", "yes"].includes(String(value).toLowerCase());
}

module.exports = {
  ASYNC_JOB_STATUSES,
  HttpError,
  SYSTEM_ROLES,
  appendAsyncJobEvent,
  authenticateTokenPayload,
  authenticateRequest,
  claimNextAsyncJob,
  createAsyncJob,
  created,
  deriveSystemRoleFromRoleCodes,
  disconnectPrisma,
  ensureSchema,
  getAsyncJobById,
  getDatabaseUrl,
  getBearerToken,
  getPool,
  getPrismaClient,
  getRequest,
  getUserByEmail,
  getUserById,
  handleError,
  hashPassword,
  isSystemRole,
  issueAuthTokens,
  json,
  mapSystemRoleToRoleCodes,
  noContent,
  normalizeEmail,
  normalizeAsyncJobStatus,
  normalizeRoleCodes,
  normalizeSystemRole,
  ok,
  parseBoolean,
  listAsyncJobEvents,
  recordAudit,
  requireFields,
  requirePermission,
  revokeRefreshToken,
  rotateRefreshToken,
  setAsyncJobStatus,
  setUserRoles,
  verifyPassword,
};
