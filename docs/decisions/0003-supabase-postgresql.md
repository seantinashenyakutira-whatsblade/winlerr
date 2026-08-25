# ADR 0003 — Supabase / PostgreSQL as Platform

- **Status:** Established Decision
- **Date:** 2026-08-21
- **Related:** `infrastructure/supabase/`, `docs/architecture/database-architecture.md`, `docs/architecture/security.md`

## Context

Winlerr needs OLTP storage, auth, realtime, file storage, and RLS for tenant isolation without operating a database. Team already has `infrastructure/supabase/` scaffolding and `.env.example` supabase keys. Alternative is self-hosted Postgres, Firebase, PlanetScale, etc. Choice must support multi-tenancy, migrations, and local dev.

## Decision

**Supabase (managed PostgreSQL + Auth + Storage + Realtime)** is the platform, at least until a capability gap forces reconsideration.

- **PostgreSQL** as OLTP. Includes row-level security, pg_cron, pgmq/queues, and extensions.
- **Supabase Auth** for authentication (see ADR 0004).
- **Migrations** are the sole schema change mechanism: `infrastructure/supabase/migrations/<timestamp>_<name>.sql`, committed, reviewed, reversible. Never mutate prod via dashboard.
- **Local**: Supabase CLI + `infrastructure/supabase/config.toml` + `DATABASE_URL`. Staging/production are cloud Supabase projects (one per environment).
- **Types**: generated or typed via `@winlerr/database`; no raw SQL scattering without helpers.

## Consequences

- RLS becomes the core tenant-isolation boundary (not just app code). Enables `auth.uid()` + `org_id` policies.
- Team gets auth, storage, realtime without extra services.
- Vendor commitment: Supabase Cloud is the run-time; local is for dev/test. Mitigated: standard PostgreSQL — dump/restore remains possible.

## Alternatives Considered

- **Firebase/Firestore**: rejected — no RLS at Postgres strength, weaker relational model for CRM/booking.
- **PlanetScale**: rejected — vitess/MySQL, no RLS, auth would be separate.
- **Self-hosted Postgres on Vercel/infra**: rejected — ops overhead too early.

## Follow-ups

- ADR 0004 covers auth model; `database-architecture.md` covers tenancy, roles, RLS conventions.
- Pin Supabase CLI version and add `pnpm supabase:generate` when first table lands.
