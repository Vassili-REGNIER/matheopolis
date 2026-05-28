# Workflow and Quality Guide

## Documentation workflow

For every architecture/scope/security change:

1. Update implementation.
2. Update `/docs`.
3. Update `/.ia`.

All three are required for a complete change.

## Testing expectations

- Backend:
  - unit/application behavior tests,
  - integration tests for SQL schema/repositories,
  - route-level functional checks.
- Frontend:
  - service/component behavior with mock API mode when backend is unavailable.

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
