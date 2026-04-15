# Reports Service

## Overview

This service provides analytics-style report endpoints over core workforce data.

## Reliability and Observability Endpoints

- `GET /api/reports-service/health`
  - Liveness probe for platform health checks.
- `GET /api/reports-service/ready`
  - Readiness probe with database connectivity validation.

## Synchronous Report Endpoints

- `GET /api/reports-service`
- `GET /api/reports-service/summary`
- `GET /api/reports-service/critical-skill-gaps`
- `GET /api/reports-service/high-potential-employees`
- `GET /api/reports-service/training-completion`
- `GET /api/reports-service/attrition-risk-employees`
- `GET /api/reports-service/performance-project-correlation`
- `GET /api/reports-service/skills-distribution`
- `GET /api/reports-service/leader-location-mismatch`
- `GET /api/reports-service/leader-non-direct-staff`
- `GET /api/reports-service/non-direct-staff-ratios?threshold=0.2`
- `GET /api/reports-service/organization-leader-teams`

All report endpoints require a valid bearer token with `reports.read` permission.

## Async Report Jobs and Real-Time Updates

### Queue a job

- `POST /api/reports-service/jobs/summary`
- Returns `202 Accepted` with a job object (`queued`).

### Process queued jobs (worker endpoint)

- `POST /api/reports-service/workers/jobs/process-next`
- Intended for scheduled or worker-style execution.
- Requires an authenticated `ADMIN` user.

### Fetch job status

- `GET /api/reports-service/jobs/{jobId}`
- Returns current job state: `queued`, `running`, `completed`, or `failed`.

### Poll job events (real-time style)

- `GET /api/reports-service/jobs/{jobId}/events?since=<ISO_TIMESTAMP>&limit=100`
- Returns ordered job lifecycle events to support live progress UIs.

## Error Model

Errors are returned in consistent JSON shape:

```json
{
  "message": "Human-readable error",
  "details": null
}
```
