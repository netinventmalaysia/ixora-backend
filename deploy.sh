#!/usr/bin/env bash
set -euo pipefail

########################################
# CONFIG — Tweak these if needed
########################################
STACK_DIR="/www/wwwroot/ixora/backend"
COMPOSE_FILE="$STACK_DIR/docker-compose.backend.yml"
LOG_FILE="/var/log/ixora-deploy.log"
SERVICE_NAME="api"

# Optional: set to your remote to auto-clone if not a repo (SSH recommended)
# export GIT_REMOTE="git@github.com:netinventmalaysia/ixora-backend.git"
GIT_REMOTE="${GIT_REMOTE:-}"

# TypeORM generate/run settings
TYPEORM_GENERATE_CMD=(npm run typeorm --)        # or: (npx typeorm)
TYPEORM_RUN_SCRIPT="migration:run:prod"
MIGRATIONS_DIR="./src/migrations"
TYPEORM_DATASOURCE="./src/data-source.ts"

# Behavior toggles
GENERATE_MIGRATION="${GENERATE_MIGRATION:-1}"
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"
PRUNE_IMAGES="${PRUNE_IMAGES:-1}"
DOCKER_TIMEOUT_PULL="90s"
DOCKER_TIMEOUT_UP="90s"
MIGRATE_TIMEOUT="180s"
GENERATE_TIMEOUT="120s"

########################################
# Tracing & logging
########################################
{
  exec {TRACE_FD}>>"$LOG_FILE" || true
  export BASH_XTRACEFD=$TRACE_FD
  export PS4='+ [${EPOCHREALTIME}] ${BASH_SOURCE##*/}:${LINENO}: '
  set -x
} 2>/dev/null || true
exec > >(tee -a "$LOG_FILE") 2>&1
ts() { date -Is; }

cleanup() {
  local ec=$?
  if [[ $ec -ne 0 ]]; then
    echo "[$(ts)] !!! Deploy failed with exit code $ec"
  else
    echo "[$(ts)] --- deploy done ---"
  fi
  exit $ec
}
trap cleanup EXIT INT TERM

echo "[$(ts)] --- deploy start ---"

########################################
# Single-run lock
########################################
exec 9>/tmp/ixora-deploy.lock
if ! flock -n 9; then
  echo "[$(ts)] Another deploy is running. Exit."
  exit 1
fi

########################################
# Sanity + cd
########################################
echo "[$(ts)] >>> Step 0: cd to $STACK_DIR"
cd "$STACK_DIR"

echo "[$(ts)] >>> Step 0a: sanity checks"
[[ -f "$COMPOSE_FILE" ]] || { echo "Compose not found: $COMPOSE_FILE"; exit 1; }
[[ -f ".env.production" ]] || { echo "Missing .env.production"; exit 1; }

########################################
# Git sync (robust)
########################################
if git -C "$STACK_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[$(ts)] >>> Git sync (origin/main)"
  # prevent interactive prompts
  git -C "$STACK_DIR" config --local credential.helper "!" || true
  export GIT_ASKPASS=/bin/true
  export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10"

  timeout 60s git -C "$STACK_DIR" clean -fd
  timeout 60s git -C "$STACK_DIR" fetch --all --prune
  timeout 60s git -C "$STACK_DIR" reset --hard origin/main
else
  echo "[$(ts)] >>> Not a git repo at $STACK_DIR"
  if [[ -n "$GIT_REMOTE" ]]; then
    echo "[$(ts)] >>> Auto-clone from $GIT_REMOTE"
    # If directory is non-empty and not a repo, move it aside to avoid conflicts
    if [[ -z "$(ls -A "$STACK_DIR" 2>/dev/null)" ]]; then
      :
    else
      echo "[$(ts)] >>> $STACK_DIR not empty. Moving to backup..."
      BACKUP_DIR="${STACK_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
      mv "$STACK_DIR" "$BACKUP_DIR"
      mkdir -p "$STACK_DIR"
      echo "[$(ts)] >>> Original moved to $BACKUP_DIR"
    fi
    timeout 120s git clone --depth=1 "$GIT_REMOTE" "$STACK_DIR"
    echo "[$(ts)] >>> Clone completed"
  else
    echo "[$(ts)] !!! No repo found and GIT_REMOTE not set. Skipping git sync."
  fi
fi

########################################
# (Optional) Generate migration
########################################
if [[ "$GENERATE_MIGRATION" == "1" ]]; then
  echo "[$(ts)] >>> Generate migration file (TypeORM)"
  MIG_NAME="AutoMigration_$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$MIGRATIONS_DIR"

  timeout "$GENERATE_TIMEOUT" \
    docker compose -f "$COMPOSE_FILE" run --rm "$SERVICE_NAME" \
      "${TYPEORM_GENERATE_CMD[@]}" migration:generate \
      "$MIGRATIONS_DIR/$MIG_NAME" -d "$TYPEORM_DATASOURCE"

  echo "[$(ts)] >>> Migration generated: $MIGRATIONS_DIR/$MIG_NAME"
else
  echo "[$(ts)] >>> Skip migration generation (GENERATE_MIGRATION=0)"
fi

########################################
# Pull latest images & recreate containers
########################################
echo "[$(ts)] >>> Pull latest images"
timeout "$DOCKER_TIMEOUT_PULL" docker compose -f "$COMPOSE_FILE" pull

echo "[$(ts)] >>> Recreate containers"
timeout "$DOCKER_TIMEOUT_UP" docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

########################################
# Run DB migrations (inside running container)
########################################
if [[ "$RUN_MIGRATIONS" == "1" ]]; then
  echo "[$(ts)] >>> Run DB migrations"
  timeout "$MIGRATE_TIMEOUT" docker compose -f "$COMPOSE_FILE" exec -T "$SERVICE_NAME" npm run "$TYPEORM_RUN_SCRIPT"
else
  echo "[$(ts)] >>> Skip running migrations (RUN_MIGRATIONS=0)"
fi

########################################
# Cleanup
########################################
if [[ "$PRUNE_IMAGES" == "1" ]]; then
  echo "[$(ts)] >>> Cleanup old images (dangling only)"
  docker image prune -f >/dev/null 2>&1 || true
fi

echo "[$(ts)] ✅ All steps completed"
