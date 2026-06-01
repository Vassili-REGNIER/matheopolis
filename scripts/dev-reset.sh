#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${ROOT_DIR}/infra/docker-compose.dev.yml"

# shellcheck source=lib/load-env.sh
source "${SCRIPT_DIR}/lib/load-env.sh"
load_matheopolis_env "${ROOT_DIR}" dev

profiles="$(compose_dev_profiles)"
if [[ -n "${profiles}" ]]; then
  export COMPOSE_PROFILES="${profiles}"
fi

if [[ "${USE_LOCAL_MYSQL}" == "1" ]]; then
  echo "Resetting DEV stack and local MySQL volume..."
  docker compose -f "${COMPOSE_FILE}" down -v --remove-orphans
  docker compose -f "${COMPOSE_FILE}" up -d --build --wait
  echo "Local DEV stack reset completed (schema reloaded from SQL init scripts)."
else
  echo "USE_LOCAL_MYSQL is not enabled."
  echo "Remote AlwaysData databases are not wiped by this script."
  echo "Restart containers with: ./scripts/dev-down.sh && ./scripts/dev-up.sh"
  echo "To reset schema on TEST DB only: ./scripts/db-apply.sh dev"
  exit 1
fi
