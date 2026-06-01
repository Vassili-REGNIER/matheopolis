#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.prod.yml"
ENV_FILE="${ROOT_DIR}/.env"

echo "Stopping PROD-like stack..."
if [[ -f "${ENV_FILE}" ]]; then
  docker compose --env-file "${ENV_FILE}" -f "${COMPOSE_FILE}" down
else
  docker compose -f "${COMPOSE_FILE}" down
fi
echo "PROD-like stack stopped."
