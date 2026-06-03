#!/usr/bin/env bash
# Apply backend/database/schema.sql and seed.sql to the database configured in .env.
# Target is chosen by argument: "dev" (DEV_DB_* / local when USE_LOCAL_MYSQL=1) or
# "prod" (PROD_DB_*). Works against AlwaysData remote hosts and local MySQL (published port).
# Requires Docker (runs a temporary mysql:8.4 client container). Remote MySQL must allow
# connections from your machine/Docker network (AlwaysData: enable remote access).
# Usage: ./scripts/db-apply.sh dev|prod
set -euo pipefail

usage() {
  echo "Usage: $0 <dev|prod>"
  echo "Applies backend/database/schema.sql and seed.sql to the configured database."
  exit 1
}

if [[ $# -ne 1 ]]; then
  usage
fi

MODE="$1"
if [[ "${MODE}" != "dev" && "${MODE}" != "prod" ]]; then
  usage
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SCHEMA_FILE="${ROOT_DIR}/backend/database/schema.sql"
SEED_FILE="${ROOT_DIR}/backend/database/seed.sql"

# shellcheck source=lib/load-env.sh
source "${SCRIPT_DIR}/lib/load-env.sh"
load_matheopolis_env "${ROOT_DIR}" "${MODE}"

# When dev uses local MySQL, the compose service hostname "mysql" is not reachable from
# an ephemeral client container; use the host-published port instead.
if [[ "${MODE}" == "dev" && "${USE_LOCAL_MYSQL:-0}" == "1" ]]; then
  DB_HOST="host.docker.internal"
  DB_PORT="${MYSQL_PORT:-3307}"
fi

if [[ ! -f "${SCHEMA_FILE}" || ! -f "${SEED_FILE}" ]]; then
  echo "Missing schema or seed SQL under backend/database/."
  exit 1
fi

echo "Applying schema and seed to ${DB_HOST}:${DB_PORT}/${DB_NAME} (${MODE})..."
docker run --rm -i \
  --add-host=host.docker.internal:host-gateway \
  mysql:8.4 \
  mysql \
  -h "${DB_HOST}" \
  -P "${DB_PORT}" \
  -u "${DB_USER}" \
  -p"${DB_PASS}" \
  "${DB_NAME}" \
  < "${SCHEMA_FILE}"

docker run --rm -i \
  --add-host=host.docker.internal:host-gateway \
  mysql:8.4 \
  mysql \
  -h "${DB_HOST}" \
  -P "${DB_PORT}" \
  -u "${DB_USER}" \
  -p"${DB_PASS}" \
  "${DB_NAME}" \
  < "${SEED_FILE}"

echo "Database schema and seed applied."
