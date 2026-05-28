# Frontend Architecture Guide

## Core approach

- Single Page Application in Vanilla TypeScript (OOP style).
- No UI framework (no React/Vue/Angular).
- Clean architecture separation between models, services, and components.

## Rendering engine contract

All UI components inherit from `BaseComponent`.

Lifecycle:

1. `constructor(container, id)`
2. `init()` (async data loading via services)
3. `render(htmlTemplate, cssStyle)` (DOM + scoped style injection)
4. `bindEvents()`

Component rules:

- Components must not call `fetch()` directly.
- Components must not hardcode backend URLs.
- Components must call service layer only.

## Routing model

- Hash-based routing (`#/...`) without full page reload.
- Router listens to `hashchange`.
- Router destroys previous view container before mounting next component.

## Data flow

- API client is the only layer allowed to execute HTTP requests.
- Service layer translates domain actions to API client calls.
- Services unwrap API envelopes and return typed domain data to components.

## Security and role behavior

- Session cookie auth from backend.
- Route guards check access via `AuthService.getMe()`.
- Navigation is role-aware and renders only allowed entries.

## Typing rules

- Keep strict TypeScript interfaces aligned with backend/OpenAPI contracts.
- Avoid `any` in service and model layers.
