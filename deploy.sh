#!/usr/bin/env bash
set -euo pipefail

STACK_DIR="/www/wwwroot/ixora/backend"
COMPOSE_FILE="$STACK_DIR/docker-compose.backend.yml"

cd "$STACK_DIR"

[ -f "$COMPOSE_FILE" ] || { echo "Compose not found"; exit 1; }
[ -f ".env.production" ] || { echo "Missing .env.production"; exit 1; }

echo ">>> Pull latest image"
docker compose -f "$COMPOSE_FILE" pull

echo ">>> Recreate containers"
docker compose -f "$COMPOSE_FILE" up -d

echo ">>> Run DB migrations"
docker compose -f "$COMPOSE_FILE" run --rm api npm run migration:run:prod

echo ">>> Cleanup old images"
docker image prune -f

echo ">>> Done"
