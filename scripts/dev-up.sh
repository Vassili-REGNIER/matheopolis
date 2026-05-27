#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/../infra/docker-compose.dev.yml"

echo "Starting Matheopolis stack from ${COMPOSE_FILE}"
docker compose -f "${COMPOSE_FILE}" up -d --build

echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8080"
echo "MySQL:    localhost:3307"
