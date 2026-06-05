#!/usr/bin/env bash
# Start the local DEV Docker stack (frontend hot-reload + backend API).
# Reads ${REPO_ROOT}/.env (DEV_* / USE_LOCAL_MYSQL). Default DB: AlwaysData test;
# set USE_LOCAL_MYSQL=1 for the optional local MySQL container.
# Usage: ./scripts/stack/dev-up.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.dev.yml"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
load_matheopolis_env "${ROOT_DIR}" dev

profiles="$(compose_dev_profiles)"
if [[ -n "${profiles}" ]]; then
  export COMPOSE_PROFILES="${profiles}"
fi

echo "Starting Matheopolis DEV stack (${COMPOSE_FILE})"
if [[ "${USE_LOCAL_MYSQL}" == "1" ]]; then
  echo "Database: local MySQL container (profile: local-mysql)"
else
  echo "Database: remote ${DB_HOST}/${DB_NAME}"
fi

docker compose -f "${COMPOSE_FILE}" up -d --build --remove-orphans --wait

echo ""
echo "Stack is up:"
echo "  App (frontend + API proxy): http://localhost:${FRONTEND_PORT}"
echo "  Backend API (direct):       http://localhost:${BACKEND_PORT}/api/health"
if [[ "${USE_LOCAL_MYSQL}" == "1" ]]; then
  echo "  MySQL (local):              localhost:${MYSQL_PORT:-3307}"
fi
echo ""
echo "First-time remote DB: run ./scripts/db/apply.sh dev"
