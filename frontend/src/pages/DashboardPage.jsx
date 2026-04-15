import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "../components/DataTable";
import { SummaryGrid } from "../components/SummaryGrid";
import { normalizeDisplayValue } from "../components/tableUtils";
import { getActiveUser, getApiBaseUrl, getKnownEndpoints } from "../services/apiClient";
import { buildAiInsights } from "../services/insightsEngine";
import { fetchDashboardData, reportsApi } from "../services/workshopApi";

const POLL_MIN_SECONDS = 2;
const POLL_MAX_SECONDS = 60;
const TERMINAL_JOB_STATUSES = new Set(["completed", "failed"]);

const CORE_SECTIONS = [
  {
    key: "users",
    title: "Users",
    subtitle: "User profile records and roles",
  },
  {
    key: "teams",
    title: "Teams",
    subtitle: "Team structures and member distribution",
  },
  {
    key: "achievements",
    title: "Achievements",
    subtitle: "Monthly team achievements",
  },
  {
    key: "metadataDefinitions",
    title: "Metadata Definitions",
    subtitle: "Metadata schema definitions",
  },
  {
    key: "metadataValues",
    title: "Metadata Values",
    subtitle: "Entity metadata values",
  },
  {
    key: "performanceReviews",
    title: "Performance Reviews",
    subtitle: "Employee reviews and ratings",
  },
  {
    key: "developmentPlans",
    title: "Development Plans",
    subtitle: "Employee growth plans",
  },
  {
    key: "competencies",
    title: "Competencies",
    subtitle: "Skill definitions and criticality",
  },
  {
    key: "competencyAssessments",
    title: "Competency Assessments",
    subtitle: "Current vs target skill levels",
  },
  {
    key: "trainingRecords",
    title: "Training Records",
    subtitle: "Employee training lifecycle",
  },
  {
    key: "projectOutcomes",
    title: "Project Outcomes",
    subtitle: "Project success and contributors",
  },
];

