#!/bin/bash
# RealWorldClaw Quickstart
# Usage: curl -fsSL https://realworldclaw.com/quickstart.sh | bash
# Or: ./scripts/quickstart.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLATFORM_DIR="$ROOT_DIR/platform"
FRONTEND_DIR="$ROOT_DIR/frontend"
STATE_DIR="$ROOT_DIR/.quickstart"
BACKEND_LOG="$STATE_DIR/backend.log"
FRONTEND_LOG="$STATE_DIR/frontend.log"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
FRONTEND_PID_FILE="$STATE_DIR/frontend.pid"

mkdir -p "$STATE_DIR"

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Missing dependency: $cmd"
    exit 1
  fi
}

check_python_version() {
  python3 - <<'PY'
import sys
if sys.version_info < (3, 10):
    raise SystemExit("❌ Python 3.10+ is required")
print(f"✅ Python {sys.version.split()[0]}")
PY
}

check_node_version() {
  local major
  major="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$major" -lt 18 ]; then
    echo "❌ Node.js 18+ is required (current: $(node --version))"
    exit 1
  fi
  echo "✅ Node $(node --version)"
}

start_backend() {
  echo "🚀 Starting backend API..."
  (
    cd "$PLATFORM_DIR"
    export DATABASE_URL="sqlite:///data/realworldclaw.db"

    if [ ! -d ".venv" ]; then
      python3 -m venv .venv
    fi

    source .venv/bin/activate
    python -m pip install --upgrade pip >/dev/null
    pip install -r requirements.txt >/dev/null

    python -m api.database >/dev/null

    nohup python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload >"$BACKEND_LOG" 2>&1 &
    echo $! >"$BACKEND_PID_FILE"
  )

  echo "✅ Backend PID: $(cat "$BACKEND_PID_FILE")"
}

start_frontend() {
  echo "🎨 Starting frontend dev server..."
  (
    cd "$FRONTEND_DIR"
    if [ -f package-lock.json ]; then
      npm ci >/dev/null
    else
      npm install >/dev/null
    fi

    nohup npm run dev >"$FRONTEND_LOG" 2>&1 &
    echo $! >"$FRONTEND_PID_FILE"
  )

  echo "✅ Frontend PID: $(cat "$FRONTEND_PID_FILE")"
}

open_browser() {
  local url="http://localhost:3000"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  else
    echo "ℹ️ Open manually: $url"
  fi
}

echo "🔍 Checking dependencies..."
require_cmd python3
require_cmd node
require_cmd git
check_python_version
check_node_version

echo "📦 Bootstrapping RealWorldClaw..."
start_backend
start_frontend
open_browser

echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "Docs:     http://localhost:8000/docs"
echo "Logs:     $BACKEND_LOG, $FRONTEND_LOG"
echo ""
echo "🎉 RealWorldClaw is running!"
