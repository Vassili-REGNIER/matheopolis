#!/usr/bin/env bash
# Drop all tables and recreate schema + seed data (dev or prod).
# Usage: ./scripts/db/rebuild.sh dev|prod
# Set MATHEOPOLIS_DB_YES=1 to skip the production confirmation prompt.
# Set MATHEOPOLIS_INCLUDE_DEMO=0 to load production content without demo accounts.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
DB_DIR="${ROOT_DIR}/backend/database"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
# shellcheck source=../lib/db-mysql.sh
source "${SCRIPT_DIR}/../lib/db-mysql.sh"
# shellcheck source=../lib/db-seed-files.sh
source "${SCRIPT_DIR}/../lib/db-seed-files.sh"

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <dev|prod>"
  exit 1
fi

MODE="$1"
require_db_mode "${MODE}"
load_matheopolis_env "${ROOT_DIR}" "${MODE}"
adjust_db_client_host "${MODE}"

for sql_file in "${DB_DIR}/reset_tables.sql" "${DB_DIR}/schema.sql"; do
  if [[ ! -f "${sql_file}" ]]; then
    echo "Missing ${sql_file}"
    exit 1
  fi
done

if ! db_verify_seed_files; then
  exit 1
fi

confirm_db_action "Rebuilding all tables" "${MODE}"

echo "Rebuilding database ${DB_HOST}:${DB_PORT}/${DB_NAME} (${MODE})..."
mysql_apply_file "${DB_DIR}/reset_tables.sql"
mysql_apply_file "${DB_DIR}/schema.sql"
db_apply_seed_files
echo "Database rebuild completed."
