const {
  claimNextAsyncJob,
  createAsyncJob,
  HttpError,
  ensureSchema,
  getAsyncJobById,
  getPool,
  getRequest,
  handleError,
  json,
  listAsyncJobEvents,
  ok,
  recordAudit,
  requirePermission,
  setAsyncJobStatus,
} = require("@workshop/backend-common");

const SERVICE_NAME = "reports-service";
const SUMMARY_JOB_TYPE = "reports.summary";

async function fetchSummaryReport(client) {
  const summary = await client.query(
    `
      SELECT
        (SELECT COUNT(*)::INT FROM users WHERE status = 'active') AS active_users,
        (SELECT COUNT(*)::INT FROM teams) AS teams,
        (SELECT COUNT(*)::INT FROM achievements) AS achievements,
        (SELECT COUNT(*)::INT FROM metadata_values) AS metadata_values,
        (SELECT COUNT(*)::INT FROM performance_reviews) AS performance_reviews,
        (SELECT COUNT(*)::INT FROM development_plans) AS development_plans,
        (SELECT COUNT(*)::INT FROM competencies) AS competencies,
        (SELECT COUNT(*)::INT FROM training_records) AS training_records,
        (SELECT COUNT(*)::INT FROM project_outcomes) AS project_outcomes
    `
  );
  return summary.rows[0];
}

function canReadJob(actor, job) {
  return actor.role === "ADMIN" || job.requested_by === actor.id;
}

