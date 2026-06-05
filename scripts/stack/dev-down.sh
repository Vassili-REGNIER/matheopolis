#!/usr/bin/env bash
# Stop the local DEV Docker stack (infra/docker-compose.dev.yml).
# Usage: ./scripts/stack/dev-down.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.dev.yml"

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
if [[ -f "${ROOT_DIR}/.env" ]]; then
  load_matheopolis_env "${ROOT_DIR}" dev
  profiles="$(compose_dev_profiles)"
  if [[ -n "${profiles}" ]]; then
    export COMPOSE_PROFILES="${profiles}"
  fi
fi

echo "Stopping Matheopolis DEV stack..."
docker compose -f "${COMPOSE_FILE}" down
echo "DEV stack stopped."
