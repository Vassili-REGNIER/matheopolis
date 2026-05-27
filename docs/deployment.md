# Deployment

## Local development with Docker

Use one command:

- Bash: `./scripts/dev-up.sh`

This starts:
- MySQL (`localhost:3307`)
- Backend API (`http://localhost:8080`)
- Frontend (`http://localhost:5173`)

## Alwaysdata deployment

Use one command with SSH access configured:

- Bash: `./scripts/deploy-alwaysdata.sh <host> <user> <path>`

The script:
1. Syncs `backend/` and `frontend/`.
2. Runs Composer install in `backend/` on the remote server.

## Required production settings

In `backend/.env` on server:

- `APP_ENV=prod`
- `APP_DEBUG=false`
- `APP_URL=<your-domain>`
- `DB_*` values for Alwaysdata MySQL
- `SESSION_IDLE_TIMEOUT=1800`
- `SESSION_COOKIE_SAMESITE=Lax` (or `Strict` depending on UX needs)
