# Deployment

## 1. Scope of this document

Current official target is **local development deployment** only:

- 2 application containers (frontend + backend),
- 1 database container (MySQL),
- single command entrypoints via shell scripts.

Production hosting options can evolve later without changing local developer workflow.

## 2. Prerequisites

- Docker Desktop
- Docker Compose
- Unix-compatible shell (the repository uses `.sh` scripts only)

## 3. Local configuration

Optional:

1. Copy `infra/.env.dev.example` to `infra/.env.dev`.
2. Customize local ports, credentials, and secrets as needed.

If no custom file is provided, default values from compose/environment fallbacks are used.

## 4. Start and stop commands

From repository root:

- Start stack: `./scripts/dev-up.sh`
- Stop stack: `./scripts/dev-down.sh`
- Full reset (containers + volumes): `./scripts/dev-reset.sh`

## 5. Services in the local stack

Expected running containers:

- `matheopolis-frontend`
- `matheopolis-backend`
- `matheopolis-mysql`

Default endpoints:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- MySQL: `localhost:3307`

## 6. Health and startup ordering

Compose health checks ensure:

- MySQL is healthy before backend startup dependencies are considered ready.
- Backend health is validated before frontend dependency gates pass.
- `dev-up.sh` can wait for readiness and provide a stable local startup experience.

## 7. Troubleshooting

- If ports are already used, change host ports in `infra/.env.dev`.
- If schema/data are inconsistent, run `./scripts/dev-reset.sh`.
- If only one service must restart, use Docker Compose service-specific restart commands.
