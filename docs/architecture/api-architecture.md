# API Architecture — Winlerr

- **Status:** Current Plan
- **Principle:** Prefer the simplest architecture that supports current requirements (modular monolith — ADR 0002)
- **Related:** `docs/architecture/database-architecture.md`, `docs/architecture/security.md`, `packages/database`, `packages/auth`

## 1. Decision

**No dedicated `services/api` deployable yet.** The `services/api` directory exists as a logical boundary but is not a separate service at foundation stage.

Preferred stack for initial stage:

```
Frontend (Next.js App Router, Server Components)
  ↓
Server/API layer: Next.js Route Handlers + Server Actions (colocated with app)
  ↓
Business logic: @winlerr/* packages (auth, database, automation, integrations)
  ↓
Persistence: Supabase (Postgres + RLS) / External services via @winlerr/integrations
```

Route Handlers (`apps/*/src/app/api/*/route.ts`) handle HTTP, validate, authorize, then delegate to shared packages. No business logic duplicated across apps.

Introduce a dedicated API service only when:
- Cross-app calls need stable versioned HTTP contract independent of any app’s deploy, or
- A consumer outside Next.js (mobile, third-party) needs it first-class.

Currently neither driver exists. Therefore keep API colocated to reduce ops.

## 2. Layering

```
Request → Route Handler (or Server Action)
            ├─ Zod validation (request body/query/headers)
            ├─ requireUser / requireMembership / requirePermission (@winlerr/auth)
            ├─ call business function from @winlerr/* package
            │     └─ typed query via @winlerr/database (scoped by organization_id)
            └─ response { data } or { error: { code, message } }
```

- **Validation**: Zod (or Valibot) for every external input — body, query, params, webhook payloads. No `any` at the edge.
- **Error format**: shared `{ error: { code, message } }` with HTTP status (400 validation, 401 auth, 403 forbidden, 404 not found, 409 conflict, 429 rate-limit, 5xx server). No stack traces in production.
- **Rate limiting**: per-route (Upstash/Cloudflare or in-memory for dev) — applied at Route Handler; webhook handlers idempotent and rate-limited.

## 3. What the Repo Has Today

- `services/api|workers|webhooks|agents` exist as placeholders (`src/index.ts` handlerPlaceholder) — correctly not deployed.
- `@winlerr/database` and `@winlerr/auth` placeholders ready to host logic; no real Route Handlers yet — correct (do not build products now).

## 4. Webhooks & Background Work

- **Webhooks** (WhatsApp, Stripe, etc.) → `services/webhooks` logic but deployed initially as Route Handler under `apps/web/api/webhooks/*` or Supabase Edge Function. Must: verify signature, validate Zod, idempotency key, return 2xx fast and queue work.
- **Workers** (cron, queues, ingestion) → initially Vercel Cron or Supabase pg_cron/pgmq; only extract to `services/workers` when long-running or isolated scaling required.

## 5. What is NOT needed yet

- Dedicated tRPC/oRPC server: tempting but adds contract overhead before cross-app reuse is validated. Prefer Route Handlers until at least two consumers need the same endpoint.
- GraphQL gateway: premature.
- API versioning `/v2`: prepare path (prefix stable, evolve compatibly) but do not version before first consumer.

## 6. Next Step

When first product ships (e.g., lead ingestion), create `apps/<product>/src/app/api/.../route.ts` that uses `@winlerr/auth` + `@winlerr/database`; keep business function in `packages/automation` so other apps can reuse without HTTP.
