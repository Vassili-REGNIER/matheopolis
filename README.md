# Matheopolis

Matheopolis is a university project (BUT Informatique) delivered as a monorepo with two servers:

- `backend/`: PHP native API for business logic and persistence.
- `frontend/`: Vanilla TypeScript SPA for pages, dialogs, and mini-game integration.

## Repository structure

- `backend/`: API source code, routes, database scripts, backend tests.
- `frontend/`: SPA code, content assets, and mock API payloads.
- `infra/`: Docker definitions for local development.
- `scripts/`: local operations scripts — `dev/`, `prod/`, shared tools at repo root of `scripts/`.
- `docs/`: functional, technical, API, testing, and deployment documentation.
- `AGENTS.md`: universal entrypoint for AI assistants (points to `.ai/`).
- `.ai/`: shared, tool-agnostic AI context (single source of truth for all assistants).

## Quick start (local)

Prerequisite: Docker Desktop.

1. Copy `.env.example` to `.env` at the repository root and set your database credentials (see `docs/deployment.md`).
2. Start all services: `./scripts/dev/up.sh`
3. Stop all services: `./scripts/dev/down.sh`
4. Reset local MySQL volume (only when `USE_LOCAL_MYSQL=1`): `./scripts/dev/reset.sh`

Default URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- MySQL: `localhost:3307`

## Quality commands

Backend (`backend/`):

- `composer install`
- `composer quality`

Frontend (`frontend/`):

- `npm install`
- `npm run check`

## Documentation index

- Product requirements: `docs/product-requirements.md`
- Frontend technical specification: `docs/frontend-technical-spec.md`
- API specification: `docs/api.md`
- OpenAPI contract: `docs/openapi.yaml`
- Architecture: `docs/architecture.md`
- Testing strategy: `docs/testing.md`
- Deployment guide: `docs/deployment.md`
- AI context management: `docs/ai-context.md`
- AI assistant entrypoint: `AGENTS.md`
- AI governance and shared context: `.ai/README.md`
