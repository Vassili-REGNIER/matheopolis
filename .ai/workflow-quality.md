# Workflow and Quality Guide

## Documentation workflow

For every architecture/scope/security change:

1. Update implementation.
2. Update `/docs`.
3. Update `/.ai`.

All three are required for a complete change.

## Testing expectations

- Backend:
  - unit/application behavior tests,
  - integration tests for SQL schema/repositories,
  - route-level functional checks.
- Frontend:
  - service/component behavior with mock API mode when backend is unavailable.
  - colocated `*.test.ts` files next to the TypeScript module they validate for unit/component tests.
  - end-to-end browser scenarios in `frontend/e2e/` when full user journeys need coverage.

## Local development loop

- DEV stack should favor fast iteration: no full reset for regular code changes.
- Frontend development should run with automatic TypeScript rebuild and live reload.
- Backend development should use mounted sources in dev when possible to avoid image rebuilds for PHP edits.
- Reserve full rebuild/reset for Dockerfile, dependency, or database state changes.

Test discipline:

- Add or update tests whenever behavior changes.
- Keep tests deterministic and isolated (no shared mutable state, no order dependence).

## CI expectations

CI should split checks into independent jobs for fast diagnosis:

- syntax/lint,
- formatting,
- static analysis,
- tests,
- coverage,
- frontend type checks.

## Branch hygiene

- Keep changes scoped and coherent.
- Remove obsolete code in the same refactor.
- Prefer explicit migration commits over mixed unrelated edits.

## Delivery principle

Prioritize a stable, demonstrable vertical slice over broad unfinished scope.
