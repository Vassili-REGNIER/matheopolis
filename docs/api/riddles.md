# API — Riddles

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

A **riddle** is a database-backed mini-game step: one row in `riddles`, tied 1:1 to a `chapter_steps` row
(`type = riddle`). Scenario order comes from `chapter_steps.order_index`, not from the riddles table. The
frontend loads the game implementation from `game_id` (registry in `GamesRegistry`). The backend stores
instructions, questions, and authoritative answers.

**Practice** riddles (`mode: "practice"`) run client-side only: no progression rows and no
`POST .../responses` persistence.

**Challenge** riddles require authenticated users and validate answers server-side via
`POST /api/riddles/{riddleId}/responses`, but they do **not** store per-riddle progression. If a player leaves
mid-riddle, the chapter still points to that riddle step and the riddle restarts from its first question.

Chapter-level flow is documented in [`chapters.md`](./chapters.md).

## 1. Objects

### Riddle summary (embedded in chapter detail)

See hydrated riddle steps in `GET /api/chapters/{id}`. Play questions include `id`, `questionIndex`,
`question`, `difficulty`, optional `metadata`, and `hint`. Challenge questions omit `answer`; practice
questions include `answer` for non-persisted client-side training.

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

Riddle progress responses are virtual compatibility payloads. `GET /progress` always returns `not_started`;
`POST /start` returns virtual `in_progress`; `POST /responses` returns a virtual state for the submitted
answer only. No persistent riddle progression row is created during play.

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

When the last question is answered correctly, the response payload may report virtual `completed`, but the
chapter is completed separately through chapter step progression.

---

## 2. Consumer endpoints

### `GET /api/riddles/{riddleId}`

- **Access**: public (no session required), same visibility rules as the parent chapter. Guests and
  authenticated users receive the play payload when the chapter is accessible; `404` when the chapter is
  restricted for the caller's class.
- **Purpose**: fetch riddle metadata and play questions. Challenge questions include hints but never include
  answers; practice questions include answers for client-side validation.

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
    "title": "Le piano de Pythagore",
    "play": {
      "type": "riddle",
      "riddleId": 2,
      "gameId": "PianoFractions",
      "mode": "challenge",
      "title": "Le piano de Pythagore",
      "instruction": "Simplifiez la fraction affichee...",
      "completionMessage": "Melodie terminee !",
      "gameParams": {
          "questions": [
            {
              "id": 40,
              "questionIndex": 0,
              "question": "2/2",
              "hint": "Reduisez la fraction puis multipliez par 3/2.",
              "difficulty": 1
            }
          ]
        }
      }
  },
  "error": null
}
```

---

### `POST /api/riddles/{riddleId}/start`

- **Access**: authenticated account.
- **Purpose**: compatibility endpoint for opening a challenge riddle.
- **CSRF**: required.
- **Behavior**: rejected for `practice` riddles (`422 VALIDATION_ERROR`). Returns virtual `in_progress` and
  never writes a progression row.

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
      "startedAt": null,
      "completedAt": null
    }
  },
  "error": null
}
```

#### Errors

- `422 VALIDATION_ERROR` — practice riddle

---

### `GET /api/riddles/{riddleId}/progress`

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — returns the **caller's own**
  virtual progression only.

---

### `POST /api/riddles/{riddleId}/responses`

- **Access**: authenticated account with access to the parent chapter.
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
- Does not persist riddle responses or riddle question progression.
- On correct answer: returns a virtual `currentQuestionIndex` for the next question; when the submitted
  question is the last one, returns virtual `completed`.
- On incorrect answer: returns the submitted question index unchanged.

#### Errors

- `422 VALIDATION_ERROR` — unknown question, practice riddle, or empty answer

---

## 3. Management (current phase)

Riddles and questions are **authored manually** in SQL seed scripts for now. Future teacher/admin CRUD endpoints
will follow the same tables (`riddles`, `riddle_questions`). No `GET /api/puzzles` legacy route exists.

---

## 4. Persistence

Tables: `riddles`, `riddle_questions`. Per-riddle progression/response tables are intentionally absent from
the schema; chapter progression is stored in `chapter_progressions`.
