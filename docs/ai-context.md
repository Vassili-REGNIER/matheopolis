# AI Context and Rule Management

## 1. Canonical location

The canonical assistant context for this repository is `/.ai`.

It is intentionally tool-agnostic so the same guidance can be used by:

- Cursor
- Copilot
- Claude Code
- Codex
- other team assistants

## 2. Agent entrypoint

- The root `AGENTS.md` is the universal entrypoint auto-discovered by agents (Cursor, Claude Code, Codex, etc.).
- It contains no separate rules; it points to `/.ai` as the single source of truth.
- No tool-specific rule folders are used (no `.cursor/.rules`, etc.).
- New policy updates must be written in `/.ai` first.

## 3. Mandatory synchronization rule

Any meaningful change in architecture, scope, security, or workflow must update:

1. implementation,
2. `/docs`,
3. `/.ai`.

## 4. Contradiction handling

If a prompt conflicts with current documentation:

1. assistant must explicitly report the conflict,
2. ask whether to update docs/rules or implementation,
3. avoid silent divergence.

## 5. Current feature snapshot (questionnaires)

Use `/.ai/product-spec.md` and `docs/api/quizzes.md` as authoritative detail. Summary:

| Area | Status |
| --- | --- |
| GameHome | Three sections (chapters → private → public), title search, type filters, admin card menus, styled restart modal for completed quizzes |
| Quiz play | `QuizPlayComponent` on `/quiz/:id` and `/quiz/:id/results`; full API via `QuizService` |
| Teacher panel | `QuizManagementComponent` (CRUD, publication request/cancel), `StudentContentManagementComponent` (quiz/chapter class access via API) |
| Admin panel | `AdminPanelComponent` (publication queue, publish/dismiss, unpublish in detail) |
| Chapter class access (UI) | Same section layout as quizzes; restrictions persist through chapter target-class API |
