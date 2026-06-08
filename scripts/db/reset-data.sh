#!/usr/bin/env bash
# Clear demo rows and re-apply demo seed data (dev or prod).
# Production content (chapters, Laurence quiz) is preserved.
# Usage: ./scripts/db/reset-data.sh dev|prod
# Set MATHEOPOLIS_DB_YES=1 to skip the production confirmation prompt.
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

if [[ ! -f "${DB_DIR}/reset_entries-demo.sql" ]]; then
  echo "Missing ${DB_DIR}/reset_entries-demo.sql"
  exit 1
fi

if ! db_include_demo; then
  echo "Demo seed is disabled (MATHEOPOLIS_INCLUDE_DEMO=0); nothing to reset."
  exit 1
fi

if ! db_verify_seed_files; then
  exit 1
fi

confirm_db_action "Resetting demo data" "${MODE}"

echo "Resetting demo data on ${DB_HOST}:${DB_PORT}/${DB_NAME} (${MODE})..."
mysql_apply_file "${DB_DIR}/reset_entries-demo.sql"
db_reapply_demo_after_reset
echo "Demo data reset completed."
