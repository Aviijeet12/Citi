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

const SERVICE_NAME = "metadata-service";

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
      if (request.method === "GET" && request.segments[0] === "definitions") {
        await requirePermission(client, request.headers, "metadata.read");
        const result = await client.query(
          `
            SELECT id, entity_type, key_name, label, data_type, created_at
            FROM metadata_definitions
            ORDER BY entity_type, key_name
          `
        );
        return ok({ items: result.rows });
      }

      if (request.method === "POST" && request.segments[0] === "definitions") {
        const actor = await requirePermission(client, request.headers, "metadata.write");
        requireFields(request.body, ["entity_type", "key_name", "label"]);
        const insert = await client.query(
          `
            INSERT INTO metadata_definitions (entity_type, key_name, label, data_type)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `,
          [
            String(request.body.entity_type).trim().toLowerCase(),
            String(request.body.key_name).trim().toLowerCase(),
            String(request.body.label).trim(),
            String(request.body.data_type || "text").trim().toLowerCase(),
          ]
        );
        await recordAudit(client, actor.id, "metadata.definition.create", "metadata_definition", insert.rows[0].id, request.body);
        return created({ item: insert.rows[0] });
      }

      if (request.method === "PUT" && request.segments[0] === "definitions" && request.segments[1]) {
        const actor = await requirePermission(client, request.headers, "metadata.write");
        const existing = await client.query("SELECT * FROM metadata_definitions WHERE id = $1", [request.segments[1]]);
        if (existing.rowCount === 0) {
          throw new HttpError(404, "Metadata definition not found");
        }
        const current = existing.rows[0];
        const update = await client.query(
          `
            UPDATE metadata_definitions
            SET entity_type = $2,
                key_name = $3,
                label = $4,
                data_type = $5
            WHERE id = $1
            RETURNING *
          `,
          [
            request.segments[1],
            request.body.entity_type ?? current.entity_type,
            request.body.key_name ?? current.key_name,
            request.body.label ?? current.label,
            request.body.data_type ?? current.data_type,
          ]
        );
        await recordAudit(client, actor.id, "metadata.definition.update", "metadata_definition", request.segments[1], request.body);
        return ok({ item: update.rows[0] });
      }

      if (request.method === "DELETE" && request.segments[0] === "definitions" && request.segments[1]) {
        const actor = await requirePermission(client, request.headers, "metadata.delete");
        await client.query("DELETE FROM metadata_definitions WHERE id = $1", [request.segments[1]]);
        await recordAudit(client, actor.id, "metadata.definition.delete", "metadata_definition", request.segments[1]);
        return noContent();
      }

      if (request.method === "GET" && request.segments[0] === "values") {
        await requirePermission(client, request.headers, "metadata.read");
        const filters = [];
        const values = [];
        if (request.query.entity_type) {
          values.push(String(request.query.entity_type).trim().toLowerCase());
          filters.push(`mv.entity_type = $${values.length}`);
        }
        if (request.query.entity_id) {
          values.push(request.query.entity_id);
          filters.push(`mv.entity_id = $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT mv.id, mv.entity_type, mv.entity_id, mv.value_text, mv.created_at, mv.updated_at,
                   md.key_name, md.label, md.data_type
            FROM metadata_values mv
            JOIN metadata_definitions md ON md.id = mv.definition_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY mv.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "POST" && request.segments[0] === "values") {
        const actor = await requirePermission(client, request.headers, "metadata.write");
        requireFields(request.body, ["definition_id", "entity_type", "entity_id"]);
        const insert = await client.query(
          `
            INSERT INTO metadata_values (definition_id, entity_type, entity_id, value_text, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $5)
            ON CONFLICT (definition_id, entity_id) DO UPDATE
            SET value_text = EXCLUDED.value_text,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING *
          `,
          [
            request.body.definition_id,
            String(request.body.entity_type).trim().toLowerCase(),
            request.body.entity_id,
            request.body.value_text ?? null,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "metadata.value.upsert", "metadata_value", insert.rows[0].id, request.body);
        return created({ item: insert.rows[0] });
      }

      if (request.method === "PUT" && request.segments[0] === "values" && request.segments[1]) {
        const actor = await requirePermission(client, request.headers, "metadata.write");
        const existing = await client.query("SELECT * FROM metadata_values WHERE id = $1", [request.segments[1]]);
        if (existing.rowCount === 0) {
          throw new HttpError(404, "Metadata value not found");
        }
        const current = existing.rows[0];
        const update = await client.query(
          `
            UPDATE metadata_values
            SET value_text = $2,
                updated_by = $3,
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `,
          [request.segments[1], request.body.value_text ?? current.value_text, actor.id]
        );
        await recordAudit(client, actor.id, "metadata.value.update", "metadata_value", request.segments[1], request.body);
        return ok({ item: update.rows[0] });
      }

      if (request.method === "DELETE" && request.segments[0] === "values" && request.segments[1]) {
        const actor = await requirePermission(client, request.headers, "metadata.delete");
        await client.query("DELETE FROM metadata_values WHERE id = $1", [request.segments[1]]);
        await recordAudit(client, actor.id, "metadata.value.delete", "metadata_value", request.segments[1]);
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
