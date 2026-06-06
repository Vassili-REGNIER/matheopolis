# API — Quizzes

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Quizzes are a **chapter type** authored by teachers/admins and stored in the database. They are listed
alongside narrative chapters from `GET /api/chapters` in `GameHome` (discriminated by `type`). All quiz
endpoints require an authenticated session; mutating ones also require the `X-CSRF-Token` header.

## 1. Concepts

### Visibility

- A quiz is `public` or `private`.
- Default access (no class override): `public` is accessible to everyone, `private` to no one.
- A teacher can override the default **for their own classes** via class-access entries:
  - **restrict** a `public` quiz for an owned class — the teacher only needs to own the class,
  - **grant** a `private` quiz to an owned class — the teacher must own **both** the quiz and the class.
- Only admins can create public quizzes or turn a quiz public.

### Access matrix (`GET /api/quizzes`)

| Role | Quizzes returned |
| --- | --- |
| `admin` | all quizzes |
| `teacher` | all `public` quizzes + own `private` quizzes |
| `student` | `public` quizzes except those restricted for the student's class, plus `private` quizzes granted to the student's class |
| `free_user` | all `public` quizzes |
| guest | none (quizzes are not exposed in guest mode) |

### Questions and scoring

- Questions are choice-based only: `radio` (one correct), `select` (one correct, dropdown), `checkbox`
  (one or more correct).
- Scoring is **all-or-nothing per question**: a question is correct only when the selected options are exactly
  the set of correct options. The score is `correctQuestions / totalQuestions`.

### Attempts

- A user answers questions one at a time; the **first answer auto-starts an attempt**.
- Multiple attempts are allowed; the answer history is kept per attempt.
- After an attempt is completed (all questions answered), the user can fetch the **correction**.

## 2. Objects

### Quiz summary (list item)

```json
{
  "id": 5,
  "type": "quiz",
  "title": "Fractions basics",
  "description": "Warm-up on adding simple fractions",
  "status": "public",
  "creatorId": 2,
  "askAdmin": false,
  "questionCount": 2,
  "position": 12,
  "createdAt": "2026-05-26T14:00:00Z",
  "progress": {
    "status": "completed",
    "attemptCount": 2,
    "currentQuestionIndex": 2,
    "lastScore": 1,
    "bestScore": 2
  }
}
```

- `type` is the chapter-type discriminant used by `GameHome` to merge quizzes into the chapter list.
- `progress` is the caller's own progression, or `null` if never started (always `null` for `free_user`
  without a started attempt).

### Question — play view (no correct flags)

```json
{
  "id": 100,
  "label": "What is 1/2 + 1/2?",
  "type": "radio",
  "orderIndex": 0,
  "options": [
    { "id": 1000, "label": "1" },
    { "id": 1001, "label": "1/4" }
  ]
}
```

### Quiz progress

```json
{
  "quizId": 5,
  "userId": 6,
  "status": "in_progress",
  "attemptCount": 2,
  "currentQuestionIndex": 1,
  "startedAt": "2026-05-26T13:00:00Z",
  "completedAt": null,
  "lastScore": 1,
  "bestScore": 2
}
```

`status` is one of `not_started`, `in_progress`, `completed`. `not_started` is a **virtual** value the API
returns when the user has no progression row yet; it is never stored in the database (a row exists only once
an attempt has started).

---

## 3. Consumer endpoints

### `GET /api/quizzes`

- **Access**: any authenticated user (results filtered per the access matrix above).
- **Purpose**: list the quizzes the caller can access.
- **Query (admin only)**: `publicationRequested=true` returns only quizzes awaiting publication
  (`askAdmin = true`).

#### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "type": "quiz",
        "title": "Fractions basics",
        "description": "Warm-up on adding simple fractions",
        "status": "public",
        "creatorId": 2,
        "questionCount": 2,
        "position": 12,
        "createdAt": "2026-05-26T14:00:00Z",
        "progress": null
      }
    ]
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`.

---

### `GET /api/quizzes/{id}`

- **Access**: any user with access to the quiz (per the access matrix).
- **Purpose**: fetch a quiz with its questions. Callers who can **manage** the quiz (owner teacher or admin)
  receive the management view (`askAdmin`, `updatedAt`, `isCorrect` on options). Everyone else receives the
  play view without correct-answer flags.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": 5,
      "type": "quiz",
      "title": "Fractions basics",
      "description": "Warm-up on adding simple fractions",
      "status": "public",
      "creatorId": 2,
      "questionCount": 2,
      "createdAt": "2026-05-26T14:00:00Z",
      "questions": [
        {
          "id": 100,
          "label": "What is 1/2 + 1/2?",
          "type": "radio",
          "orderIndex": 0,
          "options": [
            { "id": 1000, "label": "1" },
            { "id": 1001, "label": "1/4" }
          ]
        },
        {
          "id": 101,
          "label": "Which of these equal 1/2?",
          "type": "checkbox",
          "orderIndex": 1,
          "options": [
            { "id": 1002, "label": "2/4" },
            { "id": 1003, "label": "3/6" },
            { "id": 1004, "label": "1/3" }
          ]
        }
      ]
    }
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `404 NOT_FOUND`.
- `403 QUIZ_NOT_ACCESSIBLE` — the caller has no access to this quiz.

---

### `GET /api/quizzes/{id}/progress`

- **Access**: any user with access to the quiz (own progression).
- **Purpose**: read the caller's current progression for the quiz.

#### Response `200`

Returns the quiz progress object inside `data.progress`, or a `not_started` snapshot if never attempted.

#### Errors

- `401 AUTH_REQUIRED`, `403 QUIZ_NOT_ACCESSIBLE`, `404 NOT_FOUND`.

---

### `POST /api/quizzes/{id}/attempts`

- **Access**: any user with access to the quiz.
- **Purpose**: explicitly start a fresh attempt (used to retake a quiz after completing one). The first
  answer also auto-starts an attempt, so this call is optional for the first run.
- **CSRF**: required.
- **Behavior**: increments `attemptCount`, resets `currentQuestionIndex` to `0`, sets `status` to
  `in_progress`.

#### Response `201`

Returns the quiz progress object inside `data.progress`.

#### Errors

- `401 AUTH_REQUIRED`, `403 QUIZ_NOT_ACCESSIBLE`, `404 NOT_FOUND`.

---

### `POST /api/quizzes/{id}/responses`

- **Access**: any user with access to the quiz.
- **Purpose**: submit the answer to one question. If no attempt is in progress, this **auto-starts one**.
- **CSRF**: required.
- **Behavior**: stores the selected option(s) for the current attempt and question, advances
  `currentQuestionIndex`. When the last question is answered, the attempt is marked `completed` and the score
  is computed. To avoid leaking answers mid-attempt, the response does **not** reveal per-question correctness;
  use the correction endpoint after completion.

#### Request

```json
{
  "questionId": 100,
  "optionIds": [1001]
}
```

- `optionIds` is always an array. `radio`/`select` send exactly one id; `checkbox` sends zero or more.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "progress": {
      "quizId": 5,
      "userId": 6,
      "status": "in_progress",
      "attemptCount": 1,
      "currentQuestionIndex": 1,
      "startedAt": "2026-05-26T13:00:00Z",
      "completedAt": null,
      "lastScore": null,
      "bestScore": null
    }
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `403 QUIZ_NOT_ACCESSIBLE`, `404 NOT_FOUND`.
- `422 VALIDATION_ERROR` — `questionId` not in this quiz, option ids not belonging to the question, or wrong
  cardinality for the question type.

---

### `GET /api/quizzes/{id}/correction`

- **Access**: any user with access to the quiz, **after completing at least one attempt**.
- **Purpose**: return the correction for a completed attempt: quiz info + questions with correct options +
  the user's answers + score.
- **Query**: `attempt=<number>` to target a specific completed attempt (defaults to the latest completed one).

#### Response `200`

```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": 5,
      "title": "Fractions basics",
      "status": "public"
    },
    "attempt": {
      "number": 1,
      "completedAt": "2026-05-26T13:05:00Z",
      "score": 1,
      "total": 2
    },
    "questions": [
      {
        "id": 100,
        "label": "What is 1/2 + 1/2?",
        "type": "radio",
        "orderIndex": 0,
        "options": [
          { "id": 1000, "label": "1", "isCorrect": true },
          { "id": 1001, "label": "1/4", "isCorrect": false }
        ],
        "selectedOptionIds": [1001],
        "isCorrect": false
      },
      {
        "id": 101,
        "label": "Which of these equal 1/2?",
        "type": "checkbox",
        "orderIndex": 1,
        "options": [
          { "id": 1002, "label": "2/4", "isCorrect": true },
          { "id": 1003, "label": "3/6", "isCorrect": true },
          { "id": 1004, "label": "1/3", "isCorrect": false }
        ],
        "selectedOptionIds": [1002, 1003],
        "isCorrect": true
      }
    ]
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `403 QUIZ_NOT_ACCESSIBLE`, `404 NOT_FOUND`.
- `409 QUIZ_ATTEMPT_NOT_COMPLETED` — no completed attempt to correct.

