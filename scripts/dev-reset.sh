#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../infra/docker-compose.dev.yml"
ENV_FILE="${SCRIPT_DIR}/../infra/.env.dev"

echo "Resetting local dev stack and database volume..."
if [ -f "${ENV_FILE}" ]; then
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down -v --remove-orphans
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build --wait
else
  docker compose -f "${COMPOSE_FILE}" down -v --remove-orphans
  docker compose -f "${COMPOSE_FILE}" up -d --build --wait
fi
echo "Local dev stack reset completed."
