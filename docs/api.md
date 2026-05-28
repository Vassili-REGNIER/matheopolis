# Matheopolis API Specification

Base URL (local): `http://localhost:8080`

All routes are prefixed with `/api`.

This document includes both:

- implemented endpoints, and
- approved target endpoints planned for phased delivery.

`docs/openapi.yaml` should be treated as the contract for currently implemented and stabilized endpoints.

## 1. General conventions

### 1.1 Response envelope

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

### 1.2 Authentication model

- Authentication uses server-side PHP sessions.
- Session cookie is sent automatically by the browser on same-domain requests.
- Protected endpoints require a valid authenticated session.
- Mutating endpoints (`POST`, `PATCH`, `DELETE`) also require a valid CSRF token.
- CSRF token must be sent through `X-CSRF-Token` header.

### 1.3 Roles

- `admin`
- `teacher`
- `student`
- `free_user` (product requirement; implementation may be phased)

### 1.4 Date format

- All timestamps are ISO 8601 UTC strings.
- Example: `2026-05-26T14:00:00Z`

## 2. Error codes (canonical set)

- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `ACCESS_DENIED`
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `RIDDLE_ALREADY_STARTED`
- `RIDDLE_NOT_IN_PROGRESS`
- `RIDDLE_ALREADY_COMPLETED`
- `INVALID_PLAY_TOKEN`
- `PLAY_TOKEN_EXPIRED`

## 3. Endpoints

## 3.1 System

### `GET /api/health`

- Access: public
- Purpose: service health check
- Response data:
  - `service` string
  - `status` string (`ok`)
  - `time` string

## 3.2 Authentication and current user

### `POST /api/auth/login`

- Access: public
- Purpose: log in with `email` or `username`
- Request body:
  - `identifier` string (email or username)
  - `password` string
- Success:
  - sets session cookie
  - returns `user`

### `POST /api/auth/logout`

- Access: authenticated
- Purpose: invalidate current session
- Success: session destroyed, cookie invalidated

### `GET /api/auth/me`

- Access: authenticated
- Purpose: return current authenticated user profile

## 3.3 User management

### `POST /api/users/teachers`

- Access: public (registration)
- Purpose: create teacher account
- Request body:
  - `firstName` string
  - `lastName` string
  - `username` string
  - `email` string
  - `password` string
- Constraint:
  - email domain must belong to a supported French academy domain (for example `ac-aix-marseille.fr`)

### Allowed teacher email domains

The backend accepts teacher registration only when `email` belongs to one of the following academy domains:

- `ac-aix-marseille.fr`
- `ac-amiens.fr`
- `ac-besancon.fr`
- `ac-bordeaux.fr`
- `ac-caen.fr`
- `ac-clermont.fr`
- `ac-corse.fr`
- `ac-creteil.fr`
- `ac-dijon.fr`
- `ac-dijon.fr`
- `ac-grenoble.fr`
- `ac-guadeloupe.fr`
- `ac-guyane.fr`
- `ac-reunion.fr`
- `ac-lille.fr`
- `ac-limoges.fr`
- `ac-lyon.fr`
- `ac-martinique.fr`
- `ac-mayotte.fr`
- `ac-montpellier.fr`
- `ac-nancy-metz.fr`
- `ac-nantes.fr`
- `ac-nice.fr`
- `ac-noumea.nc`
- `ac-orleans-tours.fr`
- `ac-paris.fr`
- `ac-poitiers.fr`
- `ac-polynesie.pf`
- `ac-reims.fr`
- `ac-rennes.fr`
- `ac-rouen.fr`
- `ac-spm.fr`
- `ac-strasbourg.fr`
- `ac-toulouse.fr`
- `ac-versailles.fr`
- `ac-wf.wf`

The `www.` prefix is also accepted (for example `www.ac-lyon.fr`).

### `POST /api/users/students`

- Access: public or teacher/admin (project policy choice)
- Purpose: create student account
- Request body:
  - `firstName` string
  - `lastName` string
  - `username` string
  - `password` string
  - `classCode` string (optional but recommended if self-registration is enabled)

### `POST /api/users/free`

- Access: public (registration)
- Purpose: create free-user account not attached to a class
- Request body:
  - `firstName` string
  - `lastName` string
  - `username` string
  - `password` string
  - `email` string (optional by policy)
