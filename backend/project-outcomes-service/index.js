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

const SERVICE_NAME = "project-outcomes-service";

async function fetchProject(client, projectId) {
  const projectResult = await client.query(
    `
      SELECT po.*,
             t.name AS team_name,
             owner.display_name AS owner_name
      FROM project_outcomes po
      LEFT JOIN teams t ON t.id = po.team_id
      LEFT JOIN users owner ON owner.id = po.owner_user_id
      WHERE po.id = $1
    `,
    [projectId]
  );
  if (projectResult.rowCount === 0) {
    return null;
  }
  const contributors = await client.query(
    `
      SELECT pc.project_id, pc.user_id, pc.responsibility, u.display_name, u.email
      FROM project_contributors pc
      JOIN users u ON u.id = pc.user_id
      WHERE pc.project_id = $1
      ORDER BY u.display_name ASC
    `,
    [projectId]
  );
  return {
    ...projectResult.rows[0],
    contributors: contributors.rows,
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
        await requirePermission(client, request.headers, "project_outcomes.read");
        const filters = [];
        const values = [];
        if (request.query.team_id) {
          values.push(request.query.team_id);
          filters.push(`po.team_id = $${values.length}`);
        }
        if (request.query.owner_user_id) {
          values.push(request.query.owner_user_id);
          filters.push(`po.owner_user_id = $${values.length}`);
        }
        if (request.query.project_status) {
          values.push(String(request.query.project_status).trim().toLowerCase());
          filters.push(`LOWER(po.project_status) = $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT po.*, t.name AS team_name, owner.display_name AS owner_name
            FROM project_outcomes po
            LEFT JOIN teams t ON t.id = po.team_id
            LEFT JOIN users owner ON owner.id = po.owner_user_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY po.end_date DESC NULLS LAST, po.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "project_outcomes.read");
        const item = await fetchProject(client, request.segments[0]);
        if (!item) {
          throw new HttpError(404, "Project outcome not found");
        }
        return ok({ item });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "project_outcomes.write");
        requireFields(request.body, ["name"]);
        const insert = await client.query(
          `
            INSERT INTO project_outcomes (
              name, team_id, owner_user_id, project_status, outcome_score, start_date, end_date, summary, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
            RETURNING id
          `,
          [
            request.body.name,
            request.body.team_id || null,
            request.body.owner_user_id || null,
            request.body.project_status || "planned",
            request.body.outcome_score || null,
            request.body.start_date || null,
            request.body.end_date || null,
            request.body.summary || null,
            actor.id,
          ]
        );
        const contributors = Array.isArray(request.body.contributors) ? request.body.contributors : [];
        for (const contributor of contributors) {
          await client.query(
            `
              INSERT INTO project_contributors (project_id, user_id, responsibility)
              VALUES ($1, $2, $3)
              ON CONFLICT (project_id, user_id) DO UPDATE
              SET responsibility = EXCLUDED.responsibility
            `,
            [insert.rows[0].id, contributor.user_id, contributor.responsibility || null]
          );
        }
        await recordAudit(client, actor.id, "project_outcomes.create", "project_outcome", insert.rows[0].id, request.body);
        return created({ item: await fetchProject(client, insert.rows[0].id) });
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "project_outcomes.write");
        const existing = await fetchProject(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Project outcome not found");
        }
        await client.query(
          `
            UPDATE project_outcomes
            SET name = $2,
                team_id = $3,
                owner_user_id = $4,
                project_status = $5,
                outcome_score = $6,
                start_date = $7,
                end_date = $8,
                summary = $9,
                updated_by = $10,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            request.segments[0],
            request.body.name ?? existing.name,
            request.body.team_id ?? existing.team_id,
            request.body.owner_user_id ?? existing.owner_user_id,
            request.body.project_status ?? existing.project_status,
            request.body.outcome_score ?? existing.outcome_score,
            request.body.start_date ?? existing.start_date,
            request.body.end_date ?? existing.end_date,
            request.body.summary ?? existing.summary,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "project_outcomes.update", "project_outcome", request.segments[0], request.body);
        return ok({ item: await fetchProject(client, request.segments[0]) });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "project_outcomes.delete");
        await client.query("DELETE FROM project_outcomes WHERE id = $1", [request.segments[0]]);
        await recordAudit(client, actor.id, "project_outcomes.delete", "project_outcome", request.segments[0]);
        return noContent();
      }

      if (request.method === "POST" && request.segments.length === 2 && request.segments[1] === "contributors") {
        const actor = await requirePermission(client, request.headers, "project_outcomes.write");
        requireFields(request.body, ["user_id"]);
        await client.query(
          `
            INSERT INTO project_contributors (project_id, user_id, responsibility)
            VALUES ($1, $2, $3)
            ON CONFLICT (project_id, user_id) DO UPDATE
            SET responsibility = EXCLUDED.responsibility
          `,
          [request.segments[0], request.body.user_id, request.body.responsibility || null]
        );
        await recordAudit(client, actor.id, "project_outcomes.contributor.upsert", "project_outcome", request.segments[0], request.body);
        return ok({ item: await fetchProject(client, request.segments[0]) });
      }

      if (request.method === "DELETE" && request.segments.length === 3 && request.segments[1] === "contributors") {
        const actor = await requirePermission(client, request.headers, "project_outcomes.write");
        await client.query("DELETE FROM project_contributors WHERE project_id = $1 AND user_id = $2", [request.segments[0], request.segments[2]]);
        await recordAudit(client, actor.id, "project_outcomes.contributor.delete", "project_outcome", request.segments[0], { user_id: request.segments[2] });
        return ok({ item: await fetchProject(client, request.segments[0]) });
      }

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};
