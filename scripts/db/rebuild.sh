#!/usr/bin/env bash
# Drop all tables and recreate schema, seed and quiz data (dev or prod).
# Usage: ./scripts/db/rebuild.sh dev|prod
# Set MATHEOPOLIS_DB_YES=1 to skip the production confirmation prompt.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DB_DIR="${ROOT_DIR}/backend/database"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
# shellcheck source=../lib/db-mysql.sh
source "${SCRIPT_DIR}/../lib/db-mysql.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <dev|prod>"
  exit 1
fi

MODE="$1"
require_db_mode "${MODE}"
load_matheopolis_env "${ROOT_DIR}" "${MODE}"
adjust_db_client_host "${MODE}"

for sql_file in \
  "${DB_DIR}/reset_tables.sql" \
  "${DB_DIR}/schema.sql" \
  "${DB_DIR}/seed.sql" \
  "${DB_DIR}/quiz.sql"; do
  if [[ ! -f "${sql_file}" ]]; then
    echo "Missing ${sql_file}"
    exit 1
  fi
done

confirm_db_action "Rebuilding all tables" "${MODE}"

echo "Rebuilding database ${DB_HOST}:${DB_PORT}/${DB_NAME} (${MODE})..."
mysql_apply_file "${DB_DIR}/reset_tables.sql"
mysql_apply_file "${DB_DIR}/schema.sql"
mysql_apply_file "${DB_DIR}/seed.sql"
mysql_apply_file "${DB_DIR}/quiz.sql"
echo "Database rebuild completed."
