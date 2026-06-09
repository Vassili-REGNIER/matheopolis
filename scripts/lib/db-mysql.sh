#!/usr/bin/env bash
# Shared MySQL client helpers for database scripts (Docker mysql:8.4 image).

adjust_db_client_host() {
  local mode="$1"
  if [[ "${mode}" == "dev" && "${USE_LOCAL_MYSQL:-0}" == "1" ]]; then
    DB_HOST="host.docker.internal"
    DB_PORT="${MYSQL_PORT:-3307}"
  fi
}

mysql_apply_file() {
  local sql_file="$1"
  echo "  -> $(basename "${sql_file}")"
  docker run --rm -i \
    --add-host=host.docker.internal:host-gateway \
    mysql:8.4 \
    mysql \
    --default-character-set=utf8mb4 \
    -h "${DB_HOST}" \
    -P "${DB_PORT}" \
    -u "${DB_USER}" \
    -p"${DB_PASS}" \
    "${DB_NAME}" \
    < "${sql_file}"
}

confirm_db_action() {
  local action="$1"
  local mode="$2"

  if [[ "${mode}" != "prod" ]]; then
    return 0
  fi

  if [[ "${MATHEOPOLIS_DB_YES:-}" == "1" ]]; then
    return 0
  fi

  echo ""
  echo "WARNING: ${action} on PRODUCTION database:"
  echo "  ${DB_HOST}:${DB_PORT}/${DB_NAME}"
  echo ""
  read -r -p "Type 'yes' to continue: " answer
  if [[ "${answer}" != "yes" ]]; then
    echo "Aborted."
    exit 1
  fi
}
