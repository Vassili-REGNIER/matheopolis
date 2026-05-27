# Testing strategy

## Backend tests

Run from `backend/`:

- `composer test`
- `composer stan`
- `composer cs:check`

## Frontend tests with backend mock

1. Start a static server in `frontend/` (or open `index.html` through your local server).
2. Open `index.html?mock=1`.
3. The frontend will use files in `frontend/mocks/` instead of real API calls.

This lets you validate UI behavior even when backend is unavailable.

## Backend tests with frontend mock

The backend is API-first and does not require the frontend server to execute business logic.
To mimic frontend consumers:

1. Use HTTP requests against backend endpoints (`/api/...`).
2. Reuse fixture payloads from `frontend/mocks/` as client-side contract samples.
3. Validate that backend envelopes stay compatible with mocked frontend expectations.
