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

const SERVICE_NAME = "performance-reviews-service";

async function fetchReview(client, reviewId) {
  const result = await client.query(
    `
      SELECT pr.*,
             employee.display_name AS employee_name,
             reviewer.display_name AS reviewer_name
      FROM performance_reviews pr
      JOIN users employee ON employee.id = pr.employee_user_id
      LEFT JOIN users reviewer ON reviewer.id = pr.reviewer_user_id
      WHERE pr.id = $1
    `,
    [reviewId]
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
        await requirePermission(client, request.headers, "performance_reviews.read");
        const filters = [];
        const values = [];
        if (request.query.employee_user_id) {
          values.push(request.query.employee_user_id);
          filters.push(`pr.employee_user_id = $${values.length}`);
        }
        if (request.query.reviewer_user_id) {
          values.push(request.query.reviewer_user_id);
          filters.push(`pr.reviewer_user_id = $${values.length}`);
        }
        if (request.query.status) {
          values.push(String(request.query.status).trim().toLowerCase());
          filters.push(`LOWER(pr.status) = $${values.length}`);
        }
        if (request.query.review_period) {
          values.push(String(request.query.review_period).trim().toLowerCase());
          filters.push(`LOWER(pr.review_period) = $${values.length}`);
        }
        if (request.query.rating_min) {
          values.push(Number.parseFloat(request.query.rating_min));
          filters.push(`pr.overall_rating >= $${values.length}`);
        }
        if (request.query.rating_max) {
          values.push(Number.parseFloat(request.query.rating_max));
          filters.push(`pr.overall_rating <= $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT pr.*,
                   employee.display_name AS employee_name,
                   reviewer.display_name AS reviewer_name
            FROM performance_reviews pr
            JOIN users employee ON employee.id = pr.employee_user_id
            LEFT JOIN users reviewer ON reviewer.id = pr.reviewer_user_id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            ORDER BY pr.review_date DESC, pr.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "performance_reviews.read");
        const item = await fetchReview(client, request.segments[0]);
        if (!item) {
          throw new HttpError(404, "Performance review not found");
        }
        return ok({ item });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "performance_reviews.write");
        requireFields(request.body, ["employee_user_id", "review_period", "review_date", "overall_rating"]);
        const insert = await client.query(
          `
            INSERT INTO performance_reviews (
              employee_user_id, reviewer_user_id, review_period, review_date, review_type, status,
              overall_rating, strengths, improvement_areas, manager_feedback, employee_feedback,
              promotion_recommendation, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
            RETURNING id
          `,
          [
            request.body.employee_user_id,
            request.body.reviewer_user_id || actor.id,
            String(request.body.review_period).trim(),
            request.body.review_date,
            request.body.review_type || "annual",
            request.body.status || "draft",
            Number.parseFloat(request.body.overall_rating),
            request.body.strengths || null,
            request.body.improvement_areas || null,
            request.body.manager_feedback || null,
            request.body.employee_feedback || null,
            request.body.promotion_recommendation || null,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "performance_reviews.create", "performance_review", insert.rows[0].id, request.body);
        return created({ item: await fetchReview(client, insert.rows[0].id) });
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "performance_reviews.write");
        const existing = await fetchReview(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Performance review not found");
        }
        await client.query(
          `
            UPDATE performance_reviews
            SET employee_user_id = $2,
                reviewer_user_id = $3,
                review_period = $4,
                review_date = $5,
                review_type = $6,
                status = $7,
                overall_rating = $8,
                strengths = $9,
                improvement_areas = $10,
                manager_feedback = $11,
                employee_feedback = $12,
                promotion_recommendation = $13,
                updated_by = $14,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            request.segments[0],
            request.body.employee_user_id ?? existing.employee_user_id,
            request.body.reviewer_user_id ?? existing.reviewer_user_id,
            request.body.review_period ?? existing.review_period,
            request.body.review_date ?? existing.review_date,
            request.body.review_type ?? existing.review_type,
            request.body.status ?? existing.status,
            request.body.overall_rating ?? existing.overall_rating,
            request.body.strengths ?? existing.strengths,
            request.body.improvement_areas ?? existing.improvement_areas,
            request.body.manager_feedback ?? existing.manager_feedback,
            request.body.employee_feedback ?? existing.employee_feedback,
            request.body.promotion_recommendation ?? existing.promotion_recommendation,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "performance_reviews.update", "performance_review", request.segments[0], request.body);
        return ok({ item: await fetchReview(client, request.segments[0]) });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "performance_reviews.delete");
        const existing = await fetchReview(client, request.segments[0]);
        if (!existing) {
          throw new HttpError(404, "Performance review not found");
        }
        await client.query("DELETE FROM performance_reviews WHERE id = $1", [request.segments[0]]);
        await recordAudit(client, actor.id, "performance_reviews.delete", "performance_review", request.segments[0]);
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
