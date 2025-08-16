#!/usr/bin/env bash
set -Eeuo pipefail

LOG_FILE="/tmp/ixora-backend-deploy.log"
mkdir -p /tmp >/dev/null 2>&1 || true
exec > >(tee -a "$LOG_FILE") 2>&1
echo ""
echo "[$(date -Is)] --- backend deploy start ---"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="${STACK_DIR:-$SCRIPT_DIR}"
COMPOSE_FILE="${COMPOSE_FILE:-$STACK_DIR/docker-compose.backend.yml}"
SERVICE="${SERVICE:-api}"
DEFAULT_IMG="${DEFAULT_IMG:-ghcr.io/netinventmalaysia/ixora-backend:prod}"

DOCKER_BIN="${DOCKER_BIN:-$(command -v docker || true)}"
[ -n "$DOCKER_BIN" ] || { echo "ERROR: docker not found"; exit 1; }

if $DOCKER_BIN compose version >/dev/null 2>&1; then
  COMPOSE_CMD="$DOCKER_BIN compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="$(command -v docker-compose)"
else
  echo "ERROR: docker compose/docker-compose not found"; exit 1
fi

echo "docker: $DOCKER_BIN"
echo "compose: $COMPOSE_CMD"
echo "compose file: $COMPOSE_FILE"
[ -f "$COMPOSE_FILE" ] || { echo "ERROR: compose file not found"; exit 1; }

# Digest from env/arg/query
DIGEST="${DIGEST:-}"
[ -z "${DIGEST}" ] && [ "${1-}" != "" ] && DIGEST="$1"
[ -n "${DIGEST}" ] && ! printf '%s' "$DIGEST" | grep -q '^sha256:' && DIGEST=""

# GHCR login if private (uncomment and provide PAT)
# echo "$GHCR_TOKEN" | "$DOCKER_BIN" login ghcr.io -u netinventmalaysia --password-stdin || true

if [ -n "$DIGEST" ]; then
  IMAGE_REF="ghcr.io/netinventmalaysia/ixora-backend@${DIGEST}"
  echo ">>> Pull pinned digest: $IMAGE_REF"
  "$DOCKER_BIN" pull "$IMAGE_REF"
else
  IMAGE_REF="$DEFAULT_IMG"
  echo ">>> Pull tag: $IMAGE_REF"
  "$DOCKER_BIN" pull "$IMAGE_REF"
fi
export IMAGE_REF

echo ">>> Up -d (force recreate, always pull)"
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d --pull always --no-deps --force-recreate "$SERVICE"

CID="$("$DOCKER_BIN" ps -q -f "name=mbmbgo-api" || true)"
if [ -n "$CID" ]; then
  RUN_IMG_ID="$("$DOCKER_BIN" inspect --format='{{.Image}}' "$CID")"
  echo "Running image ID: $RUN_IMG_ID"
  if "$DOCKER_BIN" image inspect "$IMAGE_REF" >/dev/null 2>&1; then
    TAG_DIGEST="$("$DOCKER_BIN" image inspect "$IMAGE_REF" --format='{{index .RepoDigests 0}}' || true)"
    echo "Resolved repo digest: $TAG_DIGEST"
    RUN_REPO_DIGEST="$("$DOCKER_BIN" image inspect "$RUN_IMG_ID" --format='{{index .RepoDigests 0}}' || true)"
    echo "Running repo digest:  ${RUN_REPO_DIGEST:-<unknown>}"
  fi
fi

echo ">>> Prune dangling images"
"$DOCKER_BIN" image prune -f || true

echo "[$(date -Is)] --- backend deploy done ---"
