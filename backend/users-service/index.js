const {
  deriveSystemRoleFromRoleCodes,
  HttpError,
  created,
  ensureSchema,
  getPool,
  getRequest,
  getUserById,
  handleError,
  hashPassword,
  mapSystemRoleToRoleCodes,
  noContent,
  normalizeEmail,
  normalizeRoleCodes,
  normalizeSystemRole,
  ok,
  recordAudit,
  requireFields,
  requirePermission,
  setUserRoles,
} = require("@workshop/backend-common");
const { jwtAuthenticationMiddleware } = require("./middleware/authentication");
const { authorizeRoles } = require("./middleware/authorization");
const { updateUserRoleController } = require("./controllers/adminRoleController");

const SERVICE_NAME = "users-service";

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
      if (
        request.method === "PATCH"
        && request.segments.length === 4
        && request.segments[0] === "admin"
        && request.segments[1] === "users"
        && request.segments[3] === "role"
      ) {
        request.params = { userId: request.segments[2] };
        await jwtAuthenticationMiddleware({ client, request });
        authorizeRoles(["ADMIN"])({ request });
        const updatedUser = await updateUserRoleController({ client, request });
        return ok({ item: updatedUser });
      }

      if (request.method === "GET" && request.segments.length === 0) {
        await requirePermission(client, request.headers, "users.read");
        const filters = [];
        const values = [];

        if (request.query.q) {
          values.push(`%${String(request.query.q).trim().toLowerCase()}%`);
          filters.push(`(
            LOWER(u.email) LIKE $${values.length}
            OR LOWER(u.display_name) LIKE $${values.length}
            OR LOWER(COALESCE(u.first_name, '')) LIKE $${values.length}
            OR LOWER(COALESCE(u.last_name, '')) LIKE $${values.length}
            OR LOWER(COALESCE(u.department, '')) LIKE $${values.length}
            OR LOWER(COALESCE(u.job_title, '')) LIKE $${values.length}
            OR LOWER(COALESCE(u.employee_code, '')) LIKE $${values.length}
          )`);
        }
        if (request.query.status) {
          values.push(String(request.query.status).trim().toLowerCase());
          filters.push(`LOWER(u.status) = $${values.length}`);
        }
        if (request.query.department) {
          values.push(String(request.query.department).trim().toLowerCase());
          filters.push(`LOWER(COALESCE(u.department, '')) = $${values.length}`);
        }
        if (request.query.manager_user_id) {
          values.push(request.query.manager_user_id);
          filters.push(`u.manager_user_id = $${values.length}`);
        }
        if (request.query.attrition_risk) {
          values.push(String(request.query.attrition_risk).trim().toLowerCase());
          filters.push(`LOWER(COALESCE(u.attrition_risk, '')) = $${values.length}`);
        }
        if (request.query.is_high_potential !== undefined) {
          values.push(String(request.query.is_high_potential).toLowerCase() === "true");
          filters.push(`u.is_high_potential = $${values.length}`);
        }
        if (request.query.is_promotion_ready !== undefined) {
          values.push(String(request.query.is_promotion_ready).toLowerCase() === "true");
          filters.push(`u.is_promotion_ready = $${values.length}`);
        }
        if (request.query.role_code) {
          values.push(String(request.query.role_code).trim().toLowerCase());
          filters.push(`EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_code = $${values.length})`);
        }

        const result = await client.query(
          `
            SELECT u.id, u.email, u.display_name, u.status, u.role, u.created_at, u.updated_at,
                   u.employee_code, u.first_name, u.last_name, u.department, u.job_title,
                   u.location, u.hire_date, u.manager_user_id, u.career_level,
                   u.is_high_potential, u.is_promotion_ready, u.attrition_risk,
                   u.skills_summary, u.bio,
                   COALESCE(
                     ARRAY_AGG(DISTINCT ur.role_code) FILTER (WHERE ur.role_code IS NOT NULL),
                     ARRAY[]::TEXT[]
                   ) AS role_codes
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            GROUP BY u.id
            ORDER BY u.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "users.read");
        const user = await getUserById(client, request.segments[0]);
        if (!user) {
          throw new HttpError(404, "User not found");
        }
        return ok({ item: user });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "users.write");
        requireFields(request.body, ["email", "display_name", "password"]);

        await client.query("BEGIN");
        try {
          const email = normalizeEmail(request.body.email);
          const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
          if (existing.rowCount > 0) {
            throw new HttpError(400, "A user with this email already exists");
          }

          const requestedSystemRole = request.body.role
            ? normalizeSystemRole(request.body.role)
            : request.body.role_codes?.length
              ? deriveSystemRoleFromRoleCodes(request.body.role_codes)
              : "USER";

          const password = await hashPassword(request.body.password);
          const insert = await client.query(
            `
              INSERT INTO users (email, display_name, password_hash, password_salt, status, role)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `,
            [
              email,
              String(request.body.display_name).trim(),
              password.hash,
              password.salt,
              String(request.body.status || "active").trim().toLowerCase(),
              requestedSystemRole,
            ]
          );

          await client.query(
            `
              UPDATE users
              SET employee_code = $2,
                  first_name = $3,
                  last_name = $4,
                  department = $5,
                  job_title = $6,
                  location = $7,
                  hire_date = $8,
                  manager_user_id = $9,
                  career_level = $10,
                  is_high_potential = $11,
                  is_promotion_ready = $12,
                  attrition_risk = $13,
                  skills_summary = $14,
                  bio = $15,
                  updated_at = NOW()
              WHERE id = $1
            `,
            [
              insert.rows[0].id,
              request.body.employee_code || null,
              request.body.first_name || null,
              request.body.last_name || null,
              request.body.department || null,
              request.body.job_title || null,
              request.body.location || null,
              request.body.hire_date || null,
              request.body.manager_user_id || null,
              request.body.career_level || null,
              request.body.is_high_potential ?? false,
              request.body.is_promotion_ready ?? false,
              request.body.attrition_risk || null,
              request.body.skills_summary || null,
              request.body.bio || null,
            ]
          );

          const roleCodes = request.body.role_codes?.length
            ? normalizeRoleCodes(request.body.role_codes)
            : mapSystemRoleToRoleCodes(requestedSystemRole);
          await setUserRoles(client, insert.rows[0].id, roleCodes);
          await recordAudit(client, actor.id, "users.create", "user", insert.rows[0].id, { email, role_codes: roleCodes });
          await client.query("COMMIT");
          const user = await getUserById(client, insert.rows[0].id);
          return created({ item: user });
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "users.write");
        const userId = request.segments[0];

        await client.query("BEGIN");
        try {
          const existing = await getUserById(client, userId);
          if (!existing) {
            throw new HttpError(404, "User not found");
          }

          const email = request.body.email ? normalizeEmail(request.body.email) : existing.email;
          const displayName = request.body.display_name ? String(request.body.display_name).trim() : existing.display_name;
          const status = request.body.status ? String(request.body.status).trim().toLowerCase() : existing.status;
          const systemRole = request.body.role ? normalizeSystemRole(request.body.role) : existing.role;

          await client.query(
            `
              UPDATE users
              SET email = $2,
                  display_name = $3,
                  status = $4,
                  employee_code = $5,
                  first_name = $6,
                  last_name = $7,
                  department = $8,
                  job_title = $9,
                  location = $10,
                  hire_date = $11,
                  manager_user_id = $12,
                  career_level = $13,
                  is_high_potential = $14,
                  is_promotion_ready = $15,
                  attrition_risk = $16,
                  skills_summary = $17,
                  bio = $18,
                  role = $19,
                  updated_at = NOW()
              WHERE id = $1
            `,
            [
              userId,
              email,
              displayName,
              status,
              request.body.employee_code ?? existing.employee_code,
              request.body.first_name ?? existing.first_name,
              request.body.last_name ?? existing.last_name,
              request.body.department ?? existing.department,
              request.body.job_title ?? existing.job_title,
              request.body.location ?? existing.location,
              request.body.hire_date ?? existing.hire_date,
              request.body.manager_user_id ?? existing.manager_user_id,
              request.body.career_level ?? existing.career_level,
              request.body.is_high_potential ?? existing.is_high_potential,
              request.body.is_promotion_ready ?? existing.is_promotion_ready,
              request.body.attrition_risk ?? existing.attrition_risk,
              request.body.skills_summary ?? existing.skills_summary,
              request.body.bio ?? existing.bio,
              systemRole,
            ]
          );

          if (request.body.password) {
            const password = await hashPassword(request.body.password);
            await client.query(
              `
                UPDATE users
                SET password_hash = $2,
                    password_salt = $3,
                    updated_at = NOW()
                WHERE id = $1
              `,
              [userId, password.hash, password.salt]
            );
          }

          if (request.body.role_codes) {
            await setUserRoles(client, userId, request.body.role_codes);
          } else if (request.body.role) {
            await setUserRoles(client, userId, mapSystemRoleToRoleCodes(systemRole));
          }

          await recordAudit(client, actor.id, "users.update", "user", userId, request.body);
          await client.query("COMMIT");
          const user = await getUserById(client, userId);
          return ok({ item: user });
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "users.delete");
        const userId = request.segments[0];
        const existing = await getUserById(client, userId);
        if (!existing) {
          throw new HttpError(404, "User not found");
        }
        await client.query("DELETE FROM users WHERE id = $1", [userId]);
        await recordAudit(client, actor.id, "users.delete", "user", userId, { email: existing.email });
        return noContent();
      }

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};
