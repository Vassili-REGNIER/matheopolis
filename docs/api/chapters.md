# API — Chapters

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Narrative chapters are composed of an **ordered scenario** stored relationally in MySQL (not a JSON blob on
`chapters`). Each step is one row in `chapter_steps` with type `info`, `dialogue`, or `riddle`:

- `step_infos` — info screens (`content` JSON with `title`, `text`, optional `buttonText`),
- `step_dialogues` + `dialogue_lines` — dialogue sequences (`dialogue_lines.step_id` → `step_dialogues.step_id`),
- `riddles` — mini-game steps (1:1 with a `chapter_steps` row via `step_id`).

See [`riddles.md`](./riddles.md) for riddle progression endpoints. Quizzes are a separate type in
[`quizzes.md`](./quizzes.md). `GameHome` displays chapters first (`GET /api/chapters`), then private and public
quiz sections from `GET /api/quizzes` (each ordered by `position`).

Mini-game **implementations** live in the frontend (`game_id` on each riddle). The API assembles the play
scenario from these tables on `GET /api/chapters/{id}`.

## 1. Concepts

### Chapter vs riddle

- A **chapter** is a playable narrative unit with a ordered `scenario` (dialogue, info, riddle references).
- A **riddle** is a database-backed mini-game step (`game_id`, questions, server-side answers). A chapter
  typically contains several riddles (practice + challenge).
- **Chapter progression** tracks overall completion of the chapter.
- **Riddle progression** tracks each challenge riddle separately. Practice riddles are still validated by the
  API but do not persist durable progression.

### Visibility (narrative chapters)

Narrative chapters are **public by default** (accessible to everyone). Per-class overrides in
`chapter_target_classes` can restrict a public chapter for a class:

- `is_active = FALSE` on `(chapter, class)` **restricts** the chapter for that class.
- `is_active = TRUE` is not used for chapters because there are no private chapters. Use `DELETE` on the
  target-class endpoint to remove a restriction and return to the public default.

### Access matrix (`GET /api/chapters`)

| Role | Chapters returned |
| --- | --- |
| `admin` | all chapters |
| `teacher` | all chapters |
| `free_user` | all chapters |
| `student` | all chapters except those with `is_active = FALSE` for the student's class |
| unauthenticated (guest catalog) | all chapters (no progression fields) |

### Scenario play view

`GET /api/chapters/{id}` walks `chapter_steps` in `order_index` and returns a `scenario.steps` array shaped
like the frontend `GameStep[]` contract:

- `info` and `dialogue` steps are built from `step_infos` / `step_dialogues` / `dialogue_lines`.
- `riddle` steps are built from `riddles` + `riddle_questions` (play view omits answers and includes hints).
- Clients submit practice and challenge answers via [`POST /api/riddles/{riddleId}/responses`](./riddles.md).

## 2. Objects

### Chapter summary (list item)

```json
{
  "id": 1,
  "type": "narrative",
  "slug": "piano-fractions",
  "title": "Fractions musicales",
  "statement": "La lecon de la gamme de Pythagore.",
  "position": 1,
  "stepCount": 12,
  "progress": {
    "currentStepIndex": 4,
    "status": "in_progress",
    "startedAt": "2026-05-21T09:00:00Z",
    "completedAt": null
  }
}
```

- `type` is always `narrative` for this resource (quizzes use `type: "quiz"`).
- `stepCount` is the number of playable scenario steps returned by `GET /api/chapters/{id}`. It counts every
  visible scenario step (`info`, `dialogue`, practice riddles, and challenge riddles) so the frontend can
  display the user's real resume position.
- `progress` is the caller's chapter progression, or `null` when unauthenticated or never started.

### Chapter detail (play view)

```json
{
  "id": 1,
  "type": "narrative",
  "slug": "piano-fractions",
  "title": "Fractions musicales",
  "statement": "La lecon de la gamme de Pythagore.",
  "position": 1,
  "stepCount": 2,
  "scenario": {
    "steps": [
      {
        "type": "riddle",
        "riddleId": 10,
        "gameId": "PianoFractions",
        "mode": "practice",
        "title": "Premieres quintes",
        "instruction": "Cliquez sur la note qui correspond a la quinte.",
        "introText": "Reduisez la fraction affichee.",
        "completionMessage": "Bravo !",
        "gameParams": {
          "questions": [
            { "question": "2/2", "difficulty": 1, "metadata": {} }
          ]
        }
      },
      {
        "type": "info",
        "title": "Melodie reconstituee",
        "text": "Les fractions ont chante juste.",
        "buttonText": "Retour a la carte",
        "theme": "endChapter"
      }
    ]
  },
  "progress": null
}
```

### Chapter progress

```json
{
  "chapterId": 1,
  "userId": 6,
  "status": "in_progress",
  "startedAt": "2026-05-21T09:00:00Z",
  "completedAt": null
}
```

`status` is one of `not_started`, `in_progress`, `completed`. `not_started` is a **virtual** value when no
row exists yet.

---

## 3. Consumer endpoints

### `GET /api/chapters`

