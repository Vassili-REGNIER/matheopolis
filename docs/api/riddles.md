# API — Riddles

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

A **riddle** is a database-backed mini-game step: one row in `riddles`, tied 1:1 to a `chapter_steps` row
(`type = riddle`). Scenario order comes from `chapter_steps.order_index`, not from the riddles table. The
frontend loads the game implementation from `game_id` (registry in `GamesRegistry`). The backend stores
instructions, questions, authoritative answers, and **per-riddle progression** for challenge mode.

**Practice** riddles (`mode: "practice"`) run client-side only: no progression rows and no
`POST .../responses` persistence.

**Challenge** riddles require authenticated users and store progression in `riddle_progressions`. Answers are
submitted **one question at a time** via `POST /api/riddles/{riddleId}/responses`.

There is **no play-token or anti-cheat layer**.

Chapter-level flow is documented in [`chapters.md`](./chapters.md).

## 1. Objects

### Riddle summary (embedded in chapter detail)

See hydrated riddle steps in `GET /api/chapters/{id}` — questions omit `answer` and `hint` in the play view.

### Riddle progress

```json
{
  "riddleId": 12,
  "userId": 6,
  "status": "in_progress",
  "currentQuestionIndex": 1,
  "attemptCount": 3,
  "startedAt": "2026-05-21T09:00:00Z",
  "completedAt": null,
  "lastAttemptAt": "2026-05-21T09:05:00Z"
}
```

`status` is one of `not_started`, `in_progress`, `completed` (`not_started` is virtual when no row exists).

### Response result

```json
{
  "isCorrect": true,
  "progress": {
    "riddleId": 12,
    "userId": 6,
    "status": "in_progress",
    "currentQuestionIndex": 2,
    "attemptCount": 4,
    "startedAt": "2026-05-21T09:00:00Z",
    "completedAt": null,
    "lastAttemptAt": "2026-05-21T09:06:00Z"
  }
}
```

When the last question is answered correctly, `status` becomes `completed` and the server may auto-complete
the parent chapter if all challenge riddles are done.

---

## 2. Consumer endpoints

### `GET /api/riddles/{riddleId}`

- **Access**: authenticated user with access to the parent chapter (or public read when chapter is
  accessible). Returns `404` when the parent chapter is restricted.
- **Purpose**: fetch riddle metadata and play questions (without answers/hints for challenge mode in the
  default play view; hints may be exposed via a dedicated action in a later iteration).

---

### `POST /api/riddles/{riddleId}/start`

- **Access**: authenticated account.
- **Purpose**: open or resume challenge riddle progression.
- **CSRF**: required.
- **Behavior**: rejected for `practice` riddles (`422 VALIDATION_ERROR`). Creates `riddle_progressions` row
  if absent; rejects if already `completed`.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "progress": {
      "riddleId": 12,
      "userId": 6,
      "status": "in_progress",
      "currentQuestionIndex": 0,
      "attemptCount": 0,
      "startedAt": "2026-05-21T09:00:00Z",
      "completedAt": null,
      "lastAttemptAt": null
    }
  },
  "error": null
}
```

#### Errors

- `409 RIDDLE_ALREADY_COMPLETED`
- `422 VALIDATION_ERROR` — practice riddle

---

### `GET /api/riddles/{riddleId}/progress`

- **Access**: authenticated user (own progression), teacher/admin (scoped read).

---

### `POST /api/riddles/{riddleId}/responses`

- **Access**: authenticated account with an in-progress challenge riddle.
- **Purpose**: submit **one** answer for **one** question (supports games that unlock the next question only
  after validation).
- **CSRF**: required.

#### Request

```json
{
  "questionId": 40,
  "answer": "42"
}
```

Alternatively `questionIndex` (0-based) may be accepted when `questionId` is omitted.

#### Behavior

- Validates the answer against `riddle_questions.answer` (normalized server-side).
- Inserts a row in `riddle_responses`.
- On correct answer: increments `currentQuestionIndex`; when all questions are correct, marks riddle
  `completed`.
- On incorrect answer: increments `attemptCount`, leaves `currentQuestionIndex` unchanged.

#### Errors

- `409 RIDDLE_NOT_IN_PROGRESS`
- `409 RIDDLE_ALREADY_COMPLETED`
- `422 VALIDATION_ERROR` — unknown question, practice riddle, or empty answer

---

## 3. Management (current phase)

Riddles and questions are **authored manually** in SQL seed scripts for now. Future teacher/admin CRUD endpoints
will follow the same tables (`riddles`, `riddle_questions`). No `GET /api/puzzles` legacy route exists.

---

## 4. Persistence

Tables: `riddles`, `riddle_questions`, `riddle_progressions`, `riddle_responses`. Progression uses `user_id`
(all authenticated roles). Guests do not write progression.
