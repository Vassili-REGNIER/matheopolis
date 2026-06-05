# End-to-end tests (Playwright)

Browser E2E tests for the full Matheopolis stack (frontend + backend + MySQL).

**Owner:** frontend team (backend provides Docker/API support).

## Prerequisites

- Node.js 20+
- Docker Compose running `mysql`, `backend`, and `frontend` services
- Demo seed applied for manual accounts, or a dedicated `e2e-seed.sql` (future)

## Setup (planned)

```bash
npm init playwright@latest
# or from repo root after playwright init:
npx playwright install
```

Set `baseURL` to the frontend origin (for example `http://localhost:5173`).

## Principles

- **No API mocks** in E2E: real network, real session cookie, real database.
- Keep only a few **critical journeys** (guest chapter, student riddle, teacher class view).
- Run in CI on a `docker compose` profile or nightly workflow.

## Pilot scenarios

1. Guest opens a chapter and reaches a riddle step without logging in.
2. Student logs in, starts a challenge riddle, submits an answer, reloads and sees progress.
3. Teacher opens class progression (when UI is ready).

See [`docs/testing/backend-test-plan.md`](../docs/testing/backend-test-plan.md).
