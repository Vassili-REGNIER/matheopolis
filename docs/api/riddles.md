# API — Riddles

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Riddles are the mini-game steps inside narrative chapters. The narrative scenario (dialogues, practice
steps, info screens, mini-game wiring) is defined in the frontend; the backend owns **progression state and score
validation**, protected by short-lived anti-cheat play tokens.

Practice riddle steps (`mode: "practice"`) do not send score or attempt payloads to the backend; only
challenge steps contribute to the chapter session.

### Riddle progress object

```json
{
  "id": 10,
  "studentId": 6,
  "riddleId": 3,
  "status": "in_progress",
  "attemptCount": 2,
  "startedAt": "2026-05-26T13:00:00Z",
  "completedAt": null,
  "lastAttemptAt": "2026-05-26T13:10:00Z"
}
```

`status` is one of `not_started`, `in_progress`, `completed`. `not_started` is a **virtual** value returned by
`GET /api/riddles/{riddleId}/progress` when no progression row exists yet; the database stores only
`in_progress` and `completed`, and `started_at` is set when the row is created (on `POST .../start`).

---

## `GET /api/puzzles`

- **Access**: public.
- **Purpose**: list active riddles metadata.

### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 3,
        "slug": "enigme-1",
        "title": "Enigme 1",
        "statement": "Find the missing number in the sequence: 2, 4, 8, ?",
        "position": 1,
        "isActive": true
      }
    ]
  },
  "error": null
}
```

---

## `POST /api/riddles/{riddleId}/start`

- **Access**: student.
- **Purpose**: open (or resume) a progression session for a riddle and obtain an anti-cheat `playToken`.
- **CSRF**: required.
- **Behavior**: creates the progression row if absent; rejects if already completed.

### Response `200`

```json
{
  "success": true,
  "data": {
    "progress": {
      "id": 10,
      "studentId": 6,
      "riddleId": 3,
      "status": "in_progress",
      "attemptCount": 0,
      "startedAt": "2026-05-26T13:00:00Z",
      "completedAt": null,
      "lastAttemptAt": null
    },
    "playToken": "eyJ1c2VySWQiOjYsInJpZGRsZUlkIjozLCJub25jZSI6Ii4uLiJ9.sig"
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.
- `409 RIDDLE_ALREADY_COMPLETED` — the riddle is already completed.

---

## `GET /api/riddles/{riddleId}/progress`

- **Access**: student (own progression), teacher/admin (scoped read).
- **Purpose**: read the current progression state.

### Response `200`

Returns the riddle progress object inside `data.progress`.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## `POST /api/riddles/{riddleId}/attempt`

- **Access**: student.
- **Purpose**: submit one attempt.
- **CSRF**: required.
- **Behavior**: validates the token and ownership, increments `attemptCount`, returns `isCorrect` and the
  progression snapshot.

### Request

```json
{
  "answer": "16",
  "playToken": "eyJ1c2VySWQiOjYsInJpZGRsZUlkIjozLCJub25jZSI6Ii4uLiJ9.sig"
}
```

### Response `200`

```json
{
  "success": true,
  "data": {
    "attempt": {
      "isCorrect": true,
      "progress": {
        "id": 10,
        "studentId": 6,
        "riddleId": 3,
        "status": "in_progress",
        "attemptCount": 2,
        "startedAt": "2026-05-26T13:00:00Z",
        "completedAt": null,
        "lastAttemptAt": "2026-05-26T13:10:00Z"
      },
      "playToken": "eyJ1c2VySWQiOjYsInJpZGRsZUlkIjozLCJub25jZSI6Ii4uLiJ9.sig"
    }
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.
- `409 RIDDLE_NOT_IN_PROGRESS` — no in-progress session.
- `400 INVALID_PLAY_TOKEN` / `400 PLAY_TOKEN_EXPIRED` — token rejected.

---

## `POST /api/riddles/{riddleId}/complete`

- **Access**: student.
- **Purpose**: finalize riddle completion.
- **CSRF**: required.
- **Behavior**: validates the token and state, marks progression `completed`, and rotates/invalidates the
  play token.

### Request

```json
{
  "playToken": "eyJ1c2VySWQiOjYsInJpZGRsZUlkIjozLCJub25jZSI6Ii4uLiJ9.sig"
}
```

### Response `200`

Returns the updated riddle progress object inside `data.progress`.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.
- `409 RIDDLE_NOT_IN_PROGRESS`.
- `400 INVALID_PLAY_TOKEN` / `400 PLAY_TOKEN_EXPIRED`.

---

## Anti-cheat rules

- `playToken` must be generated and signed by the backend.
- The token includes `userId`, `riddleId`, `progressionId`, `issuedAt`, and a unique nonce.
- The token is short-lived (5 to 15 minutes).
- The backend rejects expired tokens, replayed nonces, and tokens with a mismatched user or riddle.
- The backend owns all state transitions and score logic; the client never decides completion validity.
