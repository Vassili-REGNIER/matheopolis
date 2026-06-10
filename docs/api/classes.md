# API — Classes

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Classes are owned by a teacher. Students self-register into a class using its `code`. All endpoints below
require an authenticated session; mutating ones also require the `X-CSRF-Token` header.

### Class object

```json
{
  "id": 1,
  "name": "Class 6A",
  "description": "Main class for level 6 students",
  "level": "grade_6",
  "code": "CLS-6A01",
  "teacherId": 2,
  "createdAt": "2026-05-20T09:30:00Z",
  "archivedAt": null
}
```

Allowed `level` values: `grade_6`, `grade_7`, `grade_8`, `grade_9`, `grade_10`, `grade_11`, `grade_12`.

## CSV conventions (import, export, passwords)

All class CSV endpoints use **RFC 4180-style CSV** produced/consumed by PHP `fputcsv` / `fgetcsv`:

- **Encoding**: UTF-8 (no BOM required; clients may send UTF-8 with or without BOM).
- **Delimiter**: comma (`,`).
- **Quote**: double quote (`"`).
- **Line endings**: platform default on output; any standard line ending accepted on input.
- **Header row**: required on import; included on every export.
- **Response body**: raw CSV file download (`Content-Type: text/csv; charset=utf-8`), not the JSON envelope.

### Generated student passwords

When the API generates a password (import or teacher reset):

- **Length**: 12 characters.
- **Alphabet**: `a–z`, `A–Z`, `2–9` (ambiguous characters `0`, `1`, `i`, `l`, `o`, `O` excluded).
- **Storage**: only a bcrypt hash is persisted (`users.password_hash`). The plaintext is returned **once**
  in the HTTP response (CSV column or JSON field) and is never stored or retrievable again.

### Import (`POST /api/classes/{id}/students/import`)

**Input columns** (header row, case-insensitive; extra columns ignored):

| Column | Required | Notes |
| --- | --- | --- |
| `nom` | yes | Student last name; non-empty after trim. |
| `prenom` | yes | Student first name; non-empty after trim. |

**Example input:**

```csv
nom,prenom
Dupont,Jean
Martin,Léa
```

**Output columns** (always in this order):

| Column | Description |
| --- | --- |
| `nom` | Echo of input last name. |
| `prenom` | Echo of input first name. |
| `identifiant` | Server-generated username (`first.last1`, `first.last2`, … until unique). |
| `mots de passes` | One-time generated password (12 chars). |

**Output filename**: `class-{id}-students-import.csv`.

**Validation**: the server parses and validates the entire file before creating any account. On failure,
returns `422 INVALID_CSV_FORMAT` with message `Invalid CSV format.` (missing header, unknown header,
empty file, no data rows, or any row with empty `nom`/`prenom`).

**Transport**: `Content-Type: text/csv` raw body, or `multipart/form-data` with field `file`.

### Export overview (`GET .../progress/export` or `?mode=overview`)

One row per student in the class. Columns:

| Column | Description |
| --- | --- |
| `nom` | Last name. |
| `prenom` | First name. |
| `identifiant` | Username. |
| `chapitre:{title}` | One column per chapter (DB order). Value: `not_started`, `in_progress`, or `completed` (latest attempt). |
| `progression_totale` | Percentage of chapters completed, e.g. `50%` or `66.67%`. `0%` when there are no chapters. |

**Filename**: `class-{id}-progress-overview.csv`.

### Export chapter detail (`GET .../progress/export?mode=chapter&chapterId={id}`)

One row per student for a single chapter. Fixed columns, then one **triple** of columns per riddle step in
the chapter (chapter order):

| Column | Description |
| --- | --- |
| `nom`, `prenom`, `identifiant` | Student identity. |
| `chapitre_statut` | `not_started`, `in_progress`, or `completed`. |
| `chapitre_score` | Latest chapter score, or empty if null. |
| `chapitre_etape_courante` | Latest `current_step_index`. |
| `enigme:{title}:statut` | Riddle status (`not_started` / `in_progress` / `completed`). |
| `enigme:{title}:tentatives` | Latest riddle `attempt_count`. |
| `enigme:{title}:score` | Latest riddle score, or empty if null. |

**Filename**: `class-{id}-chapter-{chapterId}-progress.csv`.

---

## `GET /api/classes`

- **Access**: teacher.
- **Purpose**: list classes owned by the authenticated teacher.

### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Class 6A",
        "description": "Main class for level 6 students",
        "level": "grade_6",
        "code": "CLS-6A01",
        "teacherId": 2,
        "createdAt": "2026-05-20T09:30:00Z",
        "archivedAt": null
      }
    ]
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED` (non-teacher).

---

## `POST /api/classes`

- **Access**: teacher.
- **Purpose**: create a class. The `code` is generated server-side.
- **CSRF**: required.

### Request

```json
{
  "name": "Class 6A",
  "description": "Main class for level 6 students",
  "level": "grade_6"
}
```

- `name` string (required, 1–120 chars).
- `description` string (optional).
- `level` string (required, allowed catalog value).

### Response `201`

Returns the created `class` object inside `data.class`.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `422 VALIDATION_ERROR`.

---

## `GET /api/classes/{id}`

- **Access**: owner teacher or admin.
- **Purpose**: get class details, including the teacher summary and (optionally) the student list.
- **Query**: `includeStudents=true` to embed the student array.

### Response `200`

```json
{
  "success": true,
  "data": {
    "class": {
      "id": 1,
      "name": "Class 6A",
      "description": "Main class for level 6 students",
      "level": "grade_6",
      "code": "CLS-6A01",
      "teacherId": 2,
      "createdAt": "2026-05-20T09:30:00Z",
      "archivedAt": null,
      "teacher": {
        "id": 2,
        "firstName": "Theo",
        "lastName": "Teacher",
        "username": "teacher1",
        "role": "teacher"
      },
      "students": []
    }
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## `PATCH /api/classes/{id}`

- **Access**: owner teacher or admin.
- **Purpose**: update class metadata.
- **CSRF**: required.

### Request

```json
{
  "name": "Class 6A - Group 1",
  "description": "Updated description",
  "level": "grade_7"
}
```

All fields optional; at least one must be present.

### Response `200`

Returns the updated `class` object inside `data.class`.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR`.

---

## `DELETE /api/classes/{id}`

- **Access**: owner teacher or admin.
- **Purpose**: delete or archive a class.
- **CSRF**: required.

### Response `204`

No content.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## `GET /api/classes/{id}/students`

- **Access**: owner teacher or admin.
- **Purpose**: list students in the class.

### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 6,
        "firstName": "Sam",
        "lastName": "Student",
        "username": "sam.student1",
        "email": null,
        "role": "student",
        "classId": 1,
        "createdAt": "2026-05-21T10:00:00Z"
      }
    ]
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## `GET /api/classes/{id}/students/progress`

- **Access**: owner teacher or admin.
- **Purpose**: list students with a progression summary.

### Response `200`

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "userId": 6,
        "startedRiddles": 5,
        "completedRiddles": 3,
        "completionRate": 0.6,
        "lastActivityAt": "2026-05-26T13:45:00Z"
      }
    ]
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## `GET /api/classes/{id}/students/progress/export`

- **Access**: owner teacher or admin.
- **Purpose**: export class progression as CSV (see [CSV conventions](#csv-conventions-import-export-passwords)).
- **Query**:
  - `mode=overview` (default) — overview export.
  - `mode=chapter&chapterId={id}` — single-chapter detail export.
- **Output**: CSV file download (not the JSON envelope).

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 VALIDATION_ERROR` (missing `chapterId` in
  chapter mode).

---

## `POST /api/classes/{id}/students/import`

- **Access**: owner teacher or admin.
- **Purpose**: bulk-create students in an existing class from CSV (see
  [CSV conventions](#csv-conventions-import-export-passwords)).
- **CSRF**: required.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`, `422 INVALID_CSV_FORMAT`.

---

## `DELETE /api/classes/{id}/students/{studentId}`

- **Access**: owner teacher or admin.
- **Purpose**: delete a student account that belongs to the class. Associated progression and token rows are
  removed by database cascades.
- **CSRF**: required.

### Response `204`

Empty body.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.

---

## `POST /api/classes/{id}/students/{studentId}/reset-password`

- **Access**: owner teacher or admin.
- **Purpose**: generate a new random password for a student in the class (12-char alphabet, same rules as
  import).
- **CSRF**: required.

### Response `200`

```json
{
  "success": true,
  "data": {
    "password": "aBc3Xy9KpQ2m"
  },
  "error": null
}
```

The plaintext password is returned once; only the bcrypt hash is stored.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.