---

## 4. Management endpoints

### `POST /api/quizzes`

- **Access**: teacher or admin.
- **Purpose**: create a quiz, optionally with its questions inline.
- **CSRF**: required.
- **Rules**:
  - a teacher can only create a `private` quiz (any `status` other than `private` is rejected),
  - an admin can create a `private` or `public` quiz.

#### Request

```json
{
  "title": "Fractions basics",
  "description": "Warm-up on adding simple fractions",
  "status": "private",
  "questions": [
    {
      "label": "What is 1/2 + 1/2?",
      "type": "radio",
      "orderIndex": 0,
      "options": [
        { "label": "1", "isCorrect": true },
        { "label": "1/4", "isCorrect": false }
      ]
    }
  ]
}
```

- `status` optional (defaults to `private`); only admins may pass `public`.
- `questions` optional; each question needs a `label`, a `type`, and at least two options with at least one
  correct option (`radio`/`select` require exactly one correct option).

#### Response `201`

Returns the created quiz (management view, with `isCorrect` on options) inside `data.quiz`.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED` (e.g. teacher requesting `public`), `422 VALIDATION_ERROR`.

---

### `PATCH /api/quizzes/{id}`

- **Access**: owner teacher or admin.
- **Purpose**: update quiz metadata, request publication, or publish.
- **CSRF**: required.
- **Rules**:
  - owner teacher: may update `title`/`description` and set `askAdmin` to request publication; **cannot**
    change `status`,
  - admin: may update `title`/`description`, set `status` to `public`/`private` (publishing clears
    `askAdmin`).

#### Request — teacher requests publication

```json
{
  "askAdmin": true
}
```

#### Request — admin publishes

```json
{
  "status": "public"
}
```

#### Response `200`

Returns the updated quiz (management view) inside `data.quiz`.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.
- `409 QUIZ_ALREADY_PUBLIC` — publishing a quiz that is already public.

---

### `DELETE /api/quizzes/{id}`

- **Access**: owner teacher or admin.
- **Purpose**: delete a quiz and its questions/options/progressions (cascade).
- **CSRF**: required.

#### Response `204`

No content.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

### `POST /api/quizzes/{id}/questions`

- **Access**: owner teacher (own private quiz) or admin (any quiz).
- **Purpose**: add a question with its options.
- **CSRF**: required.

#### Request

```json
{
  "label": "Which of these equal 1/2?",
  "type": "checkbox",
  "orderIndex": 1,
  "options": [
    { "label": "2/4", "isCorrect": true },
    { "label": "3/6", "isCorrect": true },
    { "label": "1/3", "isCorrect": false }
  ]
}
```

#### Response `201`

Returns the created question (with `isCorrect` flags) inside `data.question`.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### `PATCH /api/quizzes/{id}/questions/{questionId}`

- **Access**: owner teacher (own private quiz) or admin.
- **Purpose**: update a question's label/type/order and/or replace its options.
- **CSRF**: required.
- **Note**: when `options` is provided, it fully replaces the question's existing options.

#### Request

```json
{
  "label": "Which fractions equal one half?",
  "options": [
    { "label": "2/4", "isCorrect": true },
    { "label": "1/3", "isCorrect": false }
  ]
}
```

#### Response `200`

Returns the updated question inside `data.question`.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### `DELETE /api/quizzes/{id}/questions/{questionId}`

- **Access**: owner teacher (own private quiz) or admin.
- **Purpose**: delete a question and its options.
- **CSRF**: required.
- **Side effect**: remaining questions are reindexed to contiguous `orderIndex` values (`0..n-1`) in
  ascending display order.

#### Response `204`

No content.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## 5. Class access (visibility overrides)

These endpoints manage `quiz_target_classes` entries, which override the default visibility for a specific
`(quiz, class)` pair.

### `GET /api/quizzes/{id}/target-classes`

- **Access**: owner teacher (own classes only) or admin.
- **Purpose**: list the class-access overrides for a quiz.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      { "classId": 1, "isActive": true },
      { "classId": 4, "isActive": false }
    ]
  },
  "error": null
}
```

