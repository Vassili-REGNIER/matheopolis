# Deployment

## Overview

Matheopolis runs locally with Docker Compose:

- **frontend** — Node dev server with automatic rebuild + live reload (in dev stack)
- **backend** — PHP API (source mounted in dev stack for instant code updates)
- **database** — AlwaysData MySQL (test DB for dev, production DB for prod-like stack)

Optional **local MySQL** is available for offline work (`USE_LOCAL_MYSQL=1`).

All secrets and connection settings live in **`.env` at the repository root** (copy from `.env.example`).
The same file is used locally and on AlwaysData; PHP reads it from the parent of `backend/` (see `backend/public/index.php`).

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

### Outbound mail

| Variable group | Used by | Purpose |
|----------------|---------|---------|
| `DEV_MAIL_SMTP_*` | dev stack | SMTP for verification/reset emails (default: Mailpit in Docker) |
| `PROD_MAIL_SMTP_*` | prod stack / AlwaysData | Real SMTP (AlwaysData: typically port `465` + `ssl`) |

Dev inbox UI: http://localhost:8025 (Mailpit). Leave `DEV_MAIL_SMTP_HOST` empty to log emails to `backend/logs/app.log` instead.

## 2. Prepare the database (first time)

For remote AlwaysData test DB:

```bash
./scripts/db/apply.sh dev
```

For production DB (only when you intend to initialize prod):

```bash
./scripts/db/apply.sh prod
```

This runs `schema.sql` and the demo data files listed below via a temporary MySQL client container.
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
./scripts/deploy/alwaysdata.sh ssh-matheopolis.alwaysdata.net matheopolis /home/matheopolis
```

The deploy script:

1. Uploads your local **`.env`** to `/home/matheopolis/.env` (same level as `backend/` and `frontend/`).
2. Sets `APP_ENV=prod` in that remote copy so PHP uses the `PROD_*` variables.
3. Rsyncs `backend/` and `frontend/`, then runs `composer install` on the server.

Ensure `PROD_DB_PASS` and other `PROD_*` values are filled in your local `.env` before deploying.

### Automated deploy (GitHub Actions)

After a successful CI run on **`main`**, the **Deploy** workflow (`.github/workflows/deploy.yml`) rsyncs `backend/`, `frontend/`, and a production `.env` to AlwaysData over SSH.

Required secrets (either **repository secrets** under Settings → Secrets → Actions,
or **environment secrets** under Settings → Environments → `matheopolis_prod` — the Deploy workflow uses that environment):

| Secret | Example | Purpose |
|--------|---------|---------|
| `ALWAYSDATA_HOST` | `ssh-matheopolis.alwaysdata.net` | SSH hostname only (no `user@`) |
| `ALWAYSDATA_USER` | `matheopolis` | SSH user |
| `ALWAYSDATA_TARGET` | `/home/matheopolis` | Remote directory containing `backend/`, `frontend/`, `.env` |
| `ALWAYSDATA_SSH_KEY` | contents of private key | Ed25519 **deploy** private key (see below) |
| `ALWAYSDATA_ENV_FILE` | full `.env` body | Same variables as local `.env` with `PROD_*` filled; workflow prepends `APP_ENV=prod` |

**Debugging a failed deploy**

1. Open **Actions → Deploy →** the failed run (or use `gh run list --workflow=deploy.yml` then `gh run view <id> --log-failed`).
2. **Validate deploy secrets** — lists any missing secret by name.
3. **Add known_hosts** — fails if `ALWAYSDATA_HOST` is empty, wrong (`user@host`), or unreachable from GitHub runners.
4. **Sync files with rsync** / **Install dependencies on server** — SSH auth, path, or remote `composer` issues; test locally with `./scripts/deploy/alwaysdata.sh <host> <user> <target>`.
5. Deploy runs only when the triggering CI workflow succeeded on a **push to `main`** (not on pull requests).

Manual deploy remains available via `alwaysdata.sh` and uses your local `.env` file instead of `ALWAYSDATA_ENV_FILE`.

### SSH key for automated deploy

GitHub Actions cannot use password authentication. Configure a **dedicated deploy key**:

1. On your machine: `ssh-keygen -t ed25519 -f ~/.ssh/matheopolis-deploy -N ""`
2. In AlwaysData admin: **Remote access → SSH/SFTP** → add `~/.ssh/matheopolis-deploy.pub` as an authorized key for user `matheopolis`.
3. In GitHub (`matheopolis_prod` environment): set `ALWAYSDATA_SSH_KEY` to the **private** key contents (`matheopolis-deploy`, not the server's `~/.ssh/id_ed25519`).

Test locally before pushing:

```bash
ssh -i ~/.ssh/matheopolis-deploy matheopolis@ssh-matheopolis.alwaysdata.net "echo OK"
```

### AlwaysData site (after the first deploy)

Configure **one** site for the public URL (e.g. `matheopolis.alwaysdata.net`):

| Setting | Value |
|---------|--------|
| **Type** | **PHP** (not *Apache Personnalisé* — Custom Apache does not run PHP for `/api`) |
| **Root directory** | `frontend` |
| **Virtual host directives** | leave **empty** |

Routing is handled by `frontend/.htaccess` (deployed with the app): static assets, SPA fallback, and `/api/*` → `backend/public/index.php`.

Quick checks after saving:

```bash
curl -sI https://matheopolis.alwaysdata.net/global.css | grep -i content-length
curl -s https://matheopolis.alwaysdata.net/api/health
```

`global.css` must **not** be 432 bytes (that size means Apache is returning `index.html` for every URL). `/api/health` must return JSON.

On the server:

```bash
ls -la /home/matheopolis/frontend/dist/main.js /home/matheopolis/frontend/global.css
```

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
| `db/apply.sh` | Apply schema + seed data (`dev` or `prod`) |
| `db/rebuild.sh` | Drop all tables and re-apply schema + seed data |
| `db/reset-data.sh` | Clear demo rows and re-apply demo data (content preserved) |
| `deploy/alwaysdata.sh` | Rsync code + root `.env` to AlwaysData SSH |
| `test/run-backend.sh` | Run PHPUnit suites locally |
| `install-docker-wsl.sh` | Install Docker on Ubuntu/WSL2 |
| `lib/load-env.sh` | Shared `.env` loader (sourced by other scripts) |

## SQL files

Schema and reset scripts live in `backend/database/`; seed data lives under `backend/database/seeds/`:

| File | Purpose |
|------|---------|
| `schema.sql` | Table definitions |
| `reset_tables.sql` | Drop all tables (used by `db/rebuild.sh`) |
| `reset_entries-demo.sql` | Clear demo accounts/quizzes only (used by `db/reset-data.sh`) |
| `seeds/content/scenario.sql` | Production chapter narrative (steps, dialogues, riddles) |
| `seeds/content/quiz-laurence.sql` | Production flagship Laurence quiz (fixed IDs) |
| `seeds/demo/users.sql` | Demo users and classes |
| `seeds/demo/quizzes.sql` | Demo quizzes (permissions, class targeting) |
| `seeds/demo/progressions.sql` | Sample student progressions |

Seed files are applied in the order defined in `scripts/lib/db-seed-files.sh`.
Set `MATHEOPOLIS_INCLUDE_DEMO=0` to load production content without demo accounts (`apply.sh` / `rebuild.sh`).
