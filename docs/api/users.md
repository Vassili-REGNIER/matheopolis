# API — Users

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

User accounts cover four roles: `admin`, `teacher`, `student`, `free_user`. Usernames are always generated
server-side; clients never choose them.

---

## `POST /api/users`

- **Access**: public (registration).
- **Purpose**: generic account creation. The role is derived from the email domain:
  - an approved academy domain creates a `teacher` account,
  - any other valid email creates a `free_user` account.
- **CSRF**: required.

### Request

```json
{
  "firstName": "Theo",
  "lastName": "Teacher",
  "email": "theo.teacher@ac-lyon.fr",
  "password": "s3cret-pass"
}
```

### Response `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 12,
      "firstName": "Theo",
      "lastName": "Teacher",
      "username": "theo.teacher",
      "email": "theo.teacher@ac-lyon.fr",
      "emailVerified": false,
      "role": "teacher",
      "classId": null,
      "createdAt": "2026-05-26T14:00:00Z"
    }
  },
  "error": null
}
```

### Email verification

A verification email is sent immediately (`email_verification` token, **48 h** TTL). The account cannot log in
until `POST /api/auth/verify-email` succeeds. See [`api/auth.md`](./auth.md#email-verification-and-password-reset-tokens).

### Errors

- `409 CONFLICT` — email already registered.
- `422 VALIDATION_ERROR` — invalid email/password or missing field.

---

## `POST /api/users/teachers`

- **Access**: public (registration).
- **Purpose**: create a teacher account directly.
- **Constraint**: `email` must belong to an approved academy domain (see below).
- **CSRF**: required.

### Request

```json
{
  "firstName": "Theo",
  "lastName": "Teacher",
  "email": "theo.teacher@ac-lyon.fr",
  "password": "s3cret-pass"
}
```

### Response `201`

Same `user` envelope as `POST /api/users`, with `role` set to `teacher` and `emailVerified: false` until
the verification link is used.

### Email verification

Same flow as `POST /api/users` (48 h token, login blocked until verified).

### Errors

- `409 CONFLICT` — email already registered.
- `422 VALIDATION_ERROR` — email domain is not an approved academy domain, or invalid field.

### Approved academy email domains

Teacher registration is accepted only when `email` belongs to one of the following academy domains. The
`www.` prefix is also accepted (for example `www.ac-lyon.fr`).

- `ac-aix-marseille.fr`
- `ac-amiens.fr`
- `ac-besancon.fr`
- `ac-bordeaux.fr`
- `ac-caen.fr`
- `ac-clermont.fr`
- `ac-corse.fr`
- `ac-creteil.fr`
- `ac-dijon.fr`
- `ac-grenoble.fr`
- `ac-guadeloupe.fr`
- `ac-guyane.fr`
- `ac-reunion.fr`
- `ac-lille.fr`
- `ac-limoges.fr`
- `ac-lyon.fr`
- `ac-martinique.fr`
- `ac-mayotte.fr`
- `ac-montpellier.fr`
- `ac-nancy-metz.fr`
- `ac-nantes.fr`
- `ac-nice.fr`
- `ac-noumea.nc`
- `ac-orleans-tours.fr`
- `ac-paris.fr`
- `ac-poitiers.fr`
- `ac-polynesie.pf`
- `ac-reims.fr`
- `ac-rennes.fr`
- `ac-rouen.fr`
- `ac-spm.fr`
- `ac-strasbourg.fr`
- `ac-toulouse.fr`
- `ac-versailles.fr`
- `ac-wf.wf`

---

## `POST /api/users/students`

- **Access**: public (registration).
- **Purpose**: create a student account attached to a class via its code.
- **CSRF**: required.
- **Note**: the username is generated server-side as `first.last1`, then `first.last2`, etc. until a free
  login is found. Students have **no email** and are **not** subject to email verification. For bulk creation
  by a teacher, prefer `POST /api/classes/{id}/students/import` (see [`api/classes.md`](./classes.md)).

### Request

```json
{
  "firstName": "Sam",
  "lastName": "Student",
  "password": "s3cret-pass",
  "classCode": "CLS-6A01"
}
```

### Response `201`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 6,
      "firstName": "Sam",
      "lastName": "Student",
      "username": "sam.student1",
      "email": null,
      "role": "student",
      "classId": 1,
      "className": "Class 6A",
      "createdAt": "2026-05-26T14:00:00Z"
    }
  },
  "error": null
}
```

### Errors

- `404 NOT_FOUND` — unknown `classCode`.
- `422 VALIDATION_ERROR` — missing or invalid field.

---

## `GET /api/users/{id}`

- **Access**:
  - `admin` can read any user,
  - `teacher` can read own profile and students in owned classes,
  - `student` and `free_user` can read only their own profile.
- **Purpose**: return one user profile.

### Response `200`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 6,
      "firstName": "Sam",
      "lastName": "Student",
      "username": "sam.student1",
      "email": null,
      "role": "student",
      "classId": 1,
      "createdAt": "2026-05-26T14:00:00Z"
    }
  },
  "error": null
}
```

### Errors

- `401 AUTH_REQUIRED` — no active session.
- `403 ACCESS_DENIED` — out of the caller's read scope.
- `404 NOT_FOUND` — unknown user id.