For a teacher, only entries about owned classes are returned.

---

### `PUT /api/quizzes/{id}/target-classes/{classId}`

- **Access**:
  - admin: any quiz/class,
  - teacher: see rules below.
- **Purpose**: create or update the access override for a `(quiz, class)` pair.
- **CSRF**: required.
- **Teacher rules**:
  - to **restrict** a `public` quiz (`isActive = false`): the teacher must own the **class** (not necessarily
    the quiz),
  - to **grant** a `private` quiz (`isActive = true`): the teacher must own **both** the quiz and the class.

#### Request

```json
{
  "isActive": true
}
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "targetClass": { "quizId": 5, "classId": 1, "isActive": true }
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

### `DELETE /api/quizzes/{id}/target-classes/{classId}`

- **Access**: admin, or teacher owning the class.
- **Purpose**: remove an override so the `(quiz, class)` pair reverts to the quiz's default visibility.
- **CSRF**: required.

#### Response `204`

No content.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## 6. Publication flow (summary)

1. A teacher owns a `private` quiz and wants it published: `PATCH /api/quizzes/{id}` with `{"askAdmin": true}`.
2. Admins discover requests: `GET /api/quizzes?publicationRequested=true`.
3. An admin publishes: `PATCH /api/quizzes/{id}` with `{"status": "public"}` (this clears `askAdmin`).

There is no rejection workflow or stored rejection reason: an admin simply leaves `status = private` (and may
clear `askAdmin`).

## 7. Data model

Quizzes are persisted in MySQL (narrative chapter content stays in the frontend). Tables:

- `quizzes` — general quiz info: `id`, `title`, `description`, `creator_id`, `status` (`private`/`public`),
  `ask_admin`, `position`, `created_at`, `updated_at`.
- `quiz_questions` — questions: `id`, `quiz_id`, `label`, `order_index`, `type` (`select`/`checkbox`/`radio`).
- `quiz_options` — answer options: `id`, `question_id`, `label`, `is_correct`.
- `quiz_target_classes` — visibility overrides: `id`, `quiz_id`, `class_id`, `is_active`.
- `quiz_progressions` — per `(student, quiz)` progression: `id`, `student_id`, `quiz_id`, `status`
  (`in_progress`/`completed` only), `attempt_count`, `current_question_index`, `last_score`, `best_score`,
  `started_at` (mandatory), `completed_at`. A row exists only once an attempt has started; `not_started` is a
  virtual API value, not a stored one.
- `quiz_responses` — per-answer history: `id`, `progression_id`, `question_id`, `option_id`, `attempt_number`,
  `created_at`. One row per selected option, so `checkbox` answers produce several rows for one question.

See `backend/database/schema.sql` for the authoritative DDL.
