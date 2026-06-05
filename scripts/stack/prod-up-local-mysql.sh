#!/usr/bin/env bash
# Start the PROD-like stack with a LOCAL MySQL container (not AlwaysData).
# Useful to test prod Docker images without touching remote production data.
# Usage: ./scripts/stack/prod-up-local-mysql.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.prod.yml"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
load_matheopolis_env "${ROOT_DIR}" prod

export COMPOSE_PROFILES="local-mysql"
export DB_HOST="mysql"
export DB_PORT="3306"
export DB_NAME="${LOCAL_DB_NAME:-matheopolis}"
export DB_USER="${LOCAL_DB_USER:-matheopolis}"
export DB_PASS="${LOCAL_DB_PASS:-matheopolis}"
export MYSQL_ROOT_PASSWORD="${LOCAL_MYSQL_ROOT_PASSWORD:-root}"

echo "Starting PROD-like stack with LOCAL MySQL (not AlwaysData)..."
docker compose -f "${COMPOSE_FILE}" up -d --build --wait
echo "Stack is running with local MySQL profile."
