#!/usr/bin/env bash
# Deploy backend, frontend and root .env to AlwaysData hosting over SSH.
# Uploads ${REPO_ROOT}/.env to ${target_path}/.env (same level as backend/ and frontend/).
# Prepends APP_ENV=prod on the server copy so PHP reads PROD_* variables from the shared file.
# Usage: ./scripts/deploy/alwaysdata.sh <ssh-host> <ssh-user> <target-path>
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <host> <user> <target_path>"
  echo "Example: $0 ssh-matheopolis.alwaysdata.net matheopolis /home/matheopolis"
  exit 1
fi

HOST_NAME="$1"
USER_NAME="$2"
TARGET_PATH="$3"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/../.."
BACKEND_PATH="${ROOT_DIR}/backend"
FRONTEND_PATH="${ROOT_DIR}/frontend"
ENV_FILE="${ROOT_DIR}/.env"
DEPLOY_ENV_FILE="$(mktemp)"
trap 'rm -f "${DEPLOY_ENV_FILE}"' EXIT

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}."
  echo "Copy ${ROOT_DIR}/.env.example to ${ENV_FILE} and set your credentials."
  exit 1
fi

{
  echo "APP_ENV=prod"
  grep -v -E '^(APP_ENV|TEST_APP_ENV|DEV_APP_ENV|PROD_APP_ENV)=' "${ENV_FILE}" || true
} > "${DEPLOY_ENV_FILE}"

echo "Building frontend assets..."
(
  cd "${FRONTEND_PATH}"
  npm ci --no-audit --no-fund
  npm run build
)

echo "Deploying backend, frontend and .env to Alwaysdata..."
rsync -az "${DEPLOY_ENV_FILE}" "${USER_NAME}@${HOST_NAME}:${TARGET_PATH}/.env"
rsync -az --delete --exclude-from="${BACKEND_PATH}/.rsyncignore" "${BACKEND_PATH}/" "${USER_NAME}@${HOST_NAME}:${TARGET_PATH}/backend/"
rsync -az --delete --exclude-from="${FRONTEND_PATH}/.rsyncignore" "${FRONTEND_PATH}/" "${USER_NAME}@${HOST_NAME}:${TARGET_PATH}/frontend/"
ssh "${USER_NAME}@${HOST_NAME}" "chmod 600 '${TARGET_PATH}/.env' && cd '${TARGET_PATH}/backend' && composer install --no-dev --optimize-autoloader --prefer-dist --no-progress"
echo "Deployment finished."
echo "Remote environment: ${TARGET_PATH}/.env"
