#!/usr/bin/env bash
# Deploy backend and frontend to AlwaysData hosting over SSH (rsync + composer install).
# Configure production secrets in backend/.env on the remote server separately.
# Usage: ./scripts/deploy-alwaysdata.sh <ssh-host> <ssh-user> <target-path>
set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: $0 <host> <user> <target_path>"
  exit 1
fi

HOST_NAME="$1"
USER_NAME="$2"
TARGET_PATH="$3"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${SCRIPT_DIR}/.."
BACKEND_PATH="${ROOT_DIR}/backend"
FRONTEND_PATH="${ROOT_DIR}/frontend"

echo "Deploying backend and frontend to Alwaysdata..."
rsync -az --delete --exclude-from="${BACKEND_PATH}/.rsyncignore" "${BACKEND_PATH}/" "${USER_NAME}@${HOST_NAME}:${TARGET_PATH}/backend/"
rsync -az --delete "${FRONTEND_PATH}/" "${USER_NAME}@${HOST_NAME}:${TARGET_PATH}/frontend/"
ssh "${USER_NAME}@${HOST_NAME}" "cd '${TARGET_PATH}/backend' && composer install --no-dev --optimize-autoloader --prefer-dist --no-progress"
echo "Deployment finished."