- **Access**: public (no session required).
- **Purpose**: list narrative chapters the caller may open. When a session is present, each item
  includes the caller's `progress`.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "type": "narrative",
        "slug": "piano-fractions",
        "title": "Fractions musicales",
        "statement": "La lecon de la gamme de Pythagore.",
        "position": 1,
        "progress": null
      }
    ]
  },
  "error": null
}
```

---

### `GET /api/chapters/{id}`

- **Access**: public when the chapter is accessible to the caller (or to guests for catalog/play in guest
  mode). Returns `404` when the chapter is restricted for the student's class.
- **Purpose**: fetch chapter metadata and the hydrated play scenario.

#### Errors

- `404 NOT_FOUND` — unknown chapter or not accessible.

---

### `POST /api/chapters/{id}/start`

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — own progression only.
- **Purpose**: create, resume, or restart chapter progression.
- **CSRF**: required.
- **Behavior**:
  - No row yet → creates `in_progress` with `currentStepIndex = 0`.
  - `in_progress` → returns the existing row (resume point unchanged).
  - `completed` → starts a **new attempt** on the same row (`currentStepIndex = 0`, clears
    `completedAt` / `score`).

#### Response `200`

```json
{
  "success": true,
  "data": {
    "progress": {
      "chapterId": 1,
      "userId": 6,
      "status": "in_progress",
      "currentStepIndex": 0,
      "score": null,
      "startedAt": "2026-05-21T09:00:00Z",
      "completedAt": null
    }
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

### `POST /api/chapters/{id}/steps`

- **Access**: authenticated account with an `in_progress` chapter.
- **Purpose**: persist the 0-based index of the next scenario step the player should see (`current_step_index`).
- **CSRF**: required.

#### Request

```json
{
  "currentStepIndex": 3
}
```

Call this when the player advances past a step (info, dialogue, or riddle) so a later `GET .../progress` or
`POST .../start` resumes at the correct position.

#### Errors

- `409 CHAPTER_NOT_IN_PROGRESS`
- `422 VALIDATION_ERROR` — negative or out-of-range `currentStepIndex`

---

### `GET /api/chapters/{id}/progress`

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — returns the **caller's own**
  progression only.
- **Purpose**: read chapter progression.

---

### `POST /api/chapters/{id}/complete`

- **Access**: authenticated account.
- **Purpose**: mark the chapter completed after all required challenge riddles are done.
- **CSRF**: required.
- **Behavior**: server verifies that every **challenge** riddle in the chapter has `completed` progression for
  the caller before setting chapter status to `completed`. Clients may send `score` (`0` to `100`) to persist
  the chapter score shown in progression dashboards. If the chapter was already auto-completed by the final
  riddle response, a follow-up `complete` request with `score` updates the stored score.

#### Request

```json
{
  "score": 50
}
```

#### Errors

- `409 CHAPTER_NOT_READY` — one or more challenge riddles are not completed.
- `409 CHAPTER_ALREADY_COMPLETED` — when no score update is provided.
- `422 VALIDATION_ERROR` — invalid score.

---

## 4. Class access (teacher/admin visibility overrides)

These endpoints manage `chapter_target_classes` entries. Chapters are always public by default, so a row only
represents a class-level restriction (`isActive: false`). Removing the row restores access.

### `GET /api/chapters/{id}/target-classes`

- **Access**: admin (all overrides), or teacher (overrides for **owned classes only**).
- **Purpose**: list class restrictions for a chapter.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      { "classId": 1, "isActive": false }
    ]
  },
  "error": null
}
```

For a teacher, only entries about owned classes are returned.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

### `PUT /api/chapters/{id}/target-classes/{classId}`

- **Access**:
  - admin: any chapter/class,
  - teacher: owned classes only.
- **Purpose**: restrict a public chapter for a class.
- **CSRF**: required.

#### Request

```json
{
  "isActive": false
}
```

#### Response `200`

```json
{
  "success": true,
  "data": {
    "targetClass": { "chapterId": 5, "classId": 1, "isActive": false }
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.
- `422 VALIDATION_ERROR` — `isActive` is missing or `true`. Chapter access is already public; use `DELETE` to
  remove a restriction.

---

### `DELETE /api/chapters/{id}/target-classes/{classId}`

- **Access**: admin, or teacher owning the class.
- **Purpose**: remove a chapter restriction so the class returns to public default access.
- **CSRF**: required.

#### Response `204`

No content.

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## 5. Persistence

Tables: `chapters`, `chapter_steps`, `step_infos`, `step_dialogues`, `dialogue_lines`, `riddles`,
`riddle_questions`, `chapter_target_classes`, `chapter_progressions`.

- `step_infos.content` stores JSON. Simple steps use `title`/`text`; course and rules steps use a rich
  `content` document (`titre`, `paragraph`, `nodes`, optional `id`). Step-level fields such as `buttonText`,
  `secondaryAction`, and `contentCss` are promoted beside `type: "info"` in play steps.
- `dialogue_lines` reference `step_dialogues.step_id` (not `chapter_steps` directly). Dialogue character
  images are exposed as `./assets/characters/{speakerId}-{emotion}.png` (served by the frontend static host at document root `frontend/public/`).
- `chapter_progressions` tracks `current_step_index` and `score` per `(user_id, chapter_id)` (one row per user
  and chapter). `current_step_index` is updated via `POST /api/chapters/{id}/steps`. A completed chapter can be
  replayed with `POST .../start`, which resets the same row for a new attempt.

Initial content is loaded via `backend/database/seeds/content/scenario.sql` and the chapter-specific
`backend/database/seeds/content/scenario-*.sql` files (manual authoring until a management UI exists).