export function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [isOffline, setIsOffline] = useState(typeof navigator !== "undefined" ? !navigator.onLine : false);

  const [jobForm, setJobForm] = useState({
    jobName: "Executive Summary Refresh",
    department: "",
    pollSeconds: "5",
  });
  const [jobFormErrors, setJobFormErrors] = useState({});
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [workerSubmitting, setWorkerSubmitting] = useState(false);
  const [jobError, setJobError] = useState("");
  const [activeJob, setActiveJob] = useState(null);
  const [jobEvents, setJobEvents] = useState([]);
  const completedJobRefreshes = useRef(new Set());

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const nextData = await fetchDashboardData();
      setDashboardData(nextData);
      setActiveUser(getActiveUser());
      setLastUpdated(new Date().toLocaleString());
      setError("");
    } catch (requestError) {
      setError(requestError?.message || "Unable to retrieve data from backend services.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  useEffect(() => {
    const handleNetworkState = () => {
      setIsOffline(!navigator.onLine);
    };

    handleNetworkState();
    window.addEventListener("online", handleNetworkState);
    window.addEventListener("offline", handleNetworkState);

    return () => {
      window.removeEventListener("online", handleNetworkState);
      window.removeEventListener("offline", handleNetworkState);
    };
  }, []);

  const validateJobForm = useCallback((nextForm) => {
    const errors = {};

    if (!String(nextForm.jobName || "").trim()) {
      errors.jobName = "Job name is required.";
    }

    const pollSecondsValue = Number.parseInt(nextForm.pollSeconds, 10);
    if (Number.isNaN(pollSecondsValue)) {
      errors.pollSeconds = "Polling cadence must be a number.";
    } else if (pollSecondsValue < POLL_MIN_SECONDS || pollSecondsValue > POLL_MAX_SECONDS) {
      errors.pollSeconds = `Polling cadence must be between ${POLL_MIN_SECONDS} and ${POLL_MAX_SECONDS} seconds.`;
    }

    if (String(nextForm.department || "").trim().length > 64) {
      errors.department = "Department filter must be at most 64 characters.";
    }

    return errors;
  }, []);

  const updateJobFormField = useCallback((field) => {
    return (event) => {
      const value = event.target.value;
      setJobForm((previous) => ({ ...previous, [field]: value }));
      setJobFormErrors((previous) => {
        if (!previous[field]) {
          return previous;
        }
        const next = { ...previous };
        delete next[field];
        return next;
      });
    };
  }, []);

  const enqueueSummaryJob = useCallback(
    async (event) => {
      event.preventDefault();

      const validationErrors = validateJobForm(jobForm);
      setJobFormErrors(validationErrors);
      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      setJobSubmitting(true);
      setJobError("");
      try {
        const payload = await reportsApi.queueSummaryJob({
          requested_by_label: jobForm.jobName.trim(),
          department: jobForm.department.trim() || null,
        });

        if (!payload?.item?.id) {
          throw new Error("Queue accepted but no job id was returned.");
        }

        setActiveJob(payload.item);
        setJobEvents([]);
      } catch (requestError) {
        setJobError(requestError?.message || "Unable to queue report job.");
      } finally {
        setJobSubmitting(false);
      }
    },
    [jobForm, validateJobForm]
  );

  const processNextQueuedJob = useCallback(async () => {
    setWorkerSubmitting(true);
    setJobError("");
    try {
      const payload = await reportsApi.processNextSummaryJob();
      if (payload?.item) {
        setActiveJob(payload.item);
      }
      if (!payload?.processed) {
        setJobError("No queued jobs available to process right now.");
      }
    } catch (requestError) {
      setJobError(requestError?.message || "Unable to process queued report job.");
    } finally {
      setWorkerSubmitting(false);
    }
  }, []);

  const activeJobId = activeJob?.id || null;
  const activeJobStatus = activeJob?.status || "";
  const pollingSeconds = useMemo(() => {
    const parsed = Number.parseInt(jobForm.pollSeconds, 10);
    if (Number.isNaN(parsed)) {
      return 5;
    }
    return Math.max(POLL_MIN_SECONDS, Math.min(POLL_MAX_SECONDS, parsed));
  }, [jobForm.pollSeconds]);

  const refreshActiveJob = useCallback(async () => {
    if (!activeJobId) {
      return;
    }

    try {
      const [jobPayload, eventsPayload] = await Promise.all([
        reportsApi.getJob(activeJobId),
        reportsApi.listJobEvents(activeJobId, { limit: 100 }),
      ]);

      const latestJob = jobPayload?.item || null;
      if (latestJob) {
        setActiveJob(latestJob);
        if (TERMINAL_JOB_STATUSES.has(latestJob.status) && !completedJobRefreshes.current.has(latestJob.id)) {
          completedJobRefreshes.current.add(latestJob.id);
          await loadDashboard(true);
        }
      }

      setJobEvents(Array.isArray(eventsPayload?.items) ? eventsPayload.items : []);
    } catch (requestError) {
      setJobError(requestError?.message || "Unable to refresh real-time job state.");
    }
  }, [activeJobId, loadDashboard]);

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    void refreshActiveJob();

    if (TERMINAL_JOB_STATUSES.has(activeJobStatus)) {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshActiveJob();
    }, pollingSeconds * 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeJobId, activeJobStatus, pollingSeconds, refreshActiveJob]);

  const endpointCount = useMemo(() => Object.keys(getKnownEndpoints()).length, []);
  const diagnosticsWarnings = dashboardData?.diagnostics?.warnings || [];
  const isAdmin = activeUser?.role === "ADMIN";

  const metricCards = useMemo(() => {
    const summary = dashboardData?.reports?.summary || {};
    return [
      {
        label: "Active Users",
        value: summary.active_users ?? dashboardData?.users?.length ?? 0,
      },
      {
        label: "Teams",
        value: summary.teams ?? dashboardData?.teams?.length ?? 0,
      },
      {
        label: "Achievements",
        value: summary.achievements ?? dashboardData?.achievements?.length ?? 0,
      },
      {
        label: "Competencies",
        value: summary.competencies ?? dashboardData?.competencies?.length ?? 0,
      },
      {
        label: "Training Records",
        value: summary.training_records ?? dashboardData?.trainingRecords?.length ?? 0,
      },
      {
        label: "Projects",
        value: summary.project_outcomes ?? dashboardData?.projectOutcomes?.length ?? 0,
      },
    ];
  }, [dashboardData]);

  const aiInsights = useMemo(() => buildAiInsights(dashboardData), [dashboardData]);

  const reportSections = useMemo(
    () => [
      {
        key: "report-high-potential",
        title: "High Potential Employees",
        subtitle: "Report insight from reports-service/high-potential-employees",
        items: dashboardData?.reports?.highPotentialEmployees || [],
      },
      {
        key: "report-critical-gaps",
        title: "Critical Skill Gaps",
        subtitle: "Report insight from reports-service/critical-skill-gaps",
        items: dashboardData?.reports?.criticalSkillGaps || [],
      },
      {
        key: "report-training-completion",
        title: "Training Completion",
        subtitle: "Report insight from reports-service/training-completion",
        items: dashboardData?.reports?.trainingCompletion || [],
      },
      {
        key: "report-attrition-risk",
        title: "Attrition Risk Employees",
        subtitle: "Report insight from reports-service/attrition-risk-employees",
        items: dashboardData?.reports?.attritionRiskEmployees || [],
      },
    ],
    [dashboardData]
  );

  const rootClassName = `app-shell${loading ? " loading" : ""}`;

  return (
    <div className={rootClassName}>
      <header className="hero-panel">
        <p className="hero-kicker">CitiBank Workshop Console</p>
        <h1>Frontend Connected To Backend Services</h1>
        <p className="hero-description">
          The UI now reads data from every backend business service. Authentication screens remain out of scope, so
          the app uses environment-backed bootstrap credentials to create a session in the background.
        </p>

        <div className="hero-meta">
          <span>API base: {getApiBaseUrl() || "relative /api"}</span>
          <span>Endpoint map entries: {endpointCount}</span>
          <span>User: {activeUser?.display_name || activeUser?.email || "Initializing"}</span>
          <span>Last sync: {lastUpdated || "Not yet synced"}</span>
          <span>Network: {isOffline ? "Offline" : "Online"}</span>
          <span>Service health: {dashboardData?.diagnostics?.health || "unknown"}</span>
          <span>Service readiness: {dashboardData?.diagnostics?.readiness || "unknown"}</span>
        </div>

        <button
          className="refresh-button"
          onClick={() => loadDashboard(true)}
          disabled={loading || refreshing}
          aria-busy={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh all services"}
        </button>
      </header>

      {error && (
        <section className="error-panel" role="alert">
          <strong>Data loading failed.</strong>
          <p>{error}</p>
        </section>
      )}

      {!!diagnosticsWarnings.length && (
        <section className="warning-panel" role="status" aria-live="polite">
          <strong>Partial data mode</strong>
          <p>Some service calls failed. Data is shown from available sources.</p>
          <ul>
            {diagnosticsWarnings.slice(0, 5).map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="metrics-grid">
        {metricCards.map((metric) => (
          <article key={metric.label} className="metric-card">
            <p>{metric.label}</p>
            <strong>{normalizeDisplayValue(metric.value)}</strong>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <article className="data-panel full-width">
          <div className="panel-header">
            <h2>AI-Assisted Insights</h2>
            <p>Heuristic intelligence from live workforce signals.</p>
          </div>

          <div className="insights-grid" role="list" aria-label="AI recommendations">
            {aiInsights.map((insight) => (
              <article key={insight.id} className={`insight-card severity-${insight.severity}`} role="listitem">
                <p className="insight-title">{insight.title}</p>
                <p className="insight-summary">{insight.summary}</p>
                <p className="insight-recommendation">{insight.recommendation}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="data-panel full-width">
          <div className="panel-header">
            <h2>Real-Time Report Jobs</h2>
            <p>Queue asynchronous report generation and watch live event updates.</p>
          </div>

          <form className="job-form" onSubmit={enqueueSummaryJob} noValidate>
            <div className="form-field">
              <label htmlFor="jobName">Job name</label>
              <input
                id="jobName"
                name="jobName"
                value={jobForm.jobName}
                onChange={updateJobFormField("jobName")}
                required
                aria-invalid={Boolean(jobFormErrors.jobName)}
                aria-describedby={jobFormErrors.jobName ? "jobName-error" : undefined}
              />
              {jobFormErrors.jobName && (
                <p className="field-error" id="jobName-error" role="alert">
                  {jobFormErrors.jobName}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="department">Department filter (optional)</label>
              <input
                id="department"
                name="department"
                value={jobForm.department}
                onChange={updateJobFormField("department")}
                aria-invalid={Boolean(jobFormErrors.department)}
                aria-describedby={jobFormErrors.department ? "department-error" : undefined}
              />
              {jobFormErrors.department && (
                <p className="field-error" id="department-error" role="alert">
                  {jobFormErrors.department}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="pollSeconds">Polling cadence (seconds)</label>
              <input
                id="pollSeconds"
                name="pollSeconds"
                type="number"
                min={POLL_MIN_SECONDS}
                max={POLL_MAX_SECONDS}
                value={jobForm.pollSeconds}
                onChange={updateJobFormField("pollSeconds")}
                required
                aria-invalid={Boolean(jobFormErrors.pollSeconds)}
                aria-describedby={jobFormErrors.pollSeconds ? "pollSeconds-error" : undefined}
              />
              {jobFormErrors.pollSeconds && (
                <p className="field-error" id="pollSeconds-error" role="alert">
                  {jobFormErrors.pollSeconds}
                </p>
              )}
            </div>

            <div className="job-actions">
              <button type="submit" className="refresh-button" disabled={jobSubmitting || loading} aria-busy={jobSubmitting}>
                {jobSubmitting ? "Queueing..." : "Queue Summary Job"}
              </button>

              <button
                type="button"
                className="refresh-button secondary"
                onClick={processNextQueuedJob}
                disabled={!isAdmin || workerSubmitting}
                aria-busy={workerSubmitting}
              >
                {workerSubmitting ? "Processing..." : "Process Next Queued Job"}
              </button>
            </div>

            {!isAdmin && <p className="helper-note">Only ADMIN users can trigger worker execution.</p>}
          </form>

          {jobError && (
            <p className="inline-error" role="alert">
              {jobError}
            </p>
          )}

          <div className="job-live" aria-live="polite">
            <p>
              Active Job: <strong>{activeJob?.id || "None"}</strong>
            </p>
            <p>
              Status:{" "}
              <strong className={`job-status status-${String(activeJob?.status || "unknown").toLowerCase()}`}>
                {activeJob?.status || "not started"}
              </strong>
            </p>
            <p>Polling cadence: every {pollingSeconds}s</p>
          </div>

          {!!jobEvents.length && (
            <ul className="event-feed" aria-label="Job event feed">
              {jobEvents.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.event_type}</strong>
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="panel-grid">
        <article className="data-panel full-width">
          <div className="panel-header">
            <h2>Report Summary</h2>
            <p>Live aggregate counters from reports-service/summary</p>
          </div>
          <SummaryGrid summary={dashboardData?.reports?.summary} />
        </article>

        {CORE_SECTIONS.map((section) => (
          <article className="data-panel" key={section.key}>
            <div className="panel-header">
              <h2>{section.title}</h2>
              <p>
                {section.subtitle} | total: {dashboardData?.[section.key]?.length || 0}
              </p>
            </div>
            <DataTable items={dashboardData?.[section.key] || []} title={section.title} />
          </article>
        ))}

        {reportSections.map((section) => (
          <article className="data-panel" key={section.key}>
            <div className="panel-header">
              <h2>{section.title}</h2>
              <p>
                {section.subtitle} | total: {section.items.length}
              </p>
            </div>
            <DataTable items={section.items} title={section.title} />
          </article>
        ))}
      </section>
    </div>
  );
}
