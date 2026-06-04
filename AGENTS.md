# AGENTS.md — Matheopolis

Universal entrypoint for every AI assistant working in this repository
(Cursor, Claude Code, Codex, Copilot, and others).

## Source of truth

The canonical, tool-agnostic context lives in **`/.ai`**. Read it before generating or modifying code.
Do not create tool-specific rule folders; all shared rules live in `/.ai`.

### Context index (`/.ai`)

- `/.ai/README.md` — folder map and conflict policy.
- `/.ai/governance.md` — mandatory team rules (language, legacy, security baseline, doc sync).
- `/.ai/product-spec.md` — functional scope, roles, and feature model.
- `/.ai/workflow-quality.md` — testing, CI, and delivery expectations.
- `/.ai/architecture/backend.md` — backend (PHP) architecture and conventions.
- `/.ai/architecture/frontend/` — frontend architecture, split by concern:
  - `overview.md` — five pillars + consolidated AI code-generation constraints.
  - `core-routing.md` — `App`, `Router`, `BaseComponent`, route guards.
  - `ui-components.md` — UI views and `MatheoPanel` composition.
  - `services-api.md` — `ApiClient` and the service layer.
  - `game-engine.md` — game engine, blocks, registries, `BaseGame`, chapter/riddle progression.

Project documentation for humans lives in `/docs` (API, deployment, testing, architecture).

## Non-negotiables (summary; see `/.ai` for detail)

- Language: all code, comments, commits, and docs in English.
- Backend: PHP native, API-first, clean layering (Domain ← Application ← Adapter/Infrastructure).
- Frontend: Vanilla TypeScript SPA, no framework (no React/Vue/Angular); every UI element extends `BaseComponent`, every mini-game extends `BaseGame`.
- Network: only `ApiClient` performs HTTP; components/games call services, services call `ApiClient`.
- Auth: PHP session cookie + CSRF (no JWT bearer tokens).
- Security: server-side validation and authorization are authoritative; CSRF on mutating requests.
- No dead/legacy code after refactors; avoid `any` in typed layers.

## Priority and conflict policy

When requirements conflict, use this order:

1. Explicit latest team decisions (validated by project lead).
2. `/.ai` shared context.
3. `/docs` project documentation.

If a prompt contradicts documented rules, explicitly report the conflict and ask whether to update the
docs/rules first or proceed with an intentional exception. Never diverge silently.

## Documentation synchronization

Any significant architecture/scope/security/workflow change must update, in the same work:

1. implementation,
2. `/docs`,
3. `/.ai`.