async function processNextSummaryJob(client, actor) {
  await client.query("BEGIN");
  let claimedJob;
  try {
    claimedJob = await claimNextAsyncJob(client, { jobType: SUMMARY_JOB_TYPE });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  if (!claimedJob) {
    return { processed: 0, item: null };
  }

  try {
    const reportData = await fetchSummaryReport(client);
    const completedJob = await setAsyncJobStatus(client, claimedJob.id, {
      status: "completed",
      result: {
        report: "summary",
        generated_at: new Date().toISOString(),
        data: reportData,
      },
    });
    await recordAudit(client, actor.id, "reports.jobs.complete", "async_job", claimedJob.id, {
      job_type: SUMMARY_JOB_TYPE,
    });
    return { processed: 1, item: completedJob };
  } catch (error) {
    await setAsyncJobStatus(client, claimedJob.id, {
      status: "failed",
      errorMessage: error.message || "Report processing failed",
    });
    await recordAudit(client, actor.id, "reports.jobs.failed", "async_job", claimedJob.id, {
      job_type: SUMMARY_JOB_TYPE,
      reason: error.message || "Unknown processing error",
    });
    throw new HttpError(500, "Failed to process queued report job", { job_id: claimedJob.id });
  }
}

exports.handler = async (event) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === "OPTIONS") {
    return ok({ service: SERVICE_NAME });
  }

  try {
    const request = getRequest(event, SERVICE_NAME);

    if (request.method === "GET" && request.segments[0] === "health") {
      return ok({
        service: SERVICE_NAME,
        status: "ok",
        request_id: request.requestId,
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
      });
    }

    await ensureSchema();
    const pool = getPool();
    const client = await pool.connect();

    try {
      if (request.method === "GET" && request.segments[0] === "ready") {
        await client.query("SELECT 1");
        return ok({
          service: SERVICE_NAME,
          status: "ready",
          database: "ok",
          request_id: request.requestId,
          timestamp: new Date().toISOString(),
        });
      }

      const actor = await requirePermission(client, request.headers, "reports.read");

      if (request.method === "POST" && request.segments[0] === "jobs" && request.segments[1] === "summary") {
        const job = await createAsyncJob(client, {
          jobType: SUMMARY_JOB_TYPE,
          requestedBy: actor.id,
          input: {
            filters: request.body?.filters || null,
          },
        });
        await recordAudit(client, actor.id, "reports.jobs.create", "async_job", job.id, {
          job_type: SUMMARY_JOB_TYPE,
        });
        return json(202, { item: job });
      }

      if (request.method === "GET" && request.segments[0] === "jobs" && request.segments.length === 2) {
        const job = await getAsyncJobById(client, request.segments[1]);
        if (!job) {
          throw new HttpError(404, "Job not found");
        }
        if (!canReadJob(actor, job)) {
          throw new HttpError(403, "Access denied");
        }
        return ok({ item: job });
      }

      if (
        request.method === "GET"
        && request.segments[0] === "jobs"
        && request.segments.length === 3
        && request.segments[2] === "events"
      ) {
        const job = await getAsyncJobById(client, request.segments[1]);
        if (!job) {
          throw new HttpError(404, "Job not found");
        }
        if (!canReadJob(actor, job)) {
          throw new HttpError(403, "Access denied");
        }
        const events = await listAsyncJobEvents(client, job.id, {
          since: request.query.since || null,
          limit: request.query.limit || 100,
        });
        return ok({ count: events.length, items: events });
      }

      if (
        request.method === "POST"
        && request.segments[0] === "workers"
        && request.segments[1] === "jobs"
        && request.segments[2] === "process-next"
      ) {
        if (actor.role !== "ADMIN") {
          throw new HttpError(403, "Access denied");
        }
        const processingResult = await processNextSummaryJob(client, actor);
        return ok(processingResult);
      }

      if (request.method === "GET" && (request.segments.length === 0 || request.segments[0] === "summary")) {
        const summary = await fetchSummaryReport(client);
        return ok({ item: summary });
      }

      if (request.method === "GET" && request.segments[0] === "critical-skill-gaps") {
        const result = await client.query(
          `
            SELECT u.id AS employee_user_id,
                   u.display_name AS employee_name,
                   u.department,
                   c.id AS competency_id,
                   c.name AS competency_name,
                   c.category,
                   ec.current_level,
                   ec.target_level,
                   (ec.target_level - ec.current_level) AS gap_level
            FROM employee_competencies ec
            JOIN users u ON u.id = ec.user_id
            JOIN competencies c ON c.id = ec.competency_id
            WHERE c.is_critical = TRUE
              AND ec.target_level > ec.current_level
            ORDER BY gap_level DESC, u.display_name ASC
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "high-potential-employees") {
        const result = await client.query(
          `
            SELECT id, display_name, email, department, job_title, career_level,
                   is_high_potential, is_promotion_ready, attrition_risk
            FROM users
            WHERE status = 'active'
              AND (is_high_potential = TRUE OR is_promotion_ready = TRUE)
            ORDER BY is_promotion_ready DESC, is_high_potential DESC, display_name ASC
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "training-completion") {
        const result = await client.query(
          `
            SELECT u.id AS employee_user_id,
                   u.display_name AS employee_name,
                   COUNT(tr.id)::INT AS total_training_records,
                   COUNT(*) FILTER (WHERE LOWER(tr.status) = 'completed')::INT AS completed_training_records,
                   COALESCE(SUM(tr.hours) FILTER (WHERE LOWER(tr.status) = 'completed'), 0) AS completed_hours
            FROM users u
            LEFT JOIN training_records tr ON tr.employee_user_id = u.id
            WHERE u.status = 'active'
            GROUP BY u.id
            ORDER BY completed_training_records DESC, completed_hours DESC, u.display_name ASC
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "attrition-risk-employees") {
        const result = await client.query(
          `
            WITH rating_trends AS (
              SELECT employee_user_id,
                     COUNT(*)::INT AS review_count,
                     AVG(overall_rating)::NUMERIC(6,2) AS average_rating,
                     MIN(overall_rating)::NUMERIC(6,2) AS min_rating
              FROM performance_reviews
              GROUP BY employee_user_id
            )
            SELECT u.id AS employee_user_id,
                   u.display_name AS employee_name,
                   u.department,
                   u.job_title,
                   u.attrition_risk,
                   rt.review_count,
                   rt.average_rating,
                   rt.min_rating
            FROM users u
            LEFT JOIN rating_trends rt ON rt.employee_user_id = u.id
            WHERE LOWER(COALESCE(u.attrition_risk, '')) IN ('medium', 'high', 'critical')
               OR COALESCE(rt.average_rating, 5) < 3
            ORDER BY CASE LOWER(COALESCE(u.attrition_risk, ''))
                       WHEN 'critical' THEN 1
                       WHEN 'high' THEN 2
                       WHEN 'medium' THEN 3
                       ELSE 4
                     END,
                     rt.average_rating NULLS LAST,
                     u.display_name ASC
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "performance-project-correlation") {
        const result = await client.query(
          `
            WITH employee_performance AS (
              SELECT employee_user_id, AVG(overall_rating)::NUMERIC(6,2) AS average_rating
              FROM performance_reviews
              GROUP BY employee_user_id
            )
            SELECT u.id AS employee_user_id,
                   u.display_name AS employee_name,
                   ep.average_rating,
                   COUNT(po.id)::INT AS project_count,
                   AVG(po.outcome_score)::NUMERIC(6,2) AS average_project_outcome
            FROM users u
            LEFT JOIN employee_performance ep ON ep.employee_user_id = u.id
            LEFT JOIN project_contributors pc ON pc.user_id = u.id
            LEFT JOIN project_outcomes po ON po.id = pc.project_id
            WHERE ep.average_rating IS NOT NULL OR po.id IS NOT NULL
            GROUP BY u.id, ep.average_rating
            ORDER BY average_project_outcome DESC NULLS LAST, ep.average_rating DESC NULLS LAST
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "skills-distribution") {
        const result = await client.query(
          `
            SELECT c.id AS competency_id,
                   c.name AS competency_name,
                   c.category,
                   c.is_critical,
                   COUNT(ec.user_id)::INT AS employee_count,
                   AVG(ec.current_level)::NUMERIC(6,2) AS average_current_level,
                   AVG(ec.target_level)::NUMERIC(6,2) AS average_target_level
            FROM competencies c
            LEFT JOIN employee_competencies ec ON ec.competency_id = c.id
            GROUP BY c.id
            ORDER BY employee_count DESC, c.name ASC
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "leader-location-mismatch") {
        const result = await client.query(
          `
            SELECT DISTINCT t.id, t.name, leader.display_name AS leader_name,
                   leader_member.location AS leader_location
            FROM teams t
            JOIN team_members leader_member ON leader_member.team_id = t.id AND leader_member.is_leader = TRUE
            JOIN users leader ON leader.id = leader_member.user_id
            JOIN team_members peer ON peer.team_id = t.id AND peer.user_id <> leader_member.user_id
            WHERE COALESCE(peer.location, '') <> COALESCE(leader_member.location, '')
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "leader-non-direct-staff") {
        const result = await client.query(
          `
            SELECT t.id, t.name, u.display_name AS leader_name
            FROM teams t
            JOIN team_members tm ON tm.team_id = t.id AND tm.is_leader = TRUE
            JOIN users u ON u.id = tm.user_id
            WHERE tm.is_direct_staff = FALSE
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "non-direct-staff-ratios") {
        const threshold = Number.parseFloat(request.query.threshold || "0.2");
        const result = await client.query(
          `
            SELECT t.id, t.name,
                   COUNT(tm.user_id)::INT AS total_members,
                   COUNT(*) FILTER (WHERE tm.is_direct_staff = FALSE)::INT AS non_direct_members,
                   CASE
                     WHEN COUNT(tm.user_id) = 0 THEN 0
                     ELSE ROUND(
                       (COUNT(*) FILTER (WHERE tm.is_direct_staff = FALSE)::NUMERIC / COUNT(tm.user_id)::NUMERIC),
                       4
                     )
                   END AS non_direct_ratio
            FROM teams t
            LEFT JOIN team_members tm ON tm.team_id = t.id
            GROUP BY t.id
            HAVING CASE
                     WHEN COUNT(tm.user_id) = 0 THEN 0
                     ELSE (COUNT(*) FILTER (WHERE tm.is_direct_staff = FALSE)::NUMERIC / COUNT(tm.user_id)::NUMERIC)
                   END > $1
            ORDER BY non_direct_ratio DESC
          `,
          [threshold]
        );
        return ok({ threshold, count: result.rowCount, items: result.rows });
      }

      if (request.method === "GET" && request.segments[0] === "organization-leader-teams") {
        const result = await client.query(
          `
            SELECT id, name, org_leader_name
            FROM teams
            WHERE COALESCE(TRIM(org_leader_name), '') <> ''
            ORDER BY name ASC
          `
        );
        return ok({ count: result.rowCount, items: result.rows });
      }

      if (!["GET", "POST"].includes(request.method)) {
        throw new HttpError(405, "Method not allowed");
      }

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};

exports._internal = {
  canReadJob,
  fetchSummaryReport,
};
