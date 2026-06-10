# API — Riddles

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

A **riddle** is a database-backed mini-game step: one row in `riddles`, tied 1:1 to a `chapter_steps` row
(`type = riddle`). Scenario order comes from `chapter_steps.order_index`, not from the riddles table. The
frontend loads the game implementation from `game_id` (registry in `GamesRegistry`). The backend stores
instructions, questions, authoritative answers, and **per-riddle progression** for authenticated play.

**Practice** riddles (`mode: "practice"`) are tutorial steps inside a chapter. They use the same authenticated
progression and `POST .../responses` flow as challenge riddles so the server remains the source of truth for
answer validation. Practice completion does **not** count toward chapter auto-completion (only challenge
riddles do).

**Challenge** riddles also store progression in `riddle_progressions`. Answers are submitted **one question at
a time** via the same `POST /api/riddles/{riddleId}/responses` endpoint.

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
  "score": null
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
    "score": 3
  }
}
```

When the last question is answered correctly, `status` becomes `completed`. Challenge riddle completion may
auto-complete the parent chapter if all challenge riddles are done; practice riddle completion does not count
toward chapter auto-completion.

---

## 2. Consumer endpoints

### `GET /api/riddles/{riddleId}`

- **Access**: public (no session required), same visibility rules as the parent chapter. Guests and
  authenticated users receive the play payload when the chapter is accessible; `404` when the chapter is
  restricted for the caller's class.
- **Purpose**: fetch riddle metadata and play questions (without answers or hints in the play view).

#### Response `200`

```json
{
  "success": true,
  "data": {
    "id": 2,
    "chapterId": 1,
    "slug": "piano-fractions-challenge",
    "gameId": "PianoFractions",
    "mode": "challenge",
    "title": "La gamme de Pythagore",
    "play": {
      "type": "riddle",
      "riddleId": 2,
      "gameId": "PianoFractions",
      "mode": "challenge",
      "title": "La gamme de Pythagore",
      "instruction": "Simplifiez la fraction affichee...",
      "completionMessage": "Melodie terminee !",
      "gameParams": {
        "questions": [{ "question": "2/2", "difficulty": 1 }]
      }
    }
  },
  "error": null
}
```

---

### `POST /api/riddles/{riddleId}/start`

- **Access**: authenticated account.
- **Purpose**: open or resume riddle progression.
- **CSRF**: required.
- **Behavior**:
  - No row yet → creates attempt `0` (`in_progress`, `currentQuestionIndex = 0`).
  - Latest row `in_progress` → returns it (resume).
  - Latest row `completed` → creates a new attempt row (`attempt_count` incremented).

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
      "score": null,
      "startedAt": "2026-05-21T09:00:00Z",
      "completedAt": null
    }
  },
  "error": null
}
```

---

### `GET /api/riddles/{riddleId}/progress`

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — returns the **caller's own**
  progression only.

---

### `POST /api/riddles/{riddleId}/responses`

- **Access**: authenticated account with an in-progress riddle.
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
- Each submission increments `attemptCount` on the latest attempt row.
- If the submitted `questionIndex` is **lower** than `currentQuestionIndex` (player restarted the mini-game in
  the UI), the server clears previous `riddle_responses` for this attempt, resets `currentQuestionIndex` to
  the submitted question, then records the new answer.
- Submissions for a **higher** `questionIndex` than the current step are rejected.
- On correct answer: advances `currentQuestionIndex`; when all questions are correct, marks the attempt
  `completed`.
- On incorrect answer: leaves `currentQuestionIndex` unchanged.
- For practice riddles, completion is persisted but does not count toward chapter auto-completion.

#### Errors

- `409 RIDDLE_NOT_IN_PROGRESS`
- `409 RIDDLE_ALREADY_COMPLETED`
- `422 VALIDATION_ERROR` — unknown question or empty answer

---

## 3. Management (current phase)

Riddles and questions are **authored manually** in SQL seed scripts for now. Future teacher/admin CRUD endpoints
will follow the same tables (`riddles`, `riddle_questions`). No `GET /api/puzzles` legacy route exists.

---

## 4. Persistence

Tables: `riddles`, `riddle_questions`, `riddle_progressions`, `riddle_responses`. Progression uses `user_id`
(all authenticated roles). Guests do not write progression.
