# Deployment

## Overview

Matheopolis runs locally with Docker Compose:

- **frontend** — Node dev server with automatic rebuild + live reload (in dev stack)
- **backend** — PHP API (source mounted in dev stack for instant code updates)
- **database** — AlwaysData MySQL (test DB for dev, production DB for prod-like stack)

Optional **local MySQL** is available for offline work (`USE_LOCAL_MYSQL=1`).

All secrets and connection settings live in **`.env` at the repository root** (copy from `.env.example`).
The PHP backend reads this file automatically; `backend/.env` is only needed for AlwaysData server deploys.

## Prerequisites

- Docker Engine + Docker Compose v2
- Unix shell (`.sh` scripts)

### Install Docker on WSL (Ubuntu)

If `docker` is not installed:

```bash
sudo ./scripts/install-docker-wsl.sh
```

Then **close and reopen** your WSL terminal (or run `newgrp docker`) so your user can run Docker without `sudo`.

- AlwaysData MySQL credentials (test + production databases)
- Network access from Docker to AlwaysData MySQL hosts (remote access enabled in AlwaysData panel)

## 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

| Variable group | Used by | Purpose |
|----------------|---------|---------|
| `DEV_DB_*` | `./scripts/stack/dev-up.sh` | AlwaysData **test** database (shared dev data) |
| `PROD_DB_*` | `./scripts/stack/prod-up.sh` | AlwaysData **production** database |
| `TEST_DB_*` | `./scripts/test/run-backend.sh` | Isolated local database for PHPUnit |
| `USE_LOCAL_MYSQL=1` | dev stack | Use local MySQL container instead of remote |

## 2. Prepare the database (first time)

For remote AlwaysData test DB:

```bash
./scripts/db/apply.sh dev
```

For production DB (only when you intend to initialize prod):

```bash
./scripts/db/apply.sh prod
```

This runs `schema.sql`, `seed.sql` and `quiz.sql` via a temporary MySQL client container.
AlwaysData must allow remote MySQL access from your network/Docker.
With `USE_LOCAL_MYSQL=1`, start the dev stack first so MySQL is listening on the published port.

**Warning:** `apply.sh` uses `CREATE TABLE IF NOT EXISTS` — it does not drop existing tables.
Use `rebuild.sh` for a full table reset.

## 3. Start the DEV stack

```bash
./scripts/stack/dev-up.sh
```

Open:

- **Application**: http://localhost:5173 (default `DEV_FRONTEND_PORT`)
- **API health (direct)**: http://localhost:8080/api/health

The frontend dev server proxies `/api/...` to the backend container.
TypeScript changes rebuild automatically and the browser reloads without restarting containers.

## 4. Stop / reset

```bash
./scripts/stack/dev-down.sh
```

| Goal | Command |
|------|---------|
| Reset local MySQL Docker volume | `./scripts/stack/dev-reset-local.sh` (only `USE_LOCAL_MYSQL=1`) |
| Rebuild all tables on remote dev DB | `./scripts/db/rebuild.sh dev` |
| Reset demo data on remote dev DB | `./scripts/db/reset-data.sh dev` |

Remote AlwaysData databases are **never** wiped by `dev-reset-local.sh`.

## 5. PROD-like local stack

Runs frontend + backend against **production** AlwaysData credentials from `.env` (`PROD_*`):

```bash
./scripts/stack/prod-up.sh
```

Default URL: http://localhost:8081 (`PROD_FRONTEND_PORT`).

To test prod images with local MySQL instead:

```bash
./scripts/stack/prod-up-local-mysql.sh
```

## 6. Deploy to AlwaysData hosting

```bash
./scripts/deploy/alwaysdata.sh <ssh-host> <ssh-user> <target-path>
```

Configure the remote `backend/.env` on the server with production values (flat format, see `backend/.env.example`).
The deploy script rsyncs code and runs `composer install`.

## 7. Troubleshooting

| Issue | Action |
|-------|--------|
| Missing `.env` | `cp .env.example .env` and fill `DEV_DB_*` |
| Backend 500 on API calls | Check DB credentials; run `./scripts/db/apply.sh dev` |
| Cannot reach AlwaysData MySQL from Docker | Enable remote MySQL in AlwaysData; verify host/port; test with `./scripts/db/apply.sh dev` |
| Port already in use | Change `DEV_FRONTEND_PORT` / `DEV_BACKEND_PORT` in `.env` |
| Offline development | Set `USE_LOCAL_MYSQL=1` in `.env`, then `./scripts/stack/dev-up.sh` |
| `matheopolis-frontend` unhealthy / :5173 down | Run `docker logs matheopolis-frontend` — often a TypeScript build error (`tsc`). Fix compile errors, then `./scripts/stack/dev-down.sh` and `./scripts/stack/dev-up.sh`. First start can take ~1 min (`npm install` + build). Check backend: `curl http://localhost:8080/api/health`. User must be in the `docker` group (`sudo usermod -aG docker $USER`, then **restart the terminal**) |

## Script reference

| Script | Description |
|--------|-------------|
| `stack/dev-up.sh` | Start dev stack (remote test DB or local MySQL) |
| `stack/dev-down.sh` | Stop dev stack |
| `stack/dev-reset-local.sh` | Reset local MySQL volume only (`USE_LOCAL_MYSQL=1`) |
| `stack/prod-up.sh` | Prod-like stack against AlwaysData prod DB |
| `stack/prod-down.sh` | Stop prod-like stack |
| `stack/prod-up-local-mysql.sh` | Prod-like stack with local MySQL only |
| `db/apply.sh` | Apply schema + seed + quiz (`dev` or `prod`) |
| `db/rebuild.sh` | Drop all tables and re-apply schema + seed + quiz |
| `db/reset-data.sh` | Clear demo rows and re-apply seed + quiz |
| `deploy/alwaysdata.sh` | Rsync deploy to AlwaysData SSH |
| `test/run-backend.sh` | Run PHPUnit suites locally |
| `install-docker-wsl.sh` | Install Docker on Ubuntu/WSL2 |
| `lib/load-env.sh` | Shared `.env` loader (sourced by other scripts) |

## SQL files

All database scripts live in `backend/database/`:

| File | Purpose |
|------|---------|
| `schema.sql` | Table definitions |
| `seed.sql` | Demo users, classes, chapters |
| `quiz.sql` | Demo quiz content |
| `reset_tables.sql` | Drop all tables (used by `db/rebuild.sh`) |
| `reset_entries.sql` | Delete demo rows with `id < 10000` (used by `db/reset-data.sh`) |
