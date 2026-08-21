# Architectural Decision Records (ADRs) — Winlerr

ADRs capture significant architectural choices with context, options, decision, and consequences.

## Format

- File: `docs/decisions/NNNN-title.md` (zero-padded, kebab-case)
- Statuses: `Proposed` | `Established Decision` | `Superseded`
- Include: Context, Options considered, Decision, Consequences, Alternatives rejected, References.
- Unsure about a major decision? Create it as `Proposed` and request review — don't silently treat it as established.

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| 0001 | [Monorepo](0001-monorepo.md) | Established Decision | 2026-08-21 |

## Adding a Decision

1. Copy an existing ADR as a template.
2. Use the next sequential number.
3. Open a PR; tag reviewers.
4. Once approved, set status to `Established Decision` (or `Superseded` if replacing an earlier one) and update this index.