- Notes:
  - This endpoint is part of the functional target and can be released in a phased delivery.

### `GET /api/users/{id}`

- Access:
  - `admin` can read all users
  - `teacher` can read own profile and students in owned classes
  - `student` can read only own profile
- Purpose: return one user profile

## 3.4 Classes (teacher and admin)

### `POST /api/classes`

- Access: teacher
- Purpose: create a class
- Request body:
  - `name` string
  - `description` string (optional)
  - `level` string (example: `grade_6`, `grade_7`, `grade_8`, `grade_9`, `grade_10`, `grade_11`, `grade_12`)

### `GET /api/classes/{id}`

- Access:
  - owner teacher
  - admin
- Purpose: get class details
- Returned fields include:
  - class metadata
  - teacher summary
  - student list (optional by query flag)

### `PATCH /api/classes/{id}`

- Access: owner teacher or admin
- Purpose: update class metadata
- Request body:
  - `name` string (optional)
  - `description` string (optional)
  - `level` string (optional)

### `DELETE /api/classes/{id}`

- Access: owner teacher or admin
- Purpose: delete/archive class

### `GET /api/classes/{id}/students`

- Access: owner teacher or admin
- Purpose: list students in class

### `GET /api/classes/{id}/students/progress`

- Access: owner teacher or admin
- Purpose: list students with progression summary
- Returned per student:
  - `startedRiddles`
  - `completedRiddles`
  - `completionRate`
  - `lastActivityAt`

### `GET /api/classes/{id}/students/progress/export`

- Access: owner teacher or admin
- Purpose: export class progression as Excel file
- Output:
  - file download (`.xlsx`)
  - columns include first name, last name, progression, attempts, and activity metadata
- Notes:
  - If direct Excel generation is not yet available, a temporary CSV export can be used behind the same business intent.

## 3.5 Riddle progression

### `GET /api/puzzles`

- Access: public
- Purpose: list active riddles metadata
- Returned fields:
  - `id`, `slug`, `title`, `statement`, `position`, `isActive`
  - optional chapter metadata (`chapterId`, `chapterSlug`, `chapterTitle`)

### `POST /api/riddles/{riddleId}/start`

- Access: student
- Purpose: open a progression session for a riddle
- Behavior:
  - creates progression row if absent
  - rejects if already completed
  - returns anti-replay `playToken`

### `GET /api/riddles/{riddleId}/progress`

- Access: student (own progression), teacher/admin (scoped read)
- Purpose: get progression state
- Returned fields:
  - `status` (`not_started`, `in_progress`, `completed`)
  - `attemptCount`
  - `startedAt`
  - `completedAt`
  - `lastAttemptAt`

### `POST /api/riddles/{riddleId}/attempt`

- Access: student
- Purpose: submit one attempt
- Request body:
  - `answer` string
  - `playToken` string
- Behavior:
  - validates token and ownership
  - increments `attemptCount`
  - returns `isCorrect` and progression snapshot

### `POST /api/riddles/{riddleId}/complete`

- Access: student
- Purpose: finalize riddle completion
- Request body:
  - `playToken` string
- Behavior:
  - validates token and state
  - marks progression as completed
  - invalidates or rotates play token

## 4. Anti-cheat rules for riddle progression

- `playToken` must be generated and signed by backend.
- Token must include `userId`, `riddleId`, `progressionId`, `issuedAt`, and a unique nonce.
- Token must be short-lived (for example 5 to 15 minutes).
- Backend must reject:
  - expired token
  - token replay (same nonce reused)
  - token with mismatched user or riddle
- Backend must own all state transitions and score logic.
- Client never decides completion validity.

## 5. Minimum validation rules

- `username`: unique, 3 to 32 chars, alphanumeric plus `_` and `-`
- `email`: valid format and unique
- `password`: minimum length 8 (or stricter policy)
- `class name`: 1 to 120 chars
- `class level`: must belong to allowed catalog values
- `teacher email`: must use an approved academy domain

## 6. Requirement traceability notes

- Original requirement versions referenced teacher-code flows.
- Current validated direction replaces teacher-code flows with teacher email-domain validation.
- API consumers must rely on this updated direction to avoid implementing deprecated endpoints.

## 7. HTTP status guide

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
