#!/usr/bin/env bash
# Shared environment loader for Matheopolis shell scripts.
# Maps ${REPO_ROOT}/.env variables to exports used by Docker Compose (dev vs prod mode).
# Source from scripts/: source "${SCRIPT_DIR}/lib/load-env.sh"
# Source from scripts/dev|prod/: source "${SCRIPT_DIR}/../lib/load-env.sh"

load_matheopolis_env() {
  local repo_root="$1"
  local mode="${2:-dev}"
  local env_file="${repo_root}/.env"

  if [[ ! -f "${env_file}" ]]; then
    echo "Missing ${env_file}."
    echo "Copy ${repo_root}/.env.example to ${env_file} and set your AlwaysData database credentials."
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "${env_file}"
  set +a

  if [[ "${mode}" == "prod" ]]; then
    export APP_ENV="${PROD_APP_ENV:-prod}"
    export APP_DEBUG="${PROD_APP_DEBUG:-false}"
    export APP_URL="${PROD_APP_URL:?Set PROD_APP_URL in .env}"
    export APP_FRONTEND_ORIGIN="${PROD_APP_FRONTEND_ORIGIN:?Set PROD_APP_FRONTEND_ORIGIN in .env}"
    export DB_HOST="${PROD_DB_HOST:?Set PROD_DB_HOST in .env}"
    export DB_PORT="${PROD_DB_PORT:-3306}"
    export DB_NAME="${PROD_DB_NAME:?Set PROD_DB_NAME in .env}"
    export DB_USER="${PROD_DB_USER:?Set PROD_DB_USER in .env}"
    export DB_PASS="${PROD_DB_PASS:?Set PROD_DB_PASS in .env}"
    export PLAY_TOKEN_SECRET="${PROD_PLAY_TOKEN_SECRET:?Set PROD_PLAY_TOKEN_SECRET in .env}"
    export FRONTEND_PUBLIC_PORT="${PROD_FRONTEND_PORT:-8081}"
    export SESSION_IDLE_TIMEOUT="${PROD_SESSION_IDLE_TIMEOUT:-1800}"
    export SESSION_COOKIE_SAMESITE="${PROD_SESSION_COOKIE_SAMESITE:-Lax}"
  else
    export APP_ENV="${DEV_APP_ENV:-dev}"
    export APP_DEBUG="${DEV_APP_DEBUG:-true}"
    export BACKEND_PORT="${DEV_BACKEND_PORT:-8080}"
    export FRONTEND_PORT="${DEV_FRONTEND_PORT:-5173}"
    export APP_URL="${DEV_APP_URL:-http://localhost:${BACKEND_PORT}}"
    export APP_FRONTEND_ORIGIN="${DEV_APP_FRONTEND_ORIGIN:-http://localhost:${FRONTEND_PORT}}"
    export DB_HOST="${DEV_DB_HOST:-${DB_HOST:-}}"
    export DB_PORT="${DEV_DB_PORT:-${DB_PORT:-3306}}"
    export DB_NAME="${DEV_DB_NAME:-${DB_NAME:-}}"
    export DB_USER="${DEV_DB_USER:-${DB_USER:-}}"
    export DB_PASS="${DEV_DB_PASS:-${DB_PASS:-}}"
    export PLAY_TOKEN_SECRET="${DEV_PLAY_TOKEN_SECRET:-${PLAY_TOKEN_SECRET:-dev-play-token-secret}}"
    export USE_LOCAL_MYSQL="${USE_LOCAL_MYSQL:-0}"

    if [[ "${USE_LOCAL_MYSQL}" != "1" ]]; then
      if [[ -z "${DB_HOST}" || -z "${DB_NAME}" || -z "${DB_USER}" || -z "${DB_PASS}" ]]; then
        echo "Database credentials are incomplete in .env."
        echo "Set DEV_DB_* (recommended) or DB_* for AlwaysData test database,"
        echo "or set USE_LOCAL_MYSQL=1 to run the optional local MySQL container."
        exit 1
      fi
    else
      export DB_HOST="mysql"
      export DB_PORT="3306"
      export DB_NAME="${LOCAL_DB_NAME:-matheopolis}"
      export DB_USER="${LOCAL_DB_USER:-matheopolis}"
      export DB_PASS="${LOCAL_DB_PASS:-matheopolis}"
      export MYSQL_ROOT_PASSWORD="${LOCAL_MYSQL_ROOT_PASSWORD:-root}"
      export MYSQL_PORT="${LOCAL_MYSQL_PORT:-3307}"
    fi
  fi
}

compose_dev_profiles() {
  if [[ "${USE_LOCAL_MYSQL:-0}" == "1" ]]; then
    echo "local-mysql"
  fi
}
