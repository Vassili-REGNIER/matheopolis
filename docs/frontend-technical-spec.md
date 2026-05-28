# Frontend Technical Specification

## 1. Technology and architecture choices

- Single Page Application (SPA)
- Vanilla TypeScript only (no UI framework)
- Object-oriented component model
- Clean separation between:
  - models (typing/contracts),
  - services (business/API orchestration),
  - components (rendering and interactions)

## 2. Component engine contract

All UI elements inherit from `BaseComponent`.

Mandatory lifecycle:

1. `constructor(container, id)`
2. `init()`
3. `render(htmlTemplate, cssStyle)`
4. `bindEvents()`

Rules:

- Components do not call `fetch()` directly.
- Components do not hardcode backend URLs.
- Components consume service-layer methods only.

## 3. Routing model

- Hash routing (`#/route`) for in-browser SPA navigation.
- Router listens to `hashchange`.
- Router clears current mounted view before creating the next one.

This avoids full-page reload and server-side route complexity for frontend pages.

## 4. Data flow and API communication

### API client layer

- Only authorized place for HTTP requests.
- Handles session credentials and CSRF token propagation.

### Service layer

- Encapsulates business actions.
- Calls API client.
- Unwraps API response envelopes before returning data.

### Component layer

- Requests domain data via services in `init()`.
- Updates DOM based on typed data outcomes.

## 5. Security and role-aware frontend behavior

- Route guards validate identity/role before sensitive views.
- App shell navigation is dynamically filtered by role.
- Frontend hiding improves UX but backend authorization remains authoritative.

## 6. Typing requirements

- Keep models synchronized with API/OpenAPI contracts.
- Use dedicated DTO interfaces for requests/responses.
- Avoid `any` in service and model layers.

## 7. App shell pattern

- `MatheoPanel` acts as persistent shell.
- Only central content view changes during navigation.
- Navigation and global actions remain stable across section transitions.
