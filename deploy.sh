#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="/www/wwwroot/ixora/backend"
COMPOSE_FILE="$STACK_DIR/docker-compose.backend.yml"
LOG_FILE="/tmp/ixora-deploy.log"

# Enable shell trace to the log (not to stdout)
{
  exec {TRACE_FD}>>"$LOG_FILE" || true
  export BASH_XTRACEFD=$TRACE_FD
  export PS4='+ [${EPOCHREALTIME}] ${BASH_SOURCE##*/}:${LINENO}: '
  set -x
} 2>/dev/null || true

{
  echo "[$(date -Is)] --- deploy start ---"

  # Prevent concurrent runs
  exec 9>/tmp/ixora-deploy.lock
  flock -n 9 || { echo "Another deploy is running. Exit."; exit 1; }

  echo ">>> Step 0: cd to $STACK_DIR"
  cd "$STACK_DIR"

  echo ">>> Step 0a: sanity checks"
  [ -f "$COMPOSE_FILE" ] || { echo "Compose not found: $COMPOSE_FILE"; exit 1; }
  [ -f ".env.production" ] || { echo "Missing .env.production"; exit 1; }

  # Git can hang if it prompts for creds; disable prompts and set a timeout
  if [ -d ".git" ]; then
    echo ">>> Git sync (origin/main)"
    git config --local credential.helper "!"        # disable helper
    export GIT_ASKPASS=/bin/true
    export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10"

    timeout 60s git clean -fd || echo "git clean timeout (continuing)"
    timeout 60s git fetch --all --prune || echo "git fetch timeout (continuing)"
    timeout 60s git reset --hard origin/main || echo "git reset timeout (continuing)"
  else
    echo ">>> No .git found here; skipping git sync"
  fi

  echo ">>> Pull latest image (60s timeout)"
  timeout 60s docker compose -f "$COMPOSE_FILE" pull || echo "compose pull timeout (continuing)"

  echo ">>> Recreate containers (60s timeout)"
  timeout 60s docker compose -f "$COMPOSE_FILE" up -d --remove-orphans || echo "compose up timeout (continuing)"

  echo ">>> Run DB migrations (120s timeout)"
  timeout 120s docker compose -f "$COMPOSE_FILE" run --rm api npm run migration:run:prod || echo "migrations failed/none (continuing)"

  echo ">>> Cleanup old images"
  docker image prune -f >/dev/null 2>&1 || true

  echo "[$(date -Is)] --- deploy done ---"
} | tee -a "$LOG_FILE"
