# Node.js Implementation Plan

## Current Repo Findings

- The repository is still a starter template, not an implemented product.
- `frontend/` is a default Vite React app and does not yet include routing, Material UI, RBAC screens, or business workflows.
- `backend/` only contains examples under `backend/_examples/`; those example services are ignored by Terraform because directories starting with `_` are not deployed.
- Terraform already supports Node.js Lambda services by auto-discovering `backend/<service>/package.json`.
- Cloud deployment is designed around:
  - S3 + CloudFront for frontend
  - One Lambda Function URL per backend service
  - CloudFront path routing from `/api/<service>` to the matching Lambda
  - Aurora PostgreSQL in AWS
- The repo helper scripts in `bin/` are mainly Ubuntu/bash oriented, so we should expect to add Windows-friendly local setup commands as we build.

## Local Environment Status

- Node.js is already installed: `v22.18.0`
- npm is already installed: `10.9.3`
- Frontend dependencies were installed with `npm install` in `frontend/`
- Terraform was installed: `v1.14.8`
- AWS CLI was installed: `2.34.30`
- LocalStack CLI was installed: `2026.3.0`
- Docker Desktop was started successfully
- A dedicated workshop PostgreSQL instance is running locally in Docker:
  - container: `workshop-postgres`
  - host port: `5433`
  - database: `postgres`
  - username: `postgres`
  - password: `postgres123`
- Important local issue:
  - port `5432` is already occupied by another container (`qa-agent-ui-db-1`)
  - the workshop Terraform defaults assume local PostgreSQL is reachable on `5432`
  - we should either free `5432` later or update local config/scripts to use `5433`

## Recommended Code Structure

This repo has one important deployment rule: every deployable Node.js microservice must live directly under `backend/` and contain its own `package.json`.

Recommended structure:

```text
coding-workshop-participant/
├── backend/
│   ├── auth-service/
│   ├── users-service/
│   ├── teams-service/
│   ├── achievements-service/
│   ├── metadata-service/
│   ├── reports-service/
│   └── _examples/
├── packages/
│   ├── shared-core/
│   ├── shared-db/
│   ├── shared-auth/
│   ├── shared-http/
│   └── shared-validation/
├── frontend/
└── infra/
```

Notes:

- Keep deployable services as direct children of `backend/`
- Put reusable Node.js libraries under `packages/`, not directly under `backend/`
- Avoid adding reusable code under `backend/` with its own `package.json`, because Terraform may treat it as a Lambda service

## Recommended Microservices

### 1. `auth-service`

Responsibilities:

- login
- refresh token
- password hashing
- JWT issuing and validation helpers
- bootstrap admin account

Suggested endpoints:

- `POST /auth-service/login`
- `POST /auth-service/refresh`
- `POST /auth-service/logout`
- `GET /auth-service/me`

### 2. `users-service`

Responsibilities:

- user CRUD
- assign role to user
- activate/deactivate users

Suggested endpoints:

- `GET /users-service`
- `GET /users-service/{id}`
- `POST /users-service`
- `PUT /users-service/{id}`
- `DELETE /users-service/{id}`

### 3. `teams-service`

Responsibilities:

- team CRUD
- team leader assignment
- team member assignments
- location and reporting relationships

Suggested endpoints:

- `GET /teams-service`
- `GET /teams-service/{id}`
- `POST /teams-service`
- `PUT /teams-service/{id}`
- `DELETE /teams-service/{id}`

### 4. `achievements-service`

Responsibilities:

- monthly achievements CRUD
- filtering by month, team, owner

### 5. `metadata-service`

Responsibilities:

- store individual and team metadata
- controlled metadata keys and values

### 6. `reports-service`

Responsibilities:

- derived business questions from workshop brief
- aggregate views and statistics

Examples:

- teams where leader is not co-located
- teams with non-direct staff ratio above 20%
- teams reporting to an organization leader

## RBAC Model

Recommended initial roles:

- `admin`: full access including users and roles
- `manager`: manage teams, achievements, metadata, read users
- `contributor`: create/update domain records, no delete for protected resources
- `viewer`: read-only

