# Matheopolis API Specification

Base URL (local): `http://localhost:8080`

All routes are prefixed with `/api`.

This document is the **API hub**: it defines the cross-cutting conventions (response envelope, authentication,
error codes, HTTP status guide) that apply to every endpoint. The detailed, per-route reference lives in one
file per resource under [`docs/api/`](./api/).

`docs/openapi.yaml` is the machine-readable contract for implemented and stabilized endpoints. When the prose
docs and the OpenAPI file disagree, the OpenAPI file wins for request/response shapes.

## Per-resource reference

| Resource | File | Scope |
| --- | --- | --- |
| System | [`api/system.md`](./api/system.md) | health check |
| Authentication | [`api/auth.md`](./api/auth.md) | login, logout, current user |
| Users | [`api/users.md`](./api/users.md) | registration, profile, academy domains |
| Classes | [`api/classes.md`](./api/classes.md) | class CRUD, students, progression, export |
| Chapters | [`api/chapters.md`](./api/chapters.md) | narrative chapter catalog, scenario, chapter progression |
| Riddles | [`api/riddles.md`](./api/riddles.md) | mini-game steps, per-question responses, riddle progression |
| Quizzes | [`api/quizzes.md`](./api/quizzes.md) | quiz access, play, correction, management |

## 1. General conventions

### 1.1 Response envelope

Every JSON response uses the same envelope.

Success:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Failure:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

The `data` payload shape is documented per route. In this reference, route examples show the **full envelope**
so the exact wire format is unambiguous.

### 1.2 Content type

- Requests with a body send `Content-Type: application/json`.
- Responses are `application/json`, except binary downloads (for example the Excel progression export).

### 1.3 Authentication model

- Authentication uses server-side PHP sessions.
- The session cookie (`PHPSESSID`) is sent automatically by the browser on same-domain requests.
- Protected endpoints require a valid authenticated session.
- No JWT bearer tokens are used.

### 1.4 CSRF protection

- A CSRF token is bound to the authenticated session.
- The token is returned to the client in two places:
  - the `POST /api/auth/login` response (`data.csrfToken`), issued right after the session is regenerated,
  - the `GET /api/auth/me` response (`data.csrfToken`), so a reloaded SPA recovers the token without
    re-authenticating.
- Clients must send the token in the `X-CSRF-Token` header on **authenticated** mutating requests
  (`POST`, `PATCH`, `PUT`, `DELETE`).
- Public, pre-authentication endpoints are exempt from CSRF because they run before an authenticated session
  exists: `POST /api/auth/login`, `POST /api/users`, `POST /api/users/teachers`, `POST /api/users/students`.
- The token is rotated on login and invalidated on logout. A missing or invalid token on a protected mutation
  yields `403 ACCESS_DENIED`.

### 1.5 Roles

- `admin`
- `teacher`
- `student`
- `free_user`

Guest mode is a local, unauthenticated trial session. It can open the game hub and load narrative chapters via
`GET /api/chapters` (public). It has no quiz access, no server-side progression persistence, and no private
dashboard access. Registered users (`student`, `free_user`, `teacher`, `admin`) persist chapter, riddle, and
quiz progression in the database.

### 1.6 Date format

- All timestamps are ISO 8601 UTC strings.
- Example: `2026-05-26T14:00:00Z`.

## 2. Error codes (canonical set)

- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `ACCESS_DENIED`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `RIDDLE_NOT_IN_PROGRESS`
- `RIDDLE_ALREADY_COMPLETED`
- `CHAPTER_NOT_IN_PROGRESS`
- `CHAPTER_ALREADY_COMPLETED`
- `CHAPTER_NOT_READY`
- `QUIZ_NOT_ACCESSIBLE`
- `QUIZ_ATTEMPT_NOT_COMPLETED`
- `QUIZ_ALREADY_PUBLIC`

## 3. HTTP status guide

- `200` success read/update
- `201` resource created
- `204` successful deletion or logout with no content
- `400` invalid input format
- `401` unauthenticated
- `403` authenticated but forbidden
- `404` resource not found
- `409` business conflict
- `422` validation error
- `429` rate limited

## 4. Minimum validation rules

- `username`: generated server-side, unique, 3 to 32 chars, alphanumeric plus `_`, `-`, and `.`.
- `email`: valid format and unique.
- `password`: minimum length 8 (or stricter policy).
- `classCode`: required for student self-registration through `POST /api/users/students`.
- `class name`: 1 to 120 chars.
- `class level`: must belong to the allowed catalog values.
- `teacher email`: must use an approved academy domain (see [`api/users.md`](./api/users.md)).
- `quiz title`: 1 to 255 chars.
- `quiz question`: must have a `label`, a `type`, and at least two options; at least one option must be correct.

## 5. Requirement traceability notes

- Original requirement versions referenced teacher-code flows.
- The current validated direction replaces teacher-code flows with teacher email-domain validation.
- API consumers must rely on this updated direction to avoid implementing deprecated endpoints.
