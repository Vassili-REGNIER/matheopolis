#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../infra/docker-compose.prod.yml"
ENV_FILE="${SCRIPT_DIR}/../infra/.env.prod"

if [ ! -f "${ENV_FILE}" ]; then
  echo "Missing ${ENV_FILE}. Copy infra/.env.prod.example to infra/.env.prod first."
  exit 1
fi

echo "Starting production stack with local MySQL profile..."
docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" --profile with-local-mysql up -d --build
echo "Production stack with local MySQL is running."
