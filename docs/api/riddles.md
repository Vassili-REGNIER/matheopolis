# API — Riddles

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

A **riddle** is a database-backed mini-game step: one row in `riddles`, tied 1:1 to a `chapter_steps` row
(`type = riddle`). Scenario order comes from `chapter_steps.order_index`, not from the riddles table. The
frontend loads the game implementation from `game_id` (registry in `GamesRegistry`). The backend stores
instructions, questions, authoritative answers, and **per-riddle progression** for challenge mode.

**Practice** riddles (`mode: "practice"`) also submit answers to `POST .../responses` so the backend remains
the authoritative validator. They do not create durable progression rows; the response only tells the client
whether the submitted answer is correct.

**Challenge** riddles require authenticated users and store progression in `riddle_progressions`. Answers are
submitted **one question at a time** via the same `POST /api/riddles/{riddleId}/responses` endpoint.

Chapter-level flow is documented in [`chapters.md`](./chapters.md).

## 1. Objects

### Riddle summary (embedded in chapter detail)

See hydrated riddle steps in `GET /api/chapters/{id}` — questions omit `answer` and include `hint` in the play view.

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
  "score": 33
}
```

`status` is one of `not_started`, `in_progress`, `completed` (`not_started` is virtual when no row exists).
`score` uses the same mistake-based `0-100` scale as the frontend game engine: `100` means no incorrect
validation attempt; otherwise the score is `round(completedUnits / (completedUnits + mistakes) * 100)`.

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
    "score": 50
  }
}
```

For practice riddles, `progress` may be `null` or omitted because validation does not create durable
progression. For challenge riddles, when the last question is answered correctly, `status` becomes
`completed` and the server may auto-complete the parent chapter if all challenge riddles are done.

---

## 2. Consumer endpoints

### `GET /api/riddles/{riddleId}`

- **Access**: public (no session required), same visibility rules as the parent chapter. Guests and
  authenticated users receive the play payload when the chapter is accessible; `404` when the chapter is
  restricted for the caller's class.
- **Purpose**: fetch riddle metadata and play questions (without answers, with hints in the play view).

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
- **Purpose**: open or resume challenge riddle progression.
- **CSRF**: required.
- **Behavior**: creates or resumes a `riddle_progressions` row for challenge riddles if absent; rejects if
  already `completed`. Practice riddles do not require this endpoint before answer validation.

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

#### Errors

- `409 RIDDLE_ALREADY_COMPLETED`
- `422 VALIDATION_ERROR` — invalid riddle state

---

### `GET /api/riddles/{riddleId}/progress`

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — returns the **caller's own**
  progression only.

---

### `POST /api/riddles/{riddleId}/responses`

- **Access**: authenticated account for persisted challenge progression; public practice validation may be used
  when the parent chapter is accessible.
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
- `score` is recalculated after every response from the stored answers in the current attempt, on the same
  `0-100` mistake-based scale used by the UI.
- For practice riddles, completion is persisted but does not count toward chapter auto-completion.

#### Errors

- `409 RIDDLE_NOT_IN_PROGRESS` — challenge riddle only
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
