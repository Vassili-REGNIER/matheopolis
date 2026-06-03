# API — System

Cross-cutting conventions (envelope, auth, error codes, status codes) are defined in
[`docs/api.md`](../api.md).

## `GET /api/health`

- **Access**: public.
- **Purpose**: liveness/health probe for monitoring and container health checks.
- **Request body**: none.

### Response `200`

```json
{
  "success": true,
  "data": {
    "service": "matheopolis-backend",
    "status": "ok",
    "time": "2026-05-26T14:00:00Z"
  },
  "error": null
}
```
