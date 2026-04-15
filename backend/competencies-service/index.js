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

const SERVICE_NAME = "competencies-service";

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
        await requirePermission(client, request.headers, "competencies.read");
        const filters = [];
        const values = [];
        if (request.query.q) {
          values.push(`%${String(request.query.q).trim().toLowerCase()}%`);
          filters.push(`(LOWER(c.name) LIKE $${values.length} OR LOWER(COALESCE(c.category, '')) LIKE $${values.length})`);
        }
        if (request.query.category) {
          values.push(String(request.query.category).trim().toLowerCase());
          filters.push(`LOWER(COALESCE(c.category, '')) = $${values.length}`);
        }
        if (request.query.is_critical !== undefined) {
          values.push(String(request.query.is_critical).toLowerCase() === "true");
          filters.push(`c.is_critical = $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT c.*,
                   COUNT(ec.user_id)::INT AS employee_count
            FROM competencies c
            LEFT JOIN employee_competencies ec ON ec.competency_id = c.id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            GROUP BY c.id
            ORDER BY c.category NULLS LAST, c.name ASC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "competencies.read");
        const result = await client.query("SELECT * FROM competencies WHERE id = $1", [request.segments[0]]);
        if (result.rowCount === 0) {
          throw new HttpError(404, "Competency not found");
        }
        return ok({ item: result.rows[0] });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "competencies.write");
        requireFields(request.body, ["name"]);
        const insert = await client.query(
          `
            INSERT INTO competencies (name, category, description, is_critical, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $5)
            RETURNING *
          `,
          [
            String(request.body.name).trim(),
            request.body.category || null,
            request.body.description || null,
            request.body.is_critical ?? false,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "competencies.create", "competency", insert.rows[0].id, request.body);
        return created({ item: insert.rows[0] });
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "competencies.write");
        const existing = await client.query("SELECT * FROM competencies WHERE id = $1", [request.segments[0]]);
        if (existing.rowCount === 0) {
          throw new HttpError(404, "Competency not found");
        }
        const current = existing.rows[0];
        const update = await client.query(
          `
            UPDATE competencies
            SET name = $2,
                category = $3,
                description = $4,
                is_critical = $5,
                updated_by = $6,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            request.segments[0],
            request.body.name ?? current.name,
            request.body.category ?? current.category,
            request.body.description ?? current.description,
            request.body.is_critical ?? current.is_critical,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "competencies.update", "competency", request.segments[0], request.body);
        return ok({ item: update.rows[0] });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "competencies.delete");
        await client.query("DELETE FROM competencies WHERE id = $1", [request.segments[0]]);
        await recordAudit(client, actor.id, "competencies.delete", "competency", request.segments[0]);
        return noContent();
      }

      if (request.method === "GET" && request.segments[0] === "assessments") {
        await requirePermission(client, request.headers, "competencies.read");
        const filters = [];
        const values = [];
        if (request.query.user_id) {
          values.push(request.query.user_id);
          filters.push(`ec.user_id = $${values.length}`);
        }
        if (request.query.competency_id) {
          values.push(request.query.competency_id);
          filters.push(`ec.competency_id = $${values.length}`);
        }
        if (request.query.gap_only !== undefined && String(request.query.gap_only).toLowerCase() === "true") {
          filters.push(`ec.target_level > ec.current_level`);
        }
        const result = await client.query(
          `
            SELECT ec.*,
                   u.display_name AS employee_name,
                   c.name AS competency_name,
                   c.category,
                   c.is_critical,
                   (ec.target_level - ec.current_level) AS gap_level
            FROM employee_competencies ec
            JOIN users u ON u.id = ec.user_id
            JOIN competencies c ON c.id = ec.competency_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY gap_level DESC, u.display_name ASC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "POST" && request.segments[0] === "assessments") {
        const actor = await requirePermission(client, request.headers, "competencies.write");
        requireFields(request.body, ["user_id", "competency_id", "current_level", "target_level"]);
        const result = await client.query(
          `
            INSERT INTO employee_competencies (
              user_id, competency_id, current_level, target_level, evidence, last_assessed_at, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
            ON CONFLICT (user_id, competency_id) DO UPDATE
            SET current_level = EXCLUDED.current_level,
                target_level = EXCLUDED.target_level,
                evidence = EXCLUDED.evidence,
                last_assessed_at = EXCLUDED.last_assessed_at,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING *
          `,
          [
            request.body.user_id,
            request.body.competency_id,
            request.body.current_level,
            request.body.target_level,
            request.body.evidence || null,
            request.body.last_assessed_at || null,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "competencies.assessment.upsert", "employee_competency", result.rows[0].id, request.body);
        return created({ item: result.rows[0] });
      }

      if (request.method === "PUT" && request.segments[0] === "assessments" && request.segments[1]) {
        const actor = await requirePermission(client, request.headers, "competencies.write");
        const existing = await client.query("SELECT * FROM employee_competencies WHERE id = $1", [request.segments[1]]);
        if (existing.rowCount === 0) {
          throw new HttpError(404, "Competency assessment not found");
        }
        const current = existing.rows[0];
        const update = await client.query(
          `
            UPDATE employee_competencies
            SET current_level = $2,
                target_level = $3,
                evidence = $4,
                last_assessed_at = $5,
                updated_by = $6,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [
            request.segments[1],
            request.body.current_level ?? current.current_level,
            request.body.target_level ?? current.target_level,
            request.body.evidence ?? current.evidence,
            request.body.last_assessed_at ?? current.last_assessed_at,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "competencies.assessment.update", "employee_competency", request.segments[1], request.body);
        return ok({ item: update.rows[0] });
      }

      if (request.method === "DELETE" && request.segments[0] === "assessments" && request.segments[1]) {
        const actor = await requirePermission(client, request.headers, "competencies.write");
        await client.query("DELETE FROM employee_competencies WHERE id = $1", [request.segments[1]]);
        await recordAudit(client, actor.id, "competencies.assessment.delete", "employee_competency", request.segments[1]);
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
