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
- `backend-architecture.md`: backend architecture and implementation rules.
- `frontend-architecture.md`: frontend architecture and implementation rules.
- `workflow-quality.md`: testing, CI, documentation, and delivery expectations.

## Priority and conflict policy

When requirements conflict, use this priority order:

1. Explicit latest team decisions (meeting outcomes, validated by project lead).
2. This `/.ia` folder.
3. Project docs in `/docs`.
4. Legacy tool-specific rules (`.cursor/.rules`).

If a user prompt contradicts documented rules/specs, the assistant must explicitly call it out and ask whether to:

- update the docs/rules first, or
- proceed with an intentional exception.
