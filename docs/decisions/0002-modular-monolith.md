# ADR 0002 — Modular Monolith (Not Premature Microservices)

- **Status:** Established Decision
- **Date:** 2026-08-21
- **Decides:** §6 of architecture audit, §4 target model
- **Related:** ADR 0001 (monorepo), `docs/architecture/system-overview.md`, `docs/architecture/repository-audit.md`

## Context

Winlerr will ship 7+ product surfaces (web, dashboard, client-portal, lead-response, booking, crm, whatsapp-agent) on a small early team. The monorepo (ADR 0001) already gives shared packages. The question is deployment topology: should each of `services/api|workers|webhooks|agents` and each app be an independently deployed microservice from day one?

Microservices would require per-service CI, per-service env, distributed auth/tenant isolation, inter-service contracts, and ops overhead that at Winlerr’s stage (no production users on new foundation) adds cost without validated scaling benefit.

## Decision

Winlerr will be a **modular monolith** initially:

```
Next.js applications (App Router, Route Handlers, Server Actions)
+ shared packages (@winlerr/*)
+ Supabase (PostgreSQL + Auth + Storage + Realtime)
+ colocated server logic (Route Handlers / Server Actions / Supabase Edge Functions)
+ background workers only where actually necessary (queue/cron)
```

- `apps/*` are logical boundaries, not necessarily 7 separate Vercel projects on day one. Start with `apps/web` (or first product) on a single Vercel project; add per-app projects when a product validates need for isolated deploy/scale/domain.
- `services/*` is a **logical namespace**, not a deployment commitment. Do not create 4 independent deployables now. Prefer:
  - Supabase Edge Functions for webhooks
  - Next.js Route Handlers for API
  - Vercel Cron / Supabase Queues for workers
  - `services/agents` logic as library in `packages/ai` until agent runtime needs isolation
- Shared invariants (`@winlerr/auth`, `@winlerr/database`, `@winlerr/ai`, `@winlerr/ui`) stay in packages and are imported, not duplicated. Dependency direction: `apps/services → packages → packages/config|database|ai`, never circular.

## Consequences

- Single Vercel project + Supabase covers 90% of early needs; minimal ops.
- Business logic stays in packages, so extracting a service later is a move, not a rewrite (module boundaries are real, deploy boundaries are deferred).
- Team can ship product features without wiring Kafka/K8s/service mesh.
- Trade-off: early services share deploy; noisy-neighbor risk exists but acceptable at small scale. Mitigated via rate limiting, RLS, and per-package test isolation.

## Alternatives Considered

- **Microservices per service** (api/workers/webhooks/agents each separate): rejected — premature, 4× CI/env/secret surface, distributed auth complexity, no validated scale driver.
- **Full serverless per route**: rejected as conflation — serverless is deployment detail, not architecture; we’ll use serverless (Vercel Functions, Edge) within the monolith where it helps.

## Follow-ups

- Revisit when a service has independent scaling, security isolation, or deployment cadence that the monolith cannot provide. Trigger: >1 deploy/day isolation need, or regulatory isolation, or >10× traffic skew.
- ADR for extraction will reference this decision and explain why the boundary must become a deploy boundary.
