const {
  HttpError,
  created,
  ensureSchema,
  getPool,
  getRequest,
  handleError,
  noContent,
  ok,
  recordAudit,
  requireFields,
  requirePermission,
} = require("@workshop/backend-common");

const SERVICE_NAME = "achievements-service";

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
      if (request.method === "GET" && request.segments.length === 0) {
        await requirePermission(client, request.headers, "achievements.read");
        const filters = [];
        const values = [];

        if (request.query.team_id) {
          values.push(request.query.team_id);
          filters.push(`a.team_id = $${values.length}`);
        }
        if (request.query.owner_user_id) {
          values.push(request.query.owner_user_id);
          filters.push(`a.owner_user_id = $${values.length}`);
        }
        if (request.query.month) {
          values.push(request.query.month);
          filters.push(`TO_CHAR(a.achievement_month, 'YYYY-MM') = $${values.length}`);
        }

        const result = await client.query(
          `
            SELECT a.id, a.team_id, a.owner_user_id, a.title, a.description, a.achievement_month,
                   a.created_at, a.updated_at, t.name AS team_name, u.display_name AS owner_name
            FROM achievements a
            JOIN teams t ON t.id = a.team_id
            LEFT JOIN users u ON u.id = a.owner_user_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY a.achievement_month DESC, a.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "achievements.read");
        const result = await client.query(
          `
            SELECT a.id, a.team_id, a.owner_user_id, a.title, a.description, a.achievement_month,
                   a.created_at, a.updated_at, t.name AS team_name, u.display_name AS owner_name
            FROM achievements a
            JOIN teams t ON t.id = a.team_id
            LEFT JOIN users u ON u.id = a.owner_user_id
            WHERE a.id = $1
          `,
          [request.segments[0]]
        );
        if (result.rowCount === 0) {
          throw new HttpError(404, "Achievement not found");
        }
        return ok({ item: result.rows[0] });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "achievements.write");
        requireFields(request.body, ["team_id", "title", "achievement_month"]);
        const insert = await client.query(
          `
            INSERT INTO achievements (team_id, owner_user_id, title, description, achievement_month, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $6)
            RETURNING id
          `,
          [
            request.body.team_id,
            request.body.owner_user_id || null,
            String(request.body.title).trim(),
            request.body.description || null,
            request.body.achievement_month,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "achievements.create", "achievement", insert.rows[0].id, request.body);
        const result = await client.query("SELECT * FROM achievements WHERE id = $1", [insert.rows[0].id]);
        return created({ item: result.rows[0] });
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "achievements.write");
        const existing = await client.query("SELECT * FROM achievements WHERE id = $1", [request.segments[0]]);
        if (existing.rowCount === 0) {
          throw new HttpError(404, "Achievement not found");
        }
        const current = existing.rows[0];
        await client.query(
          `
            UPDATE achievements
            SET team_id = $2,
                owner_user_id = $3,
                title = $4,
                description = $5,
                achievement_month = $6,
                updated_by = $7,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            request.segments[0],
            request.body.team_id ?? current.team_id,
            request.body.owner_user_id ?? current.owner_user_id,
            request.body.title ? String(request.body.title).trim() : current.title,
            request.body.description ?? current.description,
            request.body.achievement_month ?? current.achievement_month,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "achievements.update", "achievement", request.segments[0], request.body);
        const result = await client.query("SELECT * FROM achievements WHERE id = $1", [request.segments[0]]);
        return ok({ item: result.rows[0] });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "achievements.delete");
        await client.query("DELETE FROM achievements WHERE id = $1", [request.segments[0]]);
        await recordAudit(client, actor.id, "achievements.delete", "achievement", request.segments[0]);
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
