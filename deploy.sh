#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="/www/wwwroot/ixora/backend"
COMPOSE_FILE="$STACK_DIR/docker-compose.backend.yml"
LOG_FILE="/tmp/ixora-deploy.log"

echo "[$(date -Is)] --- deploy start ---" | tee -a "$LOG_FILE"

cd "$STACK_DIR"

# --- 0) sanity checks
[ -f "$COMPOSE_FILE" ] || { echo "Compose not found: $COMPOSE_FILE" | tee -a "$LOG_FILE"; exit 1; }
[ -f ".env.production" ] || { echo "Missing .env.production" | tee -a "$LOG_FILE"; exit 1; }

# --- 1) sync working tree from GitHub (optional if .git exists)
if [ -d ".git" ]; then
  echo ">>> Git sync (origin/main)" | tee -a "$LOG_FILE"
  # Ensure correct ownership (prevents permission errors if root touched files)
  chown -R "$(id -u)":"$(id -g)" . >/dev/null 2>&1 || true

  # Be explicit about remote (in case it was HTTP before)
  # git remote set-url origin git@github.com:netinventmalaysia/ixora-backend.git || true

  # Clean untracked and reset to remote main
  git clean -fd
  git fetch --all --prune
  git reset --hard origin/main
else
  echo ">>> No .git found here; skipping git sync" | tee -a "$LOG_FILE"
fi

# --- 2) pull image & recreate
echo ">>> Pull latest image" | tee -a "$LOG_FILE"
docker compose -f "$COMPOSE_FILE" pull

echo ">>> Recreate containers" | tee -a "$LOG_FILE"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# --- 3) migrations
echo ">>> Run DB migrations" | tee -a "$LOG_FILE"
# Do not fail whole deploy if migrations say "No migrations are pending"
docker compose -f "$COMPOSE_FILE" run --rm api npm run migration:run:prod || true

# --- 4) cleanup
echo ">>> Cleanup old images" | tee -a "$LOG_FILE"
docker image prune -f >/dev/null 2>&1 || true

echo "[$(date -Is)] --- deploy done ---" | tee -a "$LOG_FILE"
