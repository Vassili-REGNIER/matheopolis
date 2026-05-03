# Matheopolis

Web app for **middle and high school students** to practice maths in a game-like way. Built as a **university project** (BUT informatique).

## Technical baseline

- Runtime: **PHP 8.3** (no framework).
- Architecture: Domain / Application / Adapters / Infrastructure.
- Security: CSRF, secure sessions/cookies, role checks in use cases, prepared SQL statements.
- Testing: PHPUnit with unit/application/integration/functional suites.
- CI/CD: GitHub Actions with quality gates and Alwaysdata deployment workflow.

## Database scripts

- `database/schema.sql`
- `database/seed.sql`
- `database/migrations/`

## Local quality commands

- `composer lint`
- `composer cs:check`
- `composer stan`
- `composer test`
- `composer test:coverage`
- `composer quality`
