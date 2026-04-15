Prisma Setup For backend-common

Purpose
- This folder defines the PostgreSQL schema used by all backend services through packages/backend-common.
- Existing runtime bootstrap in index.js (ensureSchema) still works.
- Prisma is now added for schema validation, client generation, and migrations.

Environment Variables
- DATABASE_URL (preferred)
- Or POSTGRES_HOST, POSTGRES_PORT, POSTGRES_NAME, POSTGRES_USER, POSTGRES_PASS (used by prisma/client.js to build DATABASE_URL)

Quick Start
1. Install dependencies in packages/backend-common.
2. Set DATABASE_URL.
3. Run Prisma commands.

Commands (run in packages/backend-common)
- npm run prisma:validate
- npm run prisma:generate
- npm run prisma:migrate:dev
- npm run prisma:migrate:deploy
- npm run prisma:db:push

Migration Guidance
- Fresh database (recommended): use prisma:migrate:deploy.
- Existing database with tables already created by ensureSchema: do not run init migration directly, because tables already exist.

Fresh Database Flow
1. Set DATABASE_URL.
2. Run npm run prisma:migrate:deploy.
3. Run npm run prisma:generate.

Existing Database Flow
1. Set DATABASE_URL.
2. Run npm run prisma:db:push to align schema without replaying init SQL.
3. Run npm run prisma:generate.

Ubuntu Example
- export DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/postgres?schema=public&sslmode=disable"
- npm run prisma:validate
- npm run prisma:generate

Notes
- If your app still uses runtime ensureSchema in index.js, keep it during transition.
- Long term, prefer Prisma migrations as source of truth and then reduce manual SQL bootstrap logic.
