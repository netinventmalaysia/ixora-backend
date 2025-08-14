#!/usr/bin/env bash
set -euo pipefail

########################################
# CONFIG — Tweak these if needed
########################################
STACK_DIR="/www/wwwroot/ixora/backend"
COMPOSE_FILE="$STACK_DIR/docker-compose.backend.yml"
LOG_FILE="/var/log/ixora-deploy.log"             # use /tmp/... if you prefer
SERVICE_NAME="api"                                # docker compose service running your app

# TypeORM generate settings (adjust to your project layout/cli)
# Old TypeORM (<=0.3) examples (ts-node):  npm run typeorm -- migration:generate ./src/migrations/Name -d ./src/data-source.ts
# Newer TypeORM CLI:                       npx typeorm migration:generate ./src/migrations/Name -d ./src/data-source.ts
TYPEORM_GENERATE_CMD=(npm run typeorm --)        # change to (npx typeorm) if you use the new CLI
TYPEORM_RUN_SCRIPT="migration:run:prod"          # npm script that runs production migrations

MIGRATIONS_DIR="./src/migrations"                # where to write migration files
TYPEORM_DATASOURCE="./src/data-source.ts"        # your DataSource file (ts or js)

# Behavior toggles
GENERATE_MIGRATION="${GENERATE_MIGRATION:-1}"    # set to 0 to skip generation
RUN_MIGRATIONS="${RUN_MIGRATIONS:-1}"            # set to 0 to skip running migrations
PRUNE_IMAGES="${PRUNE_IMAGES:-1}"                # set to 0 to skip docker image prune
DOCKER_TIMEOUT_PULL="90s"
DOCKER_TIMEOUT_UP="90s"
MIGRATE_TIMEOUT="180s"
GENERATE_TIMEOUT="120s"

########################################
# Tracing & logging
########################################
# Shell xtrace to the log (not stdout)
{
  exec {TRACE_FD}>>"$LOG_FILE" || true
  export BASH_XTRACEFD=$TRACE_FD
  export PS4='+ [${EPOCHREALTIME}] ${BASH_SOURCE##*/}:${LINENO}: '
  set -x
} 2>/dev/null || true

# Also tee main steps to log
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
# Git sync (public repo ok; private needs creds/SSH)
########################################
if [[ -d ".git" ]]; then
  echo "[$(ts)] >>> Git sync (origin/main)"
  # Prevent interactive prompts that would hang
  git config --local credential.helper "!"
  export GIT_ASKPASS=/bin/true
  export GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=10"

  timeout 60s git clean -fd
  timeout 60s git fetch --all --prune
  timeout 60s git reset --hard origin/main
else
  echo "[$(ts)] >>> No .git found here; skipping git sync"
fi

########################################
# (Optional) Generate migration from current code
########################################
if [[ "$GENERATE_MIGRATION" == "1" ]]; then
  echo "[$(ts)] >>> Generate migration file (TypeORM)"
  MIG_NAME="AutoMigration_$(date +%Y%m%d_%H%M%S)"
  # Ensure dir exists
  mkdir -p "$MIGRATIONS_DIR"

  # Run inside a one-off container that has your build environment
  # Adjust the command for your CLI if needed
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
  # Prefer exec so it runs in the existing container/network/env
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
