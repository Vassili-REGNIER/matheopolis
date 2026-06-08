#!/usr/bin/env bash
# Apply schema and seed SQL to the configured database (dev or prod).
# Usage: ./scripts/db/apply.sh dev|prod
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

if [[ ! -f "${DB_DIR}/schema.sql" ]]; then
  echo "Missing ${DB_DIR}/schema.sql"
  exit 1
fi

if ! db_verify_seed_files; then
  exit 1
fi

confirm_db_action "Applying schema + seed data" "${MODE}"

echo "Applying database files to ${DB_HOST}:${DB_PORT}/${DB_NAME} (${MODE})..."
mysql_apply_file "${DB_DIR}/schema.sql"
db_apply_seed_files
echo "Database apply completed."
