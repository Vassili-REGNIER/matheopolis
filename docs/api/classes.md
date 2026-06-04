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
- **Purpose**: export class progression as a spreadsheet.
- **Output**: a CSV file download (`class-{id}-students-progress.csv`) with columns for first name, last
  name, username, started riddles, completed riddles, completion rate, and last activity timestamp.
- This endpoint returns a binary body, not the JSON envelope.

### Errors

- `401 AUTH_REQUIRED`, `403 ACCESS_DENIED`, `404 NOT_FOUND`.
