#!/usr/bin/env bash
# Start a PROD-like local Docker stack against the AlwaysData PRODUCTION database.
# Reads PROD_* from ${REPO_ROOT}/.env. Use with care — live production data.
# Usage: ./scripts/stack/prod-up.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.prod.yml"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
load_matheopolis_env "${ROOT_DIR}" prod

echo "Starting PROD-like stack (AlwaysData PRODUCTION database)"
echo "  App: http://localhost:${FRONTEND_PUBLIC_PORT}"
echo "  DB:  ${DB_HOST}/${DB_NAME}"

docker compose -f "${COMPOSE_FILE}" up -d --build --wait

echo "PROD-like stack is running."
