#!/usr/bin/env bash
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

if [[ ! -f "${SCHEMA_FILE}" || ! -f "${SEED_FILE}" ]]; then
  echo "Missing schema or seed SQL under backend/database/."
  exit 1
fi

echo "Applying schema and seed to ${DB_HOST}/${DB_NAME} (${MODE})..."
docker run --rm -i \
  mysql:8.4 \
  mysql \
  -h "${DB_HOST}" \
  -P "${DB_PORT}" \
  -u "${DB_USER}" \
  -p"${DB_PASS}" \
  "${DB_NAME}" \
  < "${SCHEMA_FILE}"

docker run --rm -i \
  mysql:8.4 \
  mysql \
  -h "${DB_HOST}" \
  -P "${DB_PORT}" \
  -u "${DB_USER}" \
  -p"${DB_PASS}" \
  "${DB_NAME}" \
  < "${SEED_FILE}"

echo "Database schema and seed applied."
