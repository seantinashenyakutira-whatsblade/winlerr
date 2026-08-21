# AGENTS.md — Winlerr Engineering Rules

This document governs all contributors — humans and AI agents (including OpenCode) — working in this repository.

## 1. Repository Behavior

- **Inspect before modifying.** Read existing code, docs, and ADRs before changing anything. Discoverability first: search the monorepo, reuse before you invent.
- **Reuse existing code.** Prefer shared packages (`@winlerr/*`) over duplication. Do not duplicate authentication, database access, or UI components.
- **Avoid unnecessary dependencies.** Each new dependency is a liability. Justify it in the PR.
- **Do not rewrite working systems without reason.** If a system works and meets requirements, prefer incremental improvement over rewrites. Record the rationale for any rewrite in `docs/decisions/`.
- **Preserve backward compatibility where practical.** Stable interfaces (APIs, package exports, DB contracts) should change with deprecation or versioning, not silently.
- **Simple architecture over cleverness.** Optimize for readability, onboarding, and debuggability.
- **Document proposals, don't assume.** When uncertain about a major architectural decision, write it as a *Proposed* ADR under `docs/decisions/` and request review.

## 2. Security

- **Never hardcode secrets.** No API keys, tokens, passwords, or private keys in source, tests, or docs. Use environment variables and secret managers.
- **Never commit `.env`.** `.env` is gitignored. Commit only `.env.example` with empty placeholders. Verify `git status` never shows `.env` as tracked.
- **Never expose service-role credentials to clients.** `SUPABASE_SERVICE_ROLE_KEY` and equivalent privileged keys are server-only. Clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY` with RLS.
- **Validate external input.** All API inputs, webhook payloads, and user-supplied data must be validated (e.g., Zod) before use.
- **Enforce authorization server-side.** Do not rely on client-side checks. Every privileged operation must re-check authN/authZ on the server.
- **Treat webhook payloads as untrusted.** Verify signatures, validate schemas, and idempotently handle retries.
- **Maintain tenant isolation.** All multi-tenant data access must be scoped by tenant/org ID. No cross-tenant leakage via queries, caches, or logs.
- **Do not log secrets.** Redact tokens and PII in logs.
- **Report vulnerabilities privately.** Do not file public issues for security-sensitive findings.

## 3. Database

- **Schema changes require migrations.** Never manually mutate schema via dashboard/console without a committed migration in `infrastructure/supabase/migrations/`.
- **Never silently modify production data.** Data migrations must be reviewed, tested on staging, and documented. Prefer reversible migrations.
- **Document major schema decisions.** Create/append an ADR under `docs/decisions/` for significant modeling choices (e.g., tenancy, RLS strategy, partitioning).
- **Use Row Level Security (RLS) on Supabase.** Enforce tenant isolation at the DB layer where possible, not only in application code.

## 4. API

- **Validate inputs.** Use typed schemas (Zod / Valibot) for all request bodies, query params, and headers.
- **Establish consistent error handling.** Use a shared error format (e.g., `{ error: { code, message } }`) and appropriate HTTP status codes. Do not leak stack traces to clients in production.
- **Maintain stable interfaces.** Version breaking changes (`/v2/`) or use backward-compatible evolution. Document changes in PRs and changelogs.
- **Document important API changes.** Update `docs/architecture/` or `docs/integrations/` and note the change in the PR description.
- **Rate limit and authenticate.** Public endpoints must have auth and rate limiting.

## 5. AI

- **Tools require explicit schemas.** Every tool exposed to an LLM must have a strict input schema and bounded side effects.
- **Agents must have bounded permissions.** An agent may only perform actions within its declared scope. No ambient superpowers.
- **Use approved models/providers.** Route through `packages/ai` abstractions. Do not hard-wire business logic directly to `openai` / `anthropic` SDK calls scattered across apps.
- **Avoid uncontrolled production actions.** AI-initiated writes (DB, external APIs, customer communications) require explicit human approval or tightly scoped policy unless the operator has opted in.
- **Separate prompts/configuration from business logic where practical.** Prompts, model selection, and routing belong in config (`packages/ai` or `packages/config`), not inline in domain code.
- **Log and audit agent actions.** Record tool calls and outcomes for traceability.

## 6. Testing & Verification

Before declaring meaningful work complete, the author must:

- [ ] Run **type checking** — `pnpm typecheck`
- [ ] Run **linting** — `pnpm lint`
- [ ] Run **applicable tests** — `pnpm test` (or `--filter` for affected workspaces)
- [ ] Verify **affected functionality** manually or via automated checks

**Never claim successful verification unless it was actually performed.** Include command outputs in PRs when claiming verification.

## 7. Documentation

- **Material architectural decisions** must be documented under `docs/decisions/` as ADRs with status (`Proposed` | `Established Decision` | `Superseded`).
- **Architecture changes** must update `docs/architecture/system-overview.md`.
- **Product / integration changes** must update `docs/products/` or `docs/integrations/` respectively.
- **Development workflow changes** must update `docs/development/`.

## 8. Monorepo Conventions

- Packages are named `@winlerr/<name>` and live in `packages/<name>/`.
- Apps live in `apps/<name>/`.
- Services live in `services/<name>/`.
- Shared build tooling lives in `packages/config/`.
- Use `pnpm --filter <name>` to target workspaces; use `turbo run <task>` for cross-workspace tasks.

## 9. Environment & Secrets

- `.env.example` is the source of truth for required variables. Keep it in sync with code.
- `.env` is never committed. Verify via `git status` and `git check-ignore .env`.
- Production secrets are managed via Vercel / Supabase / Cloudflare dashboards or a secret manager — never in Git.

## 10. Branching & Commits

- Active development: `develop` (staging). Production: `main`.
- Branches: `feature/*`, `fix/*`, `experiment/*`.
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Use PR template at `.github/pull_request_template.md`.

---

*Adherence to this document is required. Violations should be flagged in code review.*
