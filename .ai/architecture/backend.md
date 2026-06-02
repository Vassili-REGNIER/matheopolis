# Backend Architecture Guide

## Technology constraints

- PHP native (no full-stack framework).
- MySQL.
- API-first backend.
- Session-based authentication.

## Layering

- `Domain`: business entities and core invariants.
- `Application`: use cases/services, ports, domain orchestration.
- `Adapter`: HTTP controllers, router, middleware.
- `Infrastructure`: repository implementations, session/config/logging/persistence details.

Dependency direction must remain inward toward domain/application.

## API conventions

- Prefix: `/api/...`
- Uniform response envelope:
  - `success`
  - `data`
  - `error`
- Explicit error codes for business and technical failures.

## Security requirements

- Use prepared statements only.
- Validate request payloads server-side.
- Authorize every sensitive action server-side.
- Require CSRF header for mutating endpoints.
- Regenerate session ID on login.
- Use secure password hashing and verification.

## PHP coding conventions

- All code and comments in English.
- `declare(strict_types=1)` and strict typing everywhere.
- Constructor dependency injection; no service location or global state.
- Keep controllers thin; business logic lives in application/domain services.
- Remove dead code paths in the same change.

## Domain-specific rules currently enforced

- Generic registration assigns the `teacher` role for approved academy email domains and `free_user` otherwise.
- Student registration requires a class code and generates the username server-side.
- Teacher-code entities and endpoints are removed.
- Riddle progression uses signed play tokens with anti-replay controls.

## Cleanup rule

When replacing a backend concept, remove:

- obsolete controllers/routes,
- dead services/ports/repositories,
- unused schema fragments,
- stale tests/config references.

Do not keep inactive legacy pathways.
