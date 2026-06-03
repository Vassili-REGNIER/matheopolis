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
- CSRF protection:
  - issue a session-bound CSRF token; return it from `POST /api/auth/login` and `GET /api/auth/me`,
  - require the `X-CSRF-Token` header on authenticated mutating endpoints (`POST`/`PATCH`/`PUT`/`DELETE`),
  - exempt pre-authentication public endpoints (login, the registration endpoints),
  - rotate the token on login and invalidate it on logout.
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

### Quiz authorization and rules

- Quizzes are database-backed; narrative chapter content remains in the frontend.
- Visibility defaults: `public` is accessible to everyone, `private` to no one. Per-class overrides in
  `quiz_target_classes` flip this for a `(quiz, class)` pair (`is_active`).
- Access resolution (server-authoritative):
  - `admin`: all quizzes,
  - `teacher`: all public quizzes + own private quizzes,
  - `student`: public quizzes except those restricted for their class, plus private quizzes granted to their
    class,
  - `free_user`: all public quizzes,
  - guest: none.
- Override authorization:
  - restricting a public quiz for a class requires owning the **class**,
  - granting a private quiz to a class requires owning **both** the quiz and the class.
- Creation/publication:
  - teachers can only create private quizzes and may set `ask_admin` to request publication,
  - only admins can create public quizzes or set `status = public` (publishing clears `ask_admin`).
- Quiz scoring is computed server-side, all-or-nothing per question; correct options are never exposed before
  an attempt is completed.

## Cleanup rule

When replacing a backend concept, remove:

- obsolete controllers/routes,
- dead services/ports/repositories,
- unused schema fragments,
- stale tests/config references.

Do not keep inactive legacy pathways.
