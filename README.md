# Matheopolis

Matheopolis is a university project (BUT Informatique) delivered as a monorepo with two servers:

- `backend/`: PHP native API for business logic and persistence.
- `frontend/`: Vanilla TypeScript SPA for pages, dialogs, and mini-game integration.

## Repository structure

- `backend/`: API source code, routes, database scripts, backend tests.
- `frontend/`: SPA code, content assets, and mock API payloads.
- `infra/`: Docker definitions for local development.
- `scripts/`: operations — `stack/` (Docker), `db/` (database), `deploy/`, `test/`, `lib/`.
- `docs/`: functional, technical, API, testing, and deployment documentation.
- `AGENTS.md`: universal entrypoint for AI assistants (points to `.ai/`).
- `.ai/`: shared, tool-agnostic AI context (single source of truth for all assistants).

## Quick start (local)

Prerequisite: Docker Desktop.

1. Copy `.env.example` to `.env` at the repository root and set your AlwaysData credentials (see `docs/deployment.md`).
2. Initialize the dev database: `./scripts/db/apply.sh dev`
3. Start all services: `./scripts/stack/dev-up.sh`
4. Stop all services: `./scripts/stack/dev-down.sh`

Default URLs (remote AlwaysData DB):

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

With `USE_LOCAL_MYSQL=1` in `.env`, a local MySQL container is also available at `localhost:3307`.

## Quality commands

Backend (`backend/`):

- `composer install`
- `composer quality`
- `./scripts/test/run-backend.sh` — full PHPUnit suites

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
