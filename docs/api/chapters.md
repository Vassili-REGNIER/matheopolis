# API — Chapters

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Narrative chapters are composed of an **ordered scenario** stored relationally in MySQL (not a JSON blob on
`chapters`). Each step is one row in `chapter_steps` with type `info`, `dialogue`, or `riddle`:

- `step_infos` — info screens (`content` JSON with either simple `title`/`text` fields or structured
  `InfoStep.content`, plus optional `buttonText` and `secondaryAction`),
- `step_dialogues` + `dialogue_lines` — dialogue sequences (`dialogue_lines.step_id` → `step_dialogues.step_id`),
- `riddles` — mini-game steps (1:1 with a `chapter_steps` row via `step_id`).

See [`riddles.md`](./riddles.md) for riddle validation endpoints. Quizzes are a separate type in
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
- **Riddle progression** is not persisted during play. Challenge riddles validate answers server-side, but if
  the player leaves mid-riddle they restart that riddle from its first question.

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

- `info` and `dialogue` steps are built from `step_infos` / `step_dialogues` / `dialogue_lines`. Info steps
  may expose simple `title`/`text` fields or structured `content` rendered by the frontend info block.
- `riddle` steps are built from `riddles` + `riddle_questions`. Play questions include `id`,
  `questionIndex`, `question`, `difficulty`, optional `metadata`, and `hint`; `answer` is exposed only for
  `practice` riddle steps.
- Clients submit challenge answers via [`POST /api/riddles/{riddleId}/responses`](./riddles.md).
- Clients save chapter progression with `POST /api/chapters/{id}/progress` after each completed scenario step.

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
        "type": "info",
        "content": {
          "id": "fraction-rules",
          "titre": "Regles du jeu",
          "nodes": [
            {
              "type": "element",
              "tag": "p",
              "text": "Lis le cours avant de lancer l'entrainement."
            }
          ]
        },
        "buttonText": "Lire le cours"
      },
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
            {
              "id": 40,
              "questionIndex": 0,
              "question": "2/2",
              "answer": "SOL",
              "hint": "Reduisez la fraction puis multipliez par 3/2.",
              "difficulty": 1,
              "metadata": {}
            }
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

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — own progression only.
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
      "currentStepIndex": 0,
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

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.
- `409 CHAPTER_ALREADY_COMPLETED`.

---

### `GET /api/chapters/{id}/progress`

- **Access**: authenticated account (`student`, `free_user`, `teacher`, `admin`) — returns the **caller's own**
  progression only.
- **Purpose**: read chapter progression.

---

### `POST /api/chapters/{id}/progress`

- **Access**: authenticated account.
- **Purpose**: save the caller's current chapter scenario step after a step has been completed.
- **CSRF**: required.

#### Request

```json
{
  "currentStepIndex": 2,
  "score": 5
}
```

#### Behavior

- Creates chapter progression when needed.
- Keeps progression monotonic: a request may keep the same step or advance by one step; larger jumps are
  rejected.
- Does not save any per-riddle question index.

#### Errors

- `409 CHAPTER_STEP_OUT_OF_SEQUENCE`.
- `409 CHAPTER_ALREADY_COMPLETED`.
- `422 VALIDATION_ERROR` — missing or out-of-range `currentStepIndex`.

---

### `POST /api/chapters/{id}/complete`

- **Access**: authenticated account.
- **Purpose**: mark the chapter completed after the chapter scenario reaches its last step.
- **CSRF**: required.
- **Behavior**: server verifies that `currentStepIndex` is at the final scenario step before setting chapter
  status to `completed`.

#### Errors

- `409 CHAPTER_NOT_READY` — chapter step progression has not reached the final scenario step.
- `409 CHAPTER_ALREADY_COMPLETED`.

---

## 4. Persistence

Tables: `chapters`, `chapter_steps`, `step_infos`, `step_dialogues`, `dialogue_lines`, `riddles`,
`riddle_questions`, `chapter_target_classes`, `chapter_progressions`.

- `step_infos.content` stores JSON. Simple screens may use `title`, `text`, and optional `buttonText`; course
  and rules screens may use structured `content` (`id`, `titre`, `paragraph`, `nodes`, `styles`) plus optional
  `secondaryAction`. The API preserves structured content in play steps and only flattens simple display/action
  fields when present.
- `dialogue_lines` reference `step_dialogues.step_id` (not `chapter_steps` directly). Dialogue character
  images are exposed as `/assets/characters/{speakerId}-{emotion}.png`.
- `chapter_progressions` tracks `current_step_index`, `attempt_count`, and `score` per
  `(user_id, chapter_id, attempt_count)`.

Initial content is loaded via `backend/database/seeds/content/scenario.sql` and the chapter-specific
`backend/database/seeds/content/scenario-*.sql` files (manual authoring until a management UI exists).
