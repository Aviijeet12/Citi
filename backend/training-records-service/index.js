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

const SERVICE_NAME = "training-records-service";

async function fetchTrainingRecord(client, recordId) {
  const result = await client.query(
    `
      SELECT tr.*,
             u.display_name AS employee_name,
             c.name AS competency_name
      FROM training_records tr
      JOIN users u ON u.id = tr.employee_user_id
      LEFT JOIN competencies c ON c.id = tr.competency_id
      WHERE tr.id = $1
    `,
    [recordId]
  );
  return result.rows[0] || null;
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
      if (request.method === "GET" && request.segments.length === 0) {
        await requirePermission(client, request.headers, "training_records.read");
        const filters = [];
        const values = [];
        if (request.query.employee_user_id) {
          values.push(request.query.employee_user_id);
          filters.push(`tr.employee_user_id = $${values.length}`);
        }
        if (request.query.status) {
          values.push(String(request.query.status).trim().toLowerCase());
          filters.push(`LOWER(tr.status) = $${values.length}`);
        }
        if (request.query.competency_id) {
          values.push(request.query.competency_id);
          filters.push(`tr.competency_id = $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT tr.*,
                   u.display_name AS employee_name,
                   c.name AS competency_name
            FROM training_records tr
            JOIN users u ON u.id = tr.employee_user_id
            LEFT JOIN competencies c ON c.id = tr.competency_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY tr.completion_date DESC NULLS LAST, tr.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "training_records.read");
        const item = await fetchTrainingRecord(client, request.segments[0]);
        if (!item) {
          throw new HttpError(404, "Training record not found");
        }
        return ok({ item });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "training_records.write");
        requireFields(request.body, ["employee_user_id", "title"]);
        const insert = await client.query(
          `
            INSERT INTO training_records (
              employee_user_id, competency_id, title, provider, status, completion_date,
              hours, score, certification_name, notes, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
            RETURNING id
          `,
          [
            request.body.employee_user_id,
            request.body.competency_id || null,
            request.body.title,
            request.body.provider || null,
            request.body.status || "planned",
            request.body.completion_date || null,
            request.body.hours || null,
            request.body.score || null,
            request.body.certification_name || null,
            request.body.notes || null,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "training_records.create", "training_record", insert.rows[0].id, request.body);
        return created({ item: await fetchTrainingRecord(client, insert.rows[0].id) });
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "training_records.write");
        const existing = await fetchTrainingRecord(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Training record not found");
        }
        await client.query(
          `
            UPDATE training_records
            SET employee_user_id = $2,
                competency_id = $3,
                title = $4,
                provider = $5,
                status = $6,
                completion_date = $7,
                hours = $8,
                score = $9,
                certification_name = $10,
                notes = $11,
                updated_by = $12,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            request.segments[0],
            request.body.employee_user_id ?? existing.employee_user_id,
            request.body.competency_id ?? existing.competency_id,
            request.body.title ?? existing.title,
            request.body.provider ?? existing.provider,
            request.body.status ?? existing.status,
            request.body.completion_date ?? existing.completion_date,
            request.body.hours ?? existing.hours,
            request.body.score ?? existing.score,
            request.body.certification_name ?? existing.certification_name,
            request.body.notes ?? existing.notes,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "training_records.update", "training_record", request.segments[0], request.body);
        return ok({ item: await fetchTrainingRecord(client, request.segments[0]) });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "training_records.delete");
        const existing = await fetchTrainingRecord(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Training record not found");
        }
        await client.query("DELETE FROM training_records WHERE id = $1", [request.segments[0]]);
        await recordAudit(client, actor.id, "training_records.delete", "training_record", request.segments[0]);
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
