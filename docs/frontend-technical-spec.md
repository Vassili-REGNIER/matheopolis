# Frontend Technical Specification

## 1. Technology and architecture choices

- Single Page Application (SPA)
- Vanilla TypeScript only (no UI framework)
- Object-oriented component model
- Clean separation between:
  - models (typing/contracts),
  - services (business/API orchestration),
  - components (rendering and interactions)
- Clean hierarchy between master views (router-owned) and nested views (parent-owned)

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
- Component styling is injected per component (scoped behavior), not via one global monolithic stylesheet.
- Complex components must expose/use `destroy()` when they allocate listeners/resources.

## 3. Application shell and orchestration

- `App` is the unique startup orchestrator.
- `HeaderComponent` and `FooterComponent` are persistent shell components.
- The router controls only the central master content area.
- `setupRoutes()` declares top-level navigation boundaries.

## 4. Routing model

- Hash routing (`#/route`) for in-browser SPA navigation.
- Router listens to `hashchange`.
- Router clears current mounted view before creating the next one.
- Router mounts only master views (login, game-home, panel root, game container).

This avoids full-page reload and server-side route complexity for frontend pages.

## 5. Nested view delegation

Parent containers own their local sub-navigation and sub-view lifecycle:

- `MatheoPanelComponent` mounts its own `NavigationComponent` and internal views.
- Game engine containers mount/unmount step blocks internally.
- Root router is intentionally unaware of these local transitions.

## 6. Data flow and API communication

### API client layer (`ApiClient`)

- Only authorized place for HTTP requests.
- Handles PHP session-cookie credentials and CSRF token propagation.
- Centralizes base URL, HTTP verbs, and global auth/network behavior.
- JWT bearer-token authentication is not part of the current frontend contract.

### Service layer

- Encapsulates business actions.
- Calls API client.
- Unwraps API response envelopes before returning data.
- Must return typed DTOs/contracts (no `any`).

### Component layer

- Requests domain data via services in `init()`.
- Updates DOM based on typed data outcomes.

## 7. Service boundaries by domain

- Core:
  - `AuthService`
  - `UserService`
  - `RiddleService`
- Teacher domain (`services/teacher/`):
  - class management and class progression operations
  - quiz lifecycle and assignment flow
- Admin domain (`services/admin/`):
  - global management operations
  - quiz validation/moderation flow

## 8. Security and role-aware frontend behavior

- Route guards validate identity/role before sensitive views.
- App shell navigation is dynamically filtered by role.
- Frontend hiding improves UX but backend authorization remains authoritative.
- Authentication relies on backend session cookie + CSRF, not JWT bearer tokens.

## 9. Typing requirements

- Keep models synchronized with API/OpenAPI contracts.
- Use dedicated DTO interfaces for requests/responses.
- Avoid `any` in service and model layers.

## 10. Game engine integration contract

Game engine modules are autonomous and follow open/closed extension:

- `GameContainerComponent` orchestrates scenario execution and block lifecycle.
- `SequenceManager` advances through `GameStep[]`.
- New games are introduced through registries, not by branching logic in orchestrators.
- Mini-games must implement `BaseGame` contract methods:
  - `start()`
  - `showHint()`
  - `destroy()` (mandatory memory/event cleanup)

## 11. App shell pattern

- `MatheoPanel` acts as persistent shell.
- Only central content view changes during navigation.
- Navigation and global actions remain stable across section transitions.

## 12. Mandatory implementation rules

1. No frontend framework usage.
2. No network call outside `ApiClient`.
3. No new game-type handling via `if/else` inside game orchestrators.
4. All visual components extend `BaseComponent`.
5. All mini-games extend `BaseGame`.
6. Always clean listeners/resources on teardown in complex components and games.
