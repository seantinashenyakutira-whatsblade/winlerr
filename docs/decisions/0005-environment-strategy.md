# ADR 0005 — Environment Strategy

- **Status:** Established Decision
- **Date:** 2026-08-21
- **Related:** `infrastructure/environments/`, `.env.example`, `docs/architecture/security.md`

## Context

Winlerr needs isolated dev/staging/production without premature infra. Repo already has `infrastructure/environments/{staging.json,production.json}` and branch model `main→production, develop→staging, feature/*→local/preview`. Need to lock env boundaries before first deploy.

## Decision

```
feature/*      → local + Vercel Preview (ephemeral)
develop        → staging (Supabase staging project, Vercel preview/prod for staging)
main           → production (Supabase production project, Vercel production)
```

- **Variables**: `.env.example` is source of truth; `.env` is gitignored. `NEXT_PUBLIC_*` is client-exposed; `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `WHATSAPP_*`, `CLOUDFLARE_*` are server-only.
- **Secret management**: Production secrets live in Vercel / Supabase dashboards / Cloudflare or a secret manager — never in Git. Staging mirrors prod shape with distinct values.
- **Supabase**: one project per env (dev local via CLI + `config.toml`, staging cloud, production cloud). Migrations run via CI against staging first.
- **Vercel**: per-env projects configured in `infrastructure/vercel/` later; initially one project with env-specific vars suffices. `NEXT_PUBLIC_APP_URL` differs per env.
- **Cloudflare**: DNS/cache per env, but not configured until first subdomain ships.
- **No auto-prod deploy on bootstrap**: `develop` auto-deploys to staging is allowed; `main` → production requires explicit promotion (manual or protected workflow).
- **Environment files**: `infrastructure/environments/staging.json` (`{env:staging, branch:develop, logLevel:debug}`) and `production.json` (`{env:production, branch:main, logLevel:info}`) hold non-secret per-env config only.

## Consequences

- Single set of migration files works across envs; promotion is branch-based.
- Local dev uses `cp .env.example .env` + local Supabase; staging uses distinct cloud project.
- Changing env shape requires updating `.env.example` + docs, not just dashboards.

## Alternatives Considered

- **Per-developer cloud projects**: rejected — local Supabase covers isolation without cloud cost.
- **Env per product subdomain early**: rejected — no product has validated need for isolated env yet; consolidate on winlerr.vip initially.

## Follow-ups

- When first product ships to a subdomain (e.g., `dashboard.winlerr.vip`), add per-product env vars and document in `integrations.md`.
- Add `CODEOWNERS` for `infrastructure/environments/` when team grows.