Recommended permissions model:

- store roles in database
- store permissions as explicit action keys
- enforce authorization in backend middleware
- also hide or disable restricted frontend actions

Suggested permission keys:

- `users.read`
- `users.write`
- `users.delete`
- `roles.manage`
- `teams.read`
- `teams.write`
- `teams.delete`
- `achievements.read`
- `achievements.write`
- `achievements.delete`
- `metadata.read`
- `metadata.write`
- `metadata.delete`
- `reports.read`

## Recommended Database Scope

Minimum PostgreSQL tables:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `teams`
- `team_members`
- `team_locations`
- `achievements`
- `metadata_definitions`
- `metadata_values`
- `refresh_tokens`
- `audit_logs`

Likely useful columns:

- UUID primary keys
- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- soft delete or `is_active` flags where appropriate

## Step-by-Step To-Do List

### Phase 1: Local Dev Alignment

- Decide whether to standardize local PostgreSQL on `5432` or keep `5433`
- Add Windows-friendly setup notes or scripts for this repo
- Confirm Docker Desktop and LocalStack startup workflow on this machine
- Create per-service environment conventions for local and AWS

### Phase 2: Backend Foundation

- Create a root Node.js workspace strategy for `backend/` services plus `packages/`
- Create shared packages for:
  - database access
  - auth/JWT helpers
  - response formatting
  - validation
  - RBAC middleware
- Choose backend libraries
  - `pg`
  - validation library such as `zod`
  - password hashing such as `bcrypt` or `argon2`
  - JWT library
- Define a standard Lambda handler pattern for all services
- Standardize success and error response shapes

### Phase 3: Database

- Design the relational schema
- Add SQL migrations
- Add seed data for:
  - default roles
  - permissions
  - first admin user
- Add local database bootstrap instructions

### Phase 4: Authentication and RBAC

- Implement login flow
- Implement password hashing
- Implement JWT access tokens
- Implement refresh tokens
- Implement auth middleware
- Implement role/permission checks
- Prevent privilege escalation in user and role management

### Phase 5: Domain Microservices

- Implement `users-service`
- Implement `teams-service`
- Implement `achievements-service`
- Implement `metadata-service`
- Implement `reports-service`
- Add filtering, search, pagination, and validation

### Phase 6: Frontend Application

- Replace the default Vite demo UI
- Add routing
- Add Material UI and responsive layout
- Build login screen
- Build dashboard
- Build users management screens
- Build teams management screens
- Build achievements screens
- Build metadata screens
- Build reports screens
- Add role-aware navigation and guarded actions

### Phase 7: Testing

- Backend unit tests
- Backend integration tests against local PostgreSQL
- Auth and RBAC tests
- Frontend component tests
- Frontend API service tests
- End-to-end tests for critical workflows

### Phase 8: Deployment

- Create actual deployable Node.js service folders under `backend/`
- Verify Terraform packaging for each service
- Verify CloudFront path routing for every service
- Align local and cloud environment variables
- Document deploy steps for backend and frontend

### Phase 9: Documentation and Submission Readiness

- Update root README with Node.js setup instead of generic starter wording
- Document API endpoints
- Document local startup flow for Windows
- Document known issues and assumptions
- Prepare a self-assessment against workshop evaluation criteria

## Recommended Build Order

1. Lock the local PostgreSQL port strategy
2. Set up Node.js shared packages and backend service skeletons
3. Implement database migrations and seed data
4. Implement `auth-service` and RBAC middleware
5. Implement `users-service`
6. Implement `teams-service`
7. Implement `achievements-service`
8. Implement `metadata-service`
9. Implement `reports-service`
10. Build the frontend around those APIs
11. Add tests
12. Validate AWS deployment

## Immediate Next Tasks

- Create the Node.js workspace and shared package layout
- Scaffold the first real Lambda services under `backend/`
- Add PostgreSQL migration and seed support
- Implement authentication and RBAC first, before building domain CRUD
