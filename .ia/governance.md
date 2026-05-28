# Governance Rules for AI-Assisted Development

## Mandatory language policy

- All code, comments, commit messages, and project documentation must be written in English.
- Team chat/discussion language can be French.

## Legacy policy

- Do not keep dead or legacy code after refactors.
- Remove obsolete files, routes, services, schemas, and tests in the same change whenever safe.
- If immediate removal is risky, create a clear follow-up task and document the temporary exception.

## Documentation synchronization policy

- Any significant functional or technical change must update:
  - `/docs` project documentation, and
  - `/.ia` shared AI context.
- Do not merge architecture or scope changes without matching doc updates.

## Contradiction handling

If a prompt conflicts with current docs/rules:

1. Explicitly report the contradiction.
2. Ask whether to align implementation to docs or evolve docs.
3. Never silently ignore the inconsistency.

## Architecture discipline

- Respect clean dependency direction.
- Keep controllers thin and business logic in application/domain services.
- Keep persistence concerns inside repositories/infrastructure.

## Security baseline

- Server-side validation and authorization are mandatory.
- Session-based authentication with secure cookie settings.
- CSRF protection for state-changing requests.
- Password hashing with PHP native secure functions.

## Scope discipline

- Prefer coherent vertical slices over feature sprawl.
- For university constraints, prioritize stability and demonstrability over speculative complexity.
