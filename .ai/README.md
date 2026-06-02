# Matheopolis Shared AI Context

This folder is the **tool-agnostic source of truth** for AI assistants used by the team
(Cursor, Copilot, Claude Code, Codex, and others).

## Why this folder exists

- Keep a single, shared context across all AI tools.
- Avoid duplicated or contradictory rules.
- Keep architecture, product scope, and coding constraints synchronized with the real project.

## Documents

- `governance.md`: mandatory team rules for AI-assisted work.
- `product-spec.md`: functional scope, decisions, and feature model.
- `workflow-quality.md`: testing, CI, documentation, and delivery expectations.
- `architecture/backend.md`: backend architecture and implementation rules.
- `architecture/frontend/`: frontend architecture reference, split by concern:
  - `overview.md`: bird's-eye view and the five pillars.
  - `core-routing.md`: `App`, `Router`, and `BaseComponent` foundations.
  - `ui-components.md`: UI views and `MatheoPanel` dashboard composition.
  - `services-api.md`: `ApiClient` and the service layer.
  - `game-engine.md`: game engine, blocks, registries, and `BaseGame`.

  The mandatory AI code-generation constraints live in `overview.md` (consolidated golden rules).

## Priority and conflict policy

When requirements conflict, use this priority order:

1. Explicit latest team decisions (meeting outcomes, validated by project lead).
2. This `/.ai` folder.
3. Project docs in `/docs`.

The root `AGENTS.md` is the universal entrypoint that points every agent here; it does not hold separate rules.

If a user prompt contradicts documented rules/specs, the assistant must explicitly call it out and ask whether to:

- update the docs/rules first, or
- proceed with an intentional exception.
