# API — Chapters

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Narrative chapters are composed of an **ordered scenario** stored relationally in MySQL (not a JSON blob on
`chapters`). Each step is one row in `chapter_steps` with type `info`, `dialogue`, or `riddle`:

- `step_infos` — info screens,
- `step_dialogues` + `dialogue_lines` — dialogue sequences,
- `riddles` — mini-game steps (1:1 with a `chapter_steps` row via `step_id`).

See [`riddles.md`](./riddles.md) for riddle progression endpoints. Quizzes are a separate type in
[`quizzes.md`](./quizzes.md). `GameHome` merges `GET /api/chapters` and `GET /api/quizzes` by `position`.

Mini-game **implementations** live in the frontend (`game_id` on each riddle). The API assembles the play
scenario from these tables on `GET /api/chapters/{id}`.

There is **no play-token or anti-cheat layer**; answer validation uses ordinary authenticated requests.

## 1. Concepts

### Chapter vs riddle

- A **chapter** is a playable narrative unit with a ordered `scenario` (dialogue, info, riddle references).
- A **riddle** is a database-backed mini-game step (`game_id`, questions, server-side answers). A chapter
  typically contains several riddles (practice + challenge).
- **Chapter progression** tracks overall completion of the chapter.
- **Riddle progression** tracks each challenge riddle separately (practice riddles do not persist).

### Visibility (narrative chapters)

Narrative chapters are **public by default** (accessible to everyone). Per-class overrides in
`chapter_target_classes` follow the same semantics as quizzes:

- `is_active = FALSE` on `(chapter, class)` **restricts** the chapter for that class.
- `is_active = TRUE` can **grant** access when used with future private chapter types (not used in the
  current seed).

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
- `riddle` steps are built from `riddles` + `riddle_questions` (play view omits answers and hints).
- Clients submit challenge answers via [`POST /api/riddles/{riddleId}/responses`](./riddles.md).

## 2. Objects

### Chapter summary (list item)

```json
{
  "id": 1,
  "type": "narrative",
  "slug": "piano-fractions",
  "title": "Fractions musicales",
  "statement": "La lecon de piano de Pythagore.",
  "position": 1,
  "progress": {
    "status": "in_progress",
    "startedAt": "2026-05-21T09:00:00Z",
    "completedAt": null
  }
}
```

- `type` is always `narrative` for this resource (quizzes use `type: "quiz"`).
- `progress` is the caller's chapter progression, or `null` when unauthenticated or never started.

### Chapter detail (play view)

```json
{
  "id": 1,
  "type": "narrative",
  "slug": "piano-fractions",
  "title": "Fractions musicales",
  "statement": "La lecon de piano de Pythagore.",
  "position": 1,
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
        "statement": "La lecon de piano de Pythagore.",
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

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`).
- **Purpose**: create or resume chapter progression.
- **CSRF**: required.

#### Response `200`

```json
{
  "success": true,
  "data": {
    "progress": {
      "chapterId": 1,
      "userId": 6,
      "status": "in_progress",
      "startedAt": "2026-05-21T09:00:00Z",
      "completedAt": null
    }
  },
  "error": null
}
```

#### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.
- `409 CHAPTER_ALREADY_COMPLETED`.

---

### `GET /api/chapters/{id}/progress`

- **Access**: authenticated user (own progression), teacher/admin (scoped read for class analytics).
- **Purpose**: read chapter progression.

---

### `POST /api/chapters/{id}/complete`

- **Access**: authenticated account.
- **Purpose**: mark the chapter completed after all required challenge riddles are done.
- **CSRF**: required.
- **Behavior**: server verifies that every **challenge** riddle in the chapter has `completed` progression for
  the caller before setting chapter status to `completed`.

#### Errors

- `409 CHAPTER_NOT_READY` — one or more challenge riddles are not completed.
- `409 CHAPTER_ALREADY_COMPLETED`.

---

## 4. Persistence

Tables: `chapters`, `chapter_steps`, `step_infos`, `step_dialogues`, `dialogue_lines`, `riddles`,
`riddle_questions`, `chapter_target_classes`, `chapter_progressions`. Initial content is loaded via
`backend/database/seed.sql` (manual authoring until a management UI exists).
