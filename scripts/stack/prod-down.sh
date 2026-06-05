#!/usr/bin/env bash
# Stop the PROD-like local Docker stack (infra/docker-compose.prod.yml).
# Usage: ./scripts/stack/prod-down.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.prod.yml"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
if [[ -f "${ROOT_DIR}/.env" ]]; then
  load_matheopolis_env "${ROOT_DIR}" prod
fi

echo "Stopping PROD-like stack..."
docker compose -f "${COMPOSE_FILE}" down
echo "PROD-like stack stopped."
