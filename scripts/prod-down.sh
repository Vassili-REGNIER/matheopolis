#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../infra/docker-compose.prod.yml"
ENV_FILE="${SCRIPT_DIR}/../infra/.env.prod"

echo "Stopping production stack from ${COMPOSE_FILE}"
if [ -f "${ENV_FILE}" ]; then
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down
else
  docker compose -f "${COMPOSE_FILE}" down
fi
echo "Production stack stopped."
