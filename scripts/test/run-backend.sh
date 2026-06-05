#!/usr/bin/env bash
# Run backend PHPUnit suites locally (Unit, Integration, Api).
#
# - Uses TEST_* variables from ${REPO_ROOT}/.env (see .env.example).
# - Starts a temporary PHP built-in server for Api HTTP tests unless one is already up.
# - Does NOT use database/seed.sql; tests insert their own data.
#
# Prerequisites:
#   - PHP 8.3+ with extensions: dom, xml, xmlwriter, pdo_mysql, curl, mbstring
#   - MySQL 8 with database matheopolis_test (see --prepare-db)
#   - composer install in backend/
#
# Usage:
#   ./scripts/test/run-backend.sh              # all suites
#   ./scripts/test/run-backend.sh --coverage   # enforce 70% line coverage
#   ./scripts/test/run-backend.sh --suite Unit
#   ./scripts/test/run-backend.sh --prepare-db # create DB + apply schema only
#   ./scripts/test/run-backend.sh --help
#
set -euo pipefail

usage() {
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
SCHEMA_FILE="${BACKEND_DIR}/database/schema.sql"
API_LOG="/tmp/matheopolis-test-api.log"
API_PID_FILE="/tmp/matheopolis-test-api.pid"

RUN_COVERAGE=0
PHPUNIT_ARGS=()
PREPARE_DB_ONLY=0
STARTED_SERVER=0
USE_DOCKER_MYSQL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      ;;
    --coverage)
      RUN_COVERAGE=1
      shift
      ;;
    --suite)
      PHPUNIT_ARGS+=(--testsuite "$2")
      shift 2
      ;;
    --prepare-db)
      PREPARE_DB_ONLY=1
      shift
      ;;
    --docker-mysql)
      USE_DOCKER_MYSQL=1
      shift
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

if [[ ! -d "${BACKEND_DIR}/vendor" ]]; then
  echo "Run: cd backend && composer install"
  exit 1
fi

# shellcheck source=../lib/load-env.sh
source "${SCRIPT_DIR}/../lib/load-env.sh"
load_matheopolis_env "${ROOT_DIR}" test

if [[ "${USE_DOCKER_MYSQL}" == "1" ]]; then
  DB_HOST="${DB_HOST:-127.0.0.1}"
  DB_PORT="${LOCAL_MYSQL_PORT:-3307}"
  if [[ "${DB_HOST}" == "mysql" ]]; then
    DB_HOST="127.0.0.1"
  fi
  export DB_HOST DB_PORT
fi

export DB_HOST DB_PORT DB_USER DB_PASS DB_NAME
export TEST_API_BASE_URL="${TEST_API_BASE_URL:-http://127.0.0.1:8080}"

API_HOST_PORT="${TEST_API_BASE_URL#http://}"
API_HOST_PORT="${API_HOST_PORT#https://}"
API_PORT="${API_HOST_PORT##*:}"
if [[ "${API_PORT}" == "${API_HOST_PORT}" ]]; then
  API_PORT="80"
fi

mysql_cli() {
  if command -v mysql >/dev/null 2>&1; then
    mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "-p${DB_PASS}" "$@"
    return
  fi
  docker run --rm -i \
    --add-host=host.docker.internal:host-gateway \
    mysql:8.4 \
    mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" "-p${DB_PASS}" "$@"
}

wait_for_mysql() {
  echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT}..."
  for _ in $(seq 1 40); do
    if mysql_cli -e "SELECT 1" >/dev/null 2>&1; then
      echo "MySQL is ready."
      return 0
    fi
    sleep 1
  done
  echo "MySQL is not reachable. Start local MySQL (USE_LOCAL_MYSQL=1: ./scripts/stack/dev-up.sh) or fix TEST_DB_* in .env"
  exit 1
}

prepare_database() {
  wait_for_mysql
  echo "Ensuring database ${DB_NAME} exists and schema is applied..."
  mysql_cli -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  mysql_cli "${DB_NAME}" < "${SCHEMA_FILE}"
  echo "Test database ready (empty tables, no seed.sql)."
}

needs_mysql() {
  [[ ${#PHPUNIT_ARGS[@]} -eq 0 ]] && return 0
  [[ " ${PHPUNIT_ARGS[*]} " == *" Unit "* ]] && return 1
  return 0
}

needs_api_server() {
  [[ ${#PHPUNIT_ARGS[@]} -eq 0 ]] && return 0
  [[ " ${PHPUNIT_ARGS[*]} " == *" Api "* ]] && return 0
  [[ " ${PHPUNIT_ARGS[*]} " == *" Integration "* ]] && return 1
  [[ " ${PHPUNIT_ARGS[*]} " == *" Unit "* ]] && return 1
  return 0
}

api_server_running() {
  curl -sf "${TEST_API_BASE_URL}/api/health" >/dev/null 2>&1
}

start_api_server() {
  if api_server_running; then
    echo "API already reachable at ${TEST_API_BASE_URL} (reuse existing server)."
    return 0
  fi

  echo "Starting API server on ${TEST_API_BASE_URL}..."
  php -S "127.0.0.1:${API_PORT}" -t "${BACKEND_DIR}/public" > "${API_LOG}" 2>&1 &
  echo $! > "${API_PID_FILE}"
  STARTED_SERVER=1

  for _ in $(seq 1 30); do
    if api_server_running; then
      echo "API server ready."
      return 0
    fi
    sleep 1
  done

  echo "API server failed to start. Log:"
  cat "${API_LOG}" || true
  exit 1
}

stop_api_server() {
  if [[ "${STARTED_SERVER}" != "1" ]]; then
    return 0
  fi
  if [[ -f "${API_PID_FILE}" ]]; then
    kill "$(cat "${API_PID_FILE}")" 2>/dev/null || true
    rm -f "${API_PID_FILE}"
  fi
  echo "Stopped temporary API server."
}

cleanup() {
  stop_api_server
}
trap cleanup EXIT

if [[ "${PREPARE_DB_ONLY}" == "1" ]]; then
  prepare_database
  exit 0
fi

if needs_mysql; then
  prepare_database
fi

if needs_api_server; then
  start_api_server
fi

cd "${BACKEND_DIR}"

if [[ "${RUN_COVERAGE}" == "1" ]]; then
  echo "Running PHPUnit with coverage (70% line minimum)..."
  composer test:coverage -- "${PHPUNIT_ARGS[@]}"
else
  echo "Running PHPUnit..."
  composer test -- "${PHPUNIT_ARGS[@]}"
fi
