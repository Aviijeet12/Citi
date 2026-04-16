#!/bin/bash
# Master Orchestration Script for Unified Local Backend (Port 3001)

echo "--------------------------------------------------"
echo "🚀 ACME Workforce: Starting Unified Local Stack"
echo "--------------------------------------------------"

# 1. Purge processes
echo "[1/6] Purging stale processes on ports 3000, 3001..."
# First, attempt focused lsof kill
lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true

# Check if ports are still bound
for i in {1..3}; do
  STALE=$(lsof -ti:3000,3001)
  if [ -n "$STALE" ]; then
    echo "Wait, found lingering processes ($STALE). Retrying kill..."
    echo "$STALE" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    break
  fi
done

# Last resort fuser (if available)
fuser -k 3000/tcp 3001/tcp 2>/dev/null || true
sleep 1

# 2. Database Readiness
echo "[2/6] Checking PostgreSQL connectivity..."
if ! pg_isready -p 5432; then
  echo "⚠️ ERROR: PostgreSQL is not running on 5432. Please start it first."
  exit 1
fi
echo "✅ Database is ready."

# 3. Initialize Schema
echo "[3/6] Initializing/Verifying Database Schema..."
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGPASSWORD=postgres123
export PGDATABASE=postgres
node bin/init-db.js
echo "✅ Progressing..."

# 4. Environment Preparation
echo "[4/6] Sourcing environment configuration..."
if [ ! -f "ENVIRONMENT.config" ]; then
  echo "⚠️ ERROR: ENVIRONMENT.config not found."
  exit 1
fi
source ENVIRONMENT.config

export APP_URL=http://localhost:3000
export IS_LOCAL=true

# 5. Launch Unified Backend
echo "[5/6] Launching Unified Backend Server on port 3001..."
nohup node bin/backend-server.js > /tmp/backend.log 2>&1 &
echo "✅ Backend started. Logs: /tmp/backend.log"

# Update .env.local
cat <<EOF > frontend/.env.local
REACT_APP_API_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
EOF

# 6. Launch Frontend
echo "[6/6] Starting Frontend Development Server..."
echo "--------------------------------------------------"
echo "URL: http://localhost:3000"
echo "--------------------------------------------------"
cd frontend && npm run dev
