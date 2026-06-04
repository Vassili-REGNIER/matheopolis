# Testing Strategy

## 1. Goals

Testing must guarantee:

- stable vertical-slice behavior,
- API contract consistency,
- role/security correctness on critical flows,
- safe refactoring without regressions.

**Detailed backend roadmap (pyramid, business matrix, CI, phases):**
[`testing/backend-test-plan.md`](./testing/backend-test-plan.md).

## 2. Backend quality checks

Run from `backend/`:

- `composer test` — Unit + Integration + Api (+ legacy Functional router tests)
- `composer test:coverage` — same suites with **70% line coverage** gate (`phpunit.xml`)
- `composer stan`
- `composer cs:check`
- `composer quality`

### Automated backend tests (local)

**Recommended:** use the helper script (MySQL check, schema, API server, PHPUnit):

```bash
./scripts/test/run-backend.sh              # all suites
./scripts/test/run-backend.sh --suite Unit # fast, no MySQL/API server required*
./scripts/test/run-backend.sh --coverage   # 70% line gate
./scripts/test/run-backend.sh --prepare-db # only create DB + apply schema.sql
./scripts/test/run-backend.sh --docker-mysql  # DB on localhost:3307 (compose local-mysql)
```

\*Unit suite only — no HTTP, no database.

Manual equivalent:

1. Start MySQL and run `./scripts/test/run-backend.sh --prepare-db`.
2. Copy `backend/.env.test` to `backend/.env`.
3. Start the API: `php -S 127.0.0.1:8080 -t backend/public`
4. Run `composer test` from `backend/`.

Tests **do not** use `database/seed.sql`; each test inserts only the rows it needs.
`seed.sql` remains for manual demos only.

Recommended focus areas:

- authentication/session lifecycle,
- role-based authorization,
- class ownership constraints,
- progression state transitions (chapter and riddle),
- repository behavior against schema.

## 3. Frontend testing with mock mode

When backend is unavailable or unstable:

1. Serve `frontend/` locally.
2. Open app in mock mode (`?mock=1` where supported).
3. Use fixtures under `frontend/mocks/`.

This validates component lifecycle, routing, and role-aware rendering independently from backend runtime.

## 4. Contract alignment checks

- Frontend services must match `docs/api.md` and `docs/openapi.yaml`.
- DTO interfaces in frontend models must stay aligned with backend payloads.
- Any response-envelope change requires updating both backend and frontend layers.

## 5. Manual end-to-end acceptance path

Before milestone validation, execute at least one complete flow:

1. Sign up/log in.
2. Open GameHome.
3. Enter MatheoPanel.
4. Access role-specific section.
5. Start and complete at least one riddle response (`POST /api/riddles/{id}/responses`).
6. Confirm persisted progression after refresh/new session.

## 6. Local demo seed accounts

When MySQL is initialized via Docker Compose, `backend/database/seed.sql` loads demo data. Every account uses
the password `password`.

| Role | Username | Email |
| --- | --- | --- |
| admin | `admin` | `admin@matheopolis.local` |
| teacher | `theo.teacher` | `theo.teacher@ac-lyon.fr` |
| student (class 6A) | `sam.student1` | — |
| student (class 6A) | `lia.student2` | — |
| student (class 7B) | `marc.student1` | — |
| free_user | `felix.demo` | `felix.demo@gmail.com` |

Class codes: `CLS-6A01`, `CLS-7B01`. The seed also includes riddles, chapter/quiz progressions, and quiz
visibility overrides for manual API testing.

## 7. Test pyramid (summary)

| Level | Location | Purpose |
| --- | --- | --- |
| Unit | `backend/tests/Unit` | Resolvers and services with mocked ports |
| Integration | `backend/tests/Integration` | Repositories against MySQL test database |
| API | `backend/tests/Api` (planned) | HTTP + session + CSRF through `index.php` |
| E2E | Playwright (planned, `e2e/`) | Browser + full Docker stack, no API mocks |

Playwright is a **browser automation** tool (TypeScript). It is not part of PHPUnit; it validates
real user flows (login, GameHome, chapter play) against frontend + backend + MySQL together.

## 8. CI strategy

CI should keep independent jobs per quality concern for faster diagnosis:

- backend syntax/lint/style/static analysis/tests,
- MySQL service for integration/API tests (planned),
- frontend type checks,
- optional coverage/report publishing (target ~70% on `backend/src/`).
