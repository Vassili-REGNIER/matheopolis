# Global Refactor Baseline

This document captures the pre-refactor baseline and migration checkpoints for the
Mathéopolis global refactoring effort.

## Baseline snapshot

- Runtime target aligned to PHP 8.3 in `composer.json`.
- Project rules created under `.cursor/rules/`.
- Existing app surface: home + authentication flows.
- Existing architecture debt:
  - `src/Adapter` singular instead of `src/Adapters`.
  - Repository contracts in `src/Domain/Repository` instead of `src/Application/Port`.
  - Infrastructure services depended on adapter contracts.
  - CSRF middleware existed but was not wired globally.
- Quality baseline:
  - No tests.
  - No `database/` SQL scripts.
  - CI missing validate/audit/lint/tests/coverage.
  - No deployment workflow.

## Migration principles

1. Keep the app runnable after each phase.
2. Use explicit application use cases for sensitive authorization.
3. Enforce SQL prepared statements and escaped HTML output.
4. Add tests together with feature refactors.
5. Keep implementation understandable for a university no-framework project.

## Phase completion checklist

- [ ] Layer boundaries migrated toward target architecture.
- [ ] Security hardening completed (CSRF, session regeneration, authorization checks, safe errors).
- [ ] Database schema/seed/migrations in place.
- [ ] Full role/classroom/puzzle-management/progression/statistics features implemented.
- [ ] Test pyramid in place.
- [ ] Quality toolchain complete.
- [ ] CI/CD complete with Alwaysdata deployment.
