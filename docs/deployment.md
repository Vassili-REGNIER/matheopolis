# Deployment

## Overview

Matheopolis runs locally with Docker Compose:

- **frontend** — Node dev server with automatic rebuild + live reload (in dev stack)
- **backend** — PHP API (source mounted in dev stack for instant code updates)
- **database** — AlwaysData MySQL (test DB for dev, production DB for prod-like stack)

Optional **local MySQL** is available for offline work (`USE_LOCAL_MYSQL=1`).

All secrets and connection settings live in **`.env` at the repository root** (copy from `.env.example`).

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
| `DEV_DB_*` | `./scripts/dev/up.sh` | AlwaysData **test** database |
| `PROD_DB_*` | `./scripts/prod/up.sh` | AlwaysData **production** database |
| `USE_LOCAL_MYSQL=1` | dev stack | Use local MySQL container instead of remote |

## 2. Prepare the database (first time)

For remote AlwaysData test DB:

```bash
./scripts/db-apply.sh dev
```

For production DB (only when you intend to initialize prod):

```bash
./scripts/db-apply.sh prod
```

This runs `schema.sql` and `seed.sql` via a temporary MySQL client container. It connects to whatever host is in `.env` (`DEV_DB_*` or `PROD_DB_*`) — including **remote AlwaysData** databases, not only local MySQL. AlwaysData must allow remote MySQL access from your network/Docker. With `USE_LOCAL_MYSQL=1`, start the dev stack first so MySQL is listening on the published port.

**Warning:** re-applying schema/seed on an existing database may fail or overwrite data depending on SQL contents; use mainly for first-time setup or controlled test resets.

## 3. Start the DEV stack

```bash
./scripts/dev/up.sh
```

Open:

- **Application**: http://localhost:5173 (default `DEV_FRONTEND_PORT`)
- **API health (direct)**: http://localhost:8080/api/health

The frontend dev server proxies `/api/...` to the backend container.
TypeScript changes rebuild automatically and the browser reloads without restarting containers.

## 4. Stop / reset

```bash
./scripts/dev/down.sh
```

`./scripts/dev/reset.sh` only destroys data when `USE_LOCAL_MYSQL=1` (local volume). It does **not** wipe remote AlwaysData databases.

## 5. PROD-like local stack

Runs frontend + backend against **production** AlwaysData credentials from `.env` (`PROD_*`):

```bash
./scripts/prod/up.sh
```

Default URL: http://localhost:8081 (`PROD_FRONTEND_PORT`).

## 6. Deploy to AlwaysData hosting

```bash
./scripts/deploy-alwaysdata.sh <ssh-host> <ssh-user> <target-path>
```

Configure the remote `backend/.env` on the server with production values. The deploy script rsyncs code and runs `composer install`.

## 7. Troubleshooting

| Issue | Action |
|-------|--------|
| Missing `.env` | `cp .env.example .env` and fill `DEV_DB_*` |
| Backend 500 on API calls | Check DB credentials; run `./scripts/db-apply.sh dev` |
| Cannot reach AlwaysData MySQL from Docker | Enable remote MySQL in AlwaysData; verify host/port; test with `./scripts/db-apply.sh dev` |
| Port already in use | Change `DEV_FRONTEND_PORT` / `DEV_BACKEND_PORT` in `.env` |
| Offline development | Set `USE_LOCAL_MYSQL=1` in `.env`, then `./scripts/dev/up.sh` |

## Script reference

| Script | Description |
|--------|-------------|
| `dev/up.sh` | Start dev stack (remote test DB or local MySQL) |
| `dev/down.sh` | Stop dev stack |
| `dev/reset.sh` | Reset local MySQL volume only (`USE_LOCAL_MYSQL=1`) |
| `prod/up.sh` | Prod-like stack against AlwaysData prod DB |
| `prod/down.sh` | Stop prod-like stack |
| `prod/up-with-local-mysql.sh` | Prod-like stack with local MySQL only |
| `db-apply.sh` | Apply schema + seed to configured DB (`dev` or `prod`; remote or local) |
| `deploy-alwaysdata.sh` | Rsync deploy to AlwaysData SSH |
| `install-docker-wsl.sh` | Install Docker on Ubuntu/WSL2 |
| `lib/load-env.sh` | Shared `.env` loader (sourced by other scripts) |
