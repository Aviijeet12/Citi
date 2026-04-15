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

const SERVICE_NAME = "development-plans-service";

async function fetchPlan(client, planId) {
  const planResult = await client.query(
    `
      SELECT dp.*,
             employee.display_name AS employee_name,
             owner.display_name AS owner_name
      FROM development_plans dp
      JOIN users employee ON employee.id = dp.employee_user_id
      LEFT JOIN users owner ON owner.id = dp.owner_user_id
      WHERE dp.id = $1
    `,
    [planId]
  );
  if (planResult.rowCount === 0) {
    return null;
  }
  const itemsResult = await client.query(
    `
      SELECT dpi.*, c.name AS competency_name
      FROM development_plan_items dpi
      LEFT JOIN competencies c ON c.id = dpi.competency_id
      WHERE dpi.plan_id = $1
      ORDER BY dpi.due_date NULLS LAST, dpi.created_at ASC
    `,
    [planId]
  );
  return {
    ...planResult.rows[0],
    items: itemsResult.rows,
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
      if (request.method === "GET" && request.segments.length === 0) {
        await requirePermission(client, request.headers, "development_plans.read");
        const filters = [];
        const values = [];
        if (request.query.employee_user_id) {
          values.push(request.query.employee_user_id);
          filters.push(`dp.employee_user_id = $${values.length}`);
        }
        if (request.query.owner_user_id) {
          values.push(request.query.owner_user_id);
          filters.push(`dp.owner_user_id = $${values.length}`);
        }
        if (request.query.status) {
          values.push(String(request.query.status).trim().toLowerCase());
          filters.push(`LOWER(dp.status) = $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT dp.*,
                   employee.display_name AS employee_name,
                   owner.display_name AS owner_name
            FROM development_plans dp
            JOIN users employee ON employee.id = dp.employee_user_id
            LEFT JOIN users owner ON owner.id = dp.owner_user_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY dp.target_date NULLS LAST, dp.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "development_plans.read");
        const item = await fetchPlan(client, request.segments[0]);
        if (!item) {
          throw new HttpError(404, "Development plan not found");
        }
        return ok({ item });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "development_plans.write");
        requireFields(request.body, ["employee_user_id", "title"]);
        const insert = await client.query(
          `
            INSERT INTO development_plans (
              employee_user_id, owner_user_id, title, target_role, status, start_date,
              target_date, progress_percent, summary, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
            RETURNING id
          `,
          [
            request.body.employee_user_id,
            request.body.owner_user_id || actor.id,
            String(request.body.title).trim(),
            request.body.target_role || null,
            request.body.status || "planned",
            request.body.start_date || null,
            request.body.target_date || null,
            request.body.progress_percent ?? 0,
            request.body.summary || null,
            actor.id,
          ]
        );
        const items = Array.isArray(request.body.items) ? request.body.items : [];
        for (const item of items) {
          await client.query(
            `
              INSERT INTO development_plan_items (plan_id, title, description, competency_id, status, due_date, completion_date, notes)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `,
            [
              insert.rows[0].id,
              item.title,
              item.description || null,
              item.competency_id || null,
              item.status || "planned",
              item.due_date || null,
              item.completion_date || null,
              item.notes || null,
            ]
          );
        }
        await recordAudit(client, actor.id, "development_plans.create", "development_plan", insert.rows[0].id, request.body);
        return created({ item: await fetchPlan(client, insert.rows[0].id) });
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "development_plans.write");
        const existing = await fetchPlan(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Development plan not found");
        }
        await client.query(
          `
            UPDATE development_plans
            SET employee_user_id = $2,
                owner_user_id = $3,
                title = $4,
                target_role = $5,
                status = $6,
                start_date = $7,
                target_date = $8,
                progress_percent = $9,
                summary = $10,
                updated_by = $11,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            request.segments[0],
            request.body.employee_user_id ?? existing.employee_user_id,
            request.body.owner_user_id ?? existing.owner_user_id,
            request.body.title ?? existing.title,
            request.body.target_role ?? existing.target_role,
            request.body.status ?? existing.status,
            request.body.start_date ?? existing.start_date,
            request.body.target_date ?? existing.target_date,
            request.body.progress_percent ?? existing.progress_percent,
            request.body.summary ?? existing.summary,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "development_plans.update", "development_plan", request.segments[0], request.body);
        return ok({ item: await fetchPlan(client, request.segments[0]) });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "development_plans.delete");
        const existing = await fetchPlan(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Development plan not found");
        }
        await client.query("DELETE FROM development_plans WHERE id = $1", [request.segments[0]]);
        await recordAudit(client, actor.id, "development_plans.delete", "development_plan", request.segments[0]);
        return noContent();
      }

      if (request.method === "POST" && request.segments.length === 2 && request.segments[1] === "items") {
        const actor = await requirePermission(client, request.headers, "development_plans.write");
        requireFields(request.body, ["title"]);
        const insert = await client.query(
          `
            INSERT INTO development_plan_items (plan_id, title, description, competency_id, status, due_date, completion_date, notes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `,
          [
            request.segments[0],
            request.body.title,
            request.body.description || null,
            request.body.competency_id || null,
            request.body.status || "planned",
            request.body.due_date || null,
            request.body.completion_date || null,
            request.body.notes || null,
          ]
        );
        await recordAudit(client, actor.id, "development_plans.item.create", "development_plan_item", insert.rows[0].id, request.body);
        return created({ item: await fetchPlan(client, request.segments[0]) });
      }

      if (request.method === "PUT" && request.segments.length === 3 && request.segments[1] === "items") {
        const actor = await requirePermission(client, request.headers, "development_plans.write");
        const currentResult = await client.query("SELECT * FROM development_plan_items WHERE id = $1 AND plan_id = $2", [request.segments[2], request.segments[0]]);
        if (currentResult.rowCount === 0) {
          throw new HttpError(404, "Development plan item not found");
        }
        const current = currentResult.rows[0];
        await client.query(
          `
            UPDATE development_plan_items
            SET title = $3,
                description = $4,
                competency_id = $5,
                status = $6,
                due_date = $7,
                completion_date = $8,
                notes = $9,
                updated_at = NOW()
            WHERE plan_id = $1 AND id = $2
          `,
          [
            request.segments[0],
            request.segments[2],
            request.body.title ?? current.title,
            request.body.description ?? current.description,
            request.body.competency_id ?? current.competency_id,
            request.body.status ?? current.status,
            request.body.due_date ?? current.due_date,
            request.body.completion_date ?? current.completion_date,
            request.body.notes ?? current.notes,
          ]
        );
        await recordAudit(client, actor.id, "development_plans.item.update", "development_plan_item", request.segments[2], request.body);
        return ok({ item: await fetchPlan(client, request.segments[0]) });
      }

      if (request.method === "DELETE" && request.segments.length === 3 && request.segments[1] === "items") {
        const actor = await requirePermission(client, request.headers, "development_plans.write");
        await client.query("DELETE FROM development_plan_items WHERE plan_id = $1 AND id = $2", [request.segments[0], request.segments[2]]);
        await recordAudit(client, actor.id, "development_plans.item.delete", "development_plan_item", request.segments[2]);
        return ok({ item: await fetchPlan(client, request.segments[0]) });
      }

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};
