#!/usr/bin/env bash
set -euo pipefail

########################################
# CONFIG
########################################
STACK_DIR="/www/wwwroot/ixora/backend"
COMPOSE_FILE="$STACK_DIR/docker-compose.backend.yml"
LOG_FILE="/var/log/ixora-deploy.log"
SERVICE_NAME="api"

# Default repo for first-time clone (SSH recommended)
GIT_REMOTE="${GIT_REMOTE:-git@github.com:netinventmalaysia/ixora-backend.git}"

DOCKER_TIMEOUT_PULL="90s"
DOCKER_TIMEOUT_UP="90s"

########################################
# Logging & tracing
########################################
exec > >(tee -a "$LOG_FILE") 2>&1
ts() { date -Is; }

echo "[$(ts)] --- deploy start ---"

# Prevent concurrent runs
exec 9>/tmp/ixora-deploy.lock
flock -n 9 || { echo "Another deploy is running. Exit."; exit 1; }

########################################
# Go to stack dir
########################################
echo "[$(ts)] >>> Step 0: cd to $STACK_DIR"
cd "$STACK_DIR"

[[ -f "$COMPOSE_FILE" ]] || { echo "Compose not found: $COMPOSE_FILE"; exit 1; }
[[ -f ".env.production" ]] || { echo "Missing .env.production"; exit 1; }

########################################
# Git sync or clone
########################################
if git -C "$STACK_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[$(ts)] >>> Git sync (origin/main)"
  git -C "$STACK_DIR" config --local credential.helper "!" || true
  export GIT_ASKPASS=/bin/true
  export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10"
  timeout 60s git -C "$STACK_DIR" fetch --all --prune
  timeout 60s git -C "$STACK_DIR" reset --hard origin/main
else
  echo "[$(ts)] >>> Not a git repo at $STACK_DIR"
  if [[ -n "$GIT_REMOTE" ]]; then
    echo "[$(ts)] >>> Cloning from $GIT_REMOTE"
    if [[ -n "$(ls -A "$STACK_DIR" 2>/dev/null)" ]]; then
      BACKUP_DIR="${STACK_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
      mv "$STACK_DIR" "$BACKUP_DIR"
      mkdir -p "$STACK_DIR"
      echo "[$(ts)] >>> Moved old content to $BACKUP_DIR"
    fi
    timeout 120s git clone --depth=1 "$GIT_REMOTE" "$STACK_DIR"
  else
    echo "[$(ts)] !!! No repo found and GIT_REMOTE not set."
    exit 1
  fi
fi

########################################
# Pull and restart containers
########################################
echo "[$(ts)] >>> Pull latest Docker images"
timeout "$DOCKER_TIMEOUT_PULL" docker compose -f "$COMPOSE_FILE" pull || true

echo "[$(ts)] >>> Rebuild and start containers"
timeout "$DOCKER_TIMEOUT_UP" docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

########################################
# Done
########################################
echo "[$(ts)] ✅ Deploy completed successfully"
