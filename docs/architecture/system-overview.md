# Winlerr — System Overview

> Last updated: 2026-08-21 — Initial engineering foundation

## 1. Purpose

Winlerr is a reusable business automation platform spanning CRM, client management, booking, lead-response, and AI-driven communications (including WhatsApp agents). The platform is built as a monorepo to maximise code reuse and consistency across products.

## 2. Repository Structure

```
winlerr/
├── apps/           # Product applications (Next.js / React)
├── packages/       # Shared libraries (@winlerr/*)
├── services/       # Backend services (API, workers, webhooks, agents)
├── infrastructure/ # Supabase / Vercel / Cloudflare / environments
├── docs/           # Architecture, ADRs, development, product, integration docs
├── scripts/        # Operational scripts
└── .github/        # CI workflows, PR template
```

## 3. Application Boundaries

| App | Path | Purpose | Status |
|-----|------|---------|--------|
| web | `apps/web` | Public marketing site | placeholder |
| dashboard | `apps/dashboard` | Internal ops dashboard | placeholder |
| client-portal | `apps/client-portal` | Client-facing portal | placeholder |
| lead-response | `apps/lead-response` | Lead ingestion & automated response | placeholder |
| booking | `apps/booking` | Booking & scheduling | placeholder |
| crm | `apps/crm` | CRM — contacts, pipelines, activities | placeholder |
| whatsapp-agent | `apps/whatsapp-agent` | WhatsApp AI agent UI | placeholder |

Each app is a separate deployable unit (expected: Next.js on Vercel). Apps must consume shared logic via `packages/*`, not by duplication.

## 4. Package Boundaries

| Package | Import | Responsibility |
|---------|--------|----------------|
| `@winlerr/ui` | `packages/ui` | Shared React/UI components, design system |
| `@winlerr/auth` | `packages/auth` | Auth helpers (Supabase auth wrappers, session, RBAC primitives) |
| `@winlerr/database` | `packages/database` | Supabase clients (browser/server/admin), typed query helpers, RLS conventions |
| `@winlerr/ai` | `packages/ai` | LLM abstraction — provider routing (OpenAI/Anthropic), tool schemas, agent primitives, MCP |
| `@winlerr/integrations` | `packages/integrations` | External APIs (WhatsApp Business, etc.) |
| `@winlerr/automation` | `packages/automation` | Workflow / automation engine primitives |
| `@winlerr/notifications` | `packages/notifications` | Multi-channel notifications (email, WhatsApp, in-app) |
| `@winlerr/config` | `packages/config` | Shared build config (eslint, tsconfig presets) |

Packages are versioned internally; breaking changes require major bump + ADR.

### Dependency Direction

```
apps/* ──► packages/*
services/* ──► packages/*
packages/* ──► packages/config, packages/database, packages/ai (acyclic; no circular deps)
```

No package may import from `apps/*` or `services/*`.

## 5. Services

| Service | Path | Responsibility |
|---------|------|----------------|
| api | `services/api` | Primary HTTP API (REST / tRPC) — validates inputs, enforces authZ, talks to Supabase |
| workers | `services/workers` | Background jobs (queues, cron, ingestion pipelines) |
| webhooks | `services/webhooks` | Inbound webhook ingestion & verification (WhatsApp, Stripe, etc.) — signature checks, idempotency |
| agents | `services/agents` | AI agent runtimes — tool execution, orchestration, audit logging |

Services are separate deployment units (Vercel functions / Cloudflare Workers / Supabase Edge Functions — decided per ADR). All services enforce server-side authN/authZ and tenant isolation.

## 6. Database Platform

- **Supabase** (PostgreSQL + Auth + Storage + Realtime).
- Migrations live in `infrastructure/supabase/migrations/` as SQL files (`<timestamp>_<name>.sql`).
- **RLS** enforced per table for tenant isolation; application queries scoped by `org_id` / `tenant_id`.
- No direct production mutation without a migration. Data migrations are reviewed and reversible.
- Decisions on tenancy model, partitioning, or RLS strategy are recorded as ADRs in `docs/decisions/`.

## 7. Deployment Direction

| Layer | Platform | Config Location |
|-------|----------|----------------|
| Web & apps | **Vercel** (per-app project) | `infrastructure/vercel/` |
| Edge / DNS / cache | **Cloudflare** | `infrastructure/cloudflare/` |
| DB / Auth / Storage | **Supabase** | `infrastructure/supabase/` |
| Environment config | Staging vs Production | `infrastructure/environments/` |

- `main` → production, `develop` → staging. CI builds on every PR; deployment is explicit per environment (no auto-prod on bootstrap).
- Secrets managed in Vercel / Supabase / Cloudflare dashboards (never in Git).

## 8. AI Architecture Direction

- Business logic never hard-wires to a single LLM vendor. All calls go through `packages/ai`.
- `packages/ai` provides:
  - Unified chat/completion interface
  - Provider registry (OpenAI, Anthropic, future providers)
  - Strict tool schemas (Zod) and bounded side effects
  - Prompt/config separation (prompts live in `packages/ai` or `packages/config`, not domain code)
  - Agent permission scoping and audit logging of tool calls
  - MCP compatibility layer
- AI-initiated writes to DB, external APIs, or customer comms require human approval or explicit tightly-scoped policy.
- Model selection & routing is configuration, not code branching.

## 9. Environment Strategy

- `.env.example` documents all required variables; `.env` is gitignored.
- `NEXT_PUBLIC_*` vars are client-exposed; `SUPABASE_SERVICE_ROLE_KEY` and provider API keys are server-only.
- `infrastructure/environments/` stores non-secret environment-specific config (e.g., feature flags, region, log level).
- Production secrets injected via hosting provider dashboards / secret manager.

## 10. Non-Goals at Foundation Stage

- Real product feature implementation (CRM, booking, etc.) — placeholders only.
- Production Cloudflare / Vercel / Supabase resource provisioning.
- Full app scaffolding beyond directory + package manifests.

## 11. See Also

- `docs/decisions/0001-monorepo.md` — monorepo ADR (Established Decision)
- `AGENTS.md` — engineering rules for humans & agents
- `.env.example` — required environment variables
