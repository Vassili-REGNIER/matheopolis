#!/usr/bin/env bash
# Shared environment loader for Matheopolis shell scripts.
# Maps ${REPO_ROOT}/.env prefixed variables to flat exports (dev, prod, test).
# Usage: source "${SCRIPT_DIR}/lib/load-env.sh" && load_matheopolis_env "${ROOT_DIR}" dev

load_matheopolis_env() {
  local repo_root="$1"
  local mode="${2:-dev}"
  local env_file="${repo_root}/.env"

  if [[ ! -f "${env_file}" ]]; then
    echo "Missing ${env_file}."
    echo "Copy ${repo_root}/.env.example to ${env_file} and set your credentials."
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
    export FRONTEND_PUBLIC_PORT="${PROD_FRONTEND_PORT:-8081}"
    export SESSION_IDLE_TIMEOUT="${PROD_SESSION_IDLE_TIMEOUT:-1800}"
    export SESSION_COOKIE_SAMESITE="${PROD_SESSION_COOKIE_SAMESITE:-Lax}"
  elif [[ "${mode}" == "test" ]]; then
    export APP_ENV="${TEST_APP_ENV:-test}"
    export APP_DEBUG="${TEST_APP_DEBUG:-true}"
    export APP_URL="${TEST_APP_URL:-http://127.0.0.1:8080}"
    export APP_FRONTEND_ORIGIN="${TEST_APP_FRONTEND_ORIGIN:-http://127.0.0.1:5173}"
    export DB_HOST="${TEST_DB_HOST:-127.0.0.1}"
    export DB_PORT="${TEST_DB_PORT:-3306}"
    export DB_NAME="${TEST_DB_NAME:-matheopolis_test}"
    export DB_USER="${TEST_DB_USER:-root}"
    export DB_PASS="${TEST_DB_PASS:-root}"
    export TEST_API_BASE_URL="${TEST_API_BASE_URL:-${APP_URL}}"
    export SESSION_IDLE_TIMEOUT="${TEST_SESSION_IDLE_TIMEOUT:-1800}"
    export SESSION_COOKIE_SAMESITE="${TEST_SESSION_COOKIE_SAMESITE:-Lax}"
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
    export USE_LOCAL_MYSQL="${USE_LOCAL_MYSQL:-0}"

    if [[ "${USE_LOCAL_MYSQL}" != "1" ]]; then
      if [[ -z "${DB_HOST}" || -z "${DB_NAME}" || -z "${DB_USER}" || -z "${DB_PASS}" ]]; then
        echo "Database credentials are incomplete in .env."
        echo "Set DEV_DB_* for the AlwaysData test database,"
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

require_db_mode() {
  local mode="$1"
  if [[ "${mode}" != "dev" && "${mode}" != "prod" ]]; then
    echo "Usage: $0 <dev|prod>"
    exit 1
  fi
}
