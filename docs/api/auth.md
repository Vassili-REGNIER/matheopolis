# API — Authentication and current user

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Authentication is session based. A successful login sets the `PHPSESSID` cookie; the browser then sends it
automatically on subsequent same-domain requests. Login and `GET /api/auth/me` also return a session-bound
`csrfToken` that the client must echo in the `X-CSRF-Token` header on authenticated mutating requests
(see [CSRF protection](../api.md#14-csrf-protection)).

---

## `POST /api/auth/login`

- **Access**: public.
- **Purpose**: open an authenticated session using an email or a username.
- **Behavior**: on success, the session ID is regenerated, the session cookie is set, and a fresh CSRF token
  is issued in the response.
- **CSRF**: not required (pre-authentication endpoint).

### Request

```json
{
  "identifier": "teacher1@ac-lyon.fr",
  "password": "s3cret-pass"
}
```

- `identifier` string — email or username.
- `password` string.

### Response `200`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "firstName": "Theo",
      "lastName": "Teacher",
      "username": "teacher1",
      "email": "teacher1@ac-lyon.fr",
      "role": "teacher",
      "classId": null,
      "createdAt": "2026-05-20T09:30:00Z"
    },
    "csrfToken": "b3f1c2a9d4e57086f1a2b3c4d5e6f7a8"
  },
  "error": null
}
```

`csrfToken` must be stored by the client and sent in the `X-CSRF-Token` header on authenticated mutating
requests.

### Errors

- `401 INVALID_CREDENTIALS` — unknown identifier or wrong password.
- `422 VALIDATION_ERROR` — missing `identifier` or `password`.

---

## `POST /api/auth/logout`

- **Access**: authenticated.
- **Purpose**: invalidate the current session.
- **CSRF**: required.
- **Request body**: none.

### Response `204`

No content. The session is destroyed and the cookie invalidated.

### Errors

- `401 AUTH_REQUIRED` — no active session.

---

## `GET /api/auth/me`

- **Access**: authenticated.
- **Purpose**: return the current authenticated user profile.

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
      "createdAt": "2026-05-21T10:00:00Z"
    },
    "csrfToken": "b3f1c2a9d4e57086f1a2b3c4d5e6f7a8"
  },
  "error": null
}
```

The `csrfToken` lets a freshly loaded SPA recover the token for an existing session without re-authenticating.

### Errors

- `401 AUTH_REQUIRED` — no active session.
