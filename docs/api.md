# Matheopolis API Specification

Base URL (local): `http://localhost:8080`

All routes are prefixed with `/api`.

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
- Purpose: create teacher account with teacher code
- Request body:
  - `firstName` string
  - `lastName` string
  - `username` string
  - `email` string
  - `password` string
  - `teacherCode` string

### `POST /api/users/students`

- Access: public or teacher/admin (project policy choice)
- Purpose: create student account
- Request body:
  - `firstName` string
  - `lastName` string
  - `username` string
  - `password` string
  - `classCode` string (optional but recommended if self-registration is enabled)

### `GET /api/users/{id}`

- Access:
  - `admin` can read all users
  - `teacher` can read own profile and students in owned classes
  - `student` can read only own profile
- Purpose: return one user profile

## 3.4 Teacher codes (admin only)

### `POST /api/teacher-codes`

- Access: admin
- Purpose: create a teacher code
- Request body:
  - `code` string (optional if backend auto-generates)
  - `expiresAt` string (optional)

### `GET /api/teacher-codes`

- Access: admin
- Purpose: list teacher codes and usage status
- Optional query:
  - `status` in `active|used|disabled`

### `DELETE /api/teacher-codes/{id}`

- Access: admin
- Purpose: disable/delete a teacher code
- Recommended behavior: soft delete (`disabled`)

## 3.5 Classes (teacher and admin)

### `POST /api/classes`

- Access: teacher
- Purpose: create a class
- Request body:
  - `name` string
  - `description` string (optional)

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

## 3.6 Riddle progression

### `GET /api/puzzles`

- Access: public
- Purpose: list active riddles metadata
- Returned fields:
  - `id`, `slug`, `title`, `statement`, `position`, `isActive`

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
- `teacher code`: unique, immutable once used

## 6. HTTP status guide

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
