# API — Authentication and current user

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

Authentication is session based. A successful login sets the `PHPSESSID` cookie; the browser then sends it
automatically on subsequent same-domain requests. Login and `GET /api/auth/me` also return a session-bound
`csrfToken` that the client must echo in the `X-CSRF-Token` header on authenticated mutating requests
(see [CSRF protection](../api.md#14-csrf-protection)).

## Email verification and password-reset tokens

Accounts created **with an email** (`POST /api/users`, `POST /api/users/teachers`) receive a verification
email immediately. Login is blocked until the address is confirmed (`403 EMAIL_NOT_VERIFIED`). Student accounts
created via class import or `POST /api/users/students` have no email and are **not** subject to verification.

### Token format and storage

| Property | Value |
| --- | --- |
| Plaintext token | 64 hexadecimal characters (`bin2hex(random_bytes(32))`). |
| Database storage | SHA-256 hash in `auth_tokens.token_hash` (plaintext never stored). |
| Single use | Token row deleted after successful verification or password reset. |
| Re-issue | Issuing a new token of the same type invalidates the previous one for that user. |

### Token lifetimes

| Type | TTL | Frontend path | API consumption |
| --- | --- | --- | --- |
| `email_verification` | **48 hours** | `/verify-email?token={token}` | `POST /api/auth/verify-email` |
| `password_reset` | **2 hours** | `/reset-password?token={token}` | `POST /api/auth/reset-password` |

Email links are built as `{APP_FRONTEND_ORIGIN}{path}?token={token}` (token URL-encoded). The SPA should
read the query parameter and call the matching API endpoint.

### Outbound mail

- When `MAIL_SMTP_HOST` is empty, `LogMailer` writes subject and body to `logs/app.log` (no real delivery).
- When `MAIL_SMTP_HOST` is set, `SmtpMailer` sends over SMTP (`MAIL_SMTP_PORT`, optional `MAIL_SMTP_USER` /
  `MAIL_SMTP_PASS`, `MAIL_SMTP_ENCRYPTION` = `none`, `tls`, or `ssl`).
- Dev Docker stack includes **Mailpit** (SMTP `localhost:1025`, UI `http://localhost:8025`); see `.env.example`
  (`DEV_MAIL_SMTP_*`).
- Production (AlwaysData): configure `PROD_MAIL_SMTP_*` in `.env` (typically port `465` + `ssl` or `587` + `tls`).

### Password rules (reset and registration)

- Minimum length: **8 characters** (user-chosen passwords on registration / reset).
- Server-generated student passwords: **12 characters** (see [`api/classes.md`](./classes.md#csv-conventions-import-export-passwords)).

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
      "className": null,
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
- `403 EMAIL_NOT_VERIFIED` — account has an email address that is not verified yet.
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
      "className": "Class 6A",
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

---

## `POST /api/auth/forgot-password`

- **Access**: public.
- **Purpose**: request a password-reset link for an account that has an email address.
- **CSRF**: not required.
- **Behavior**: always returns success when the payload is valid, even if the email is unknown (no account
  enumeration). When a matching account exists, a one-time token is emailed (TTL **2 hours**; previous reset
  token for that user is invalidated).

### Request

```json
{
  "email": "teacher1@ac-lyon.fr"
}
```

### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent."
  },
  "error": null
}
```

---

## `POST /api/auth/reset-password`

- **Access**: public (token from email link).
- **Purpose**: set a new password using a one-time reset token.
- **CSRF**: not required.

### Request

```json
{
  "token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
  "password": "new-secret-pass"
}
```

- `token`: 64-character hexadecimal string from the reset email link.
- `password`: minimum 8 characters.

### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "Password has been reset."
  },
  "error": null
}
```

### Errors

- `422 INVALID_TOKEN` — unknown or expired token.
- `422 VALIDATION_ERROR` — password shorter than 8 characters.

---

## `POST /api/auth/verify-email`

- **Access**: public (token from verification email).
- **Purpose**: confirm an email address after registration.
- **CSRF**: not required.

### Request

```json
{
  "token": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
}
```

- `token`: 64-character hexadecimal string from the verification email link (valid **48 hours**).

### Response `200`

```json
{
  "success": true,
  "data": {
    "message": "Email address verified."
  },
  "error": null
}
```

Sets `users.email_verified_at` to the current timestamp. The user can then log in.

### Errors

- `422 INVALID_TOKEN` — unknown, expired (> 48 h), or already consumed token.
