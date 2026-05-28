#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../infra/docker-compose.dev.yml"
ENV_FILE="${SCRIPT_DIR}/../infra/.env.dev"

echo "Starting Matheopolis stack from ${COMPOSE_FILE}"
if [ -f "${ENV_FILE}" ]; then
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" up -d --build --remove-orphans --wait
else
  docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans --wait
fi

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8080"
echo "MySQL:    localhost:3307"
