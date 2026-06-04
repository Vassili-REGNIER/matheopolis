# Testing Strategy

## 1. Goals

Testing must guarantee:

- stable vertical-slice behavior,
- API contract consistency,
- role/security correctness on critical flows,
- safe refactoring without regressions.

## 2. Backend quality checks

Run from `backend/`:

- `composer test`
- `composer stan`
- `composer cs:check`
- `composer quality`

Recommended focus areas:

- authentication/session lifecycle,
- role-based authorization,
- class ownership constraints,
- progression state transitions and play-token validation,
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

## 7. CI strategy

CI should keep independent jobs per quality concern for faster diagnosis:

- backend syntax/lint/style/static analysis/tests,
- frontend type checks,
- optional coverage/report publishing.
