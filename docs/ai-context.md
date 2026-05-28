# AI Context and Rule Management

## 1. Canonical location

The canonical assistant context for this repository is `/.ia`.

It is intentionally tool-agnostic so the same guidance can be used by:

- Cursor
- Copilot
- Claude Code
- Codex
- other team assistants

## 2. Relationship with `.cursor/.rules`

- `.cursor/.rules` remains as a compatibility layer for Cursor users.
- Rules in `.cursor/.rules` point to canonical documents in `/.ia`.
- New policy updates must be written in `/.ia` first.

## 3. Mandatory synchronization rule

Any meaningful change in architecture, scope, security, or workflow must update:

1. implementation,
2. `/docs`,
3. `/.ia`.

## 4. Contradiction handling

If a prompt conflicts with current documentation:

1. assistant must explicitly report the conflict,
2. ask whether to update docs/rules or implementation,
3. avoid silent divergence.
