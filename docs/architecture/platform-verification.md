# Platform Foundation Verification & Supabase Readiness — Winlerr

- **Status:** Verification (Phase 5) — Established vs Current Plan explicitly labeled
- **Date:** 2026-08-24
- **Branch:** `feature/platform-verification` (from `develop` 275d221)
- **Audited branches:** `feature/platform-contracts` (a803b8b) and `feature/domain-persistence-foundation` (553007d)
- **Related:** `docs/architecture/platform-contracts.md`, `docs/architecture/database-architecture.md`, `packages/*`, `infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql`

## 1. Verified Platform Contracts

### @winlerr/config — Established (with minor doc inaccuracy)
- **Implements:** Zod validation, public (`NEXT_PUBLIC_*`) vs server-only split, `loadPublicConfig` safe on client, `loadServerConfig` throws on `window`, `PublicConfig`/`ServerConfig` typed, `redactConfig` redacts `KEY/SECRET/TOKEN/PASSWORD/DATABASE_URL`.
- **Tests:** `env.test.ts` (8) + `result.test.ts` (7) — PASS, no secrets.
- **Finding:** Docs in `platform-contracts.md` §3 claim `@winlerr/ai` and `@winlerr/integrations` depend on `@winlerr/config` for `Result` — implementation now uses **local `Result` duplication** to avoid `TS6059 rootDir` error (see §5). This is a **documentation inaccuracy** — not a security violation, but should be corrected to "Result is duplicated locally as workaround; recommend fixing tsconfig `rootDir` or moving Result to shared low-level package."

### @winlerr/database — Established (interface → real tables in Phase 4)
- **Phase 3:** Placeholder factories `createBrowserClient`/`createServerClient`/`createAdminClient` with `bypassRls` flag, no Supabase SDK — **Established**.
- **Phase 4 extension:** `types.ts` now defines `OrganizationRow`, `MembershipRow`, `AuditLogRow`, `Database` with `public.Tables` — aligned with migration — **Established**. `client.ts` adds `domainTables`/`conventions`/`AuditLogInsert` — **Established**.
- **Tests:** `client.test.ts` (6) + `domain.test.ts` (8) — PASS, migration file existence verified via `path.resolve(process.cwd(), "../../infrastructure/...")` workaround.
- **No violation:** Applications still placeholder, no bypass of package, `.env` not tracked.

### @winlerr/auth — Established
- **Implements:** `User`, `Organization`, `Membership`, `Role` (`owner|admin|member|viewer`), `Permission`, `Session` + pure guards `hasPermission`/`isMember`/`getMembership`/`hasRoleAtLeast`/`requireOrganizationId` — **Established**.
- **Tests:** `guards.test.ts` (6) — PASS.
- **Not implemented (correctly):** OAuth, role-management UI, Supabase users — **Current Plan** deferred, placeholder `ROLE_PERMISSIONS` is illustrative, not frozen — correctly labeled.

### @winlerr/ai — Established
- **Implements:** Provider-agnostic `AiRequest`/`AiResponse`/`ToolDefinition`/`ToolCall`/`TokenUsage`/`AiError`, `AiClient` with `validate` (pure) + placeholder `chat` throwing `not wired` — **Established**.
- **Tests:** `client.test.ts` (6) — PASS.
- **Finding:** Docs say depends on `@winlerr/config` for `Result` — actually local `Result` duplicated (see config finding). Same correction needed.
- **Not built (correct):** Agent orchestration, memory, MCP, vector DB, RAG — **Proposal** deferred, n8n remains R&D.

### @winlerr/integrations — Established
- **Implements:** `IntegrationProvider`, `IntegrationError`, `IntegrationAdapter`, `WebhookEvent`/`WebhookVerification`, example adapter `createExampleAdapter` (validateConfig, mock execute) — **Established**.
- **Tests:** `adapter.test.ts` (5) — PASS, no external calls.
- **Same doc inaccuracy:** Depends on `@winlerr/config` claim vs local `Result`.

### @winlerr/automation / @winlerr/notifications — Deferred — Proposal
- Both remain placeholders with comments explaining n8n as R&D and no validated channel — correctly **Deferred**, not empty scaffolding — **Proposal**.

### Dependency Direction — Established
- Documented: `apps/services → @winlerr/* → @winlerr/config` (lowest). Implementation respects it: `database` has no upward dep, `auth` pure, `config` lowest, `ai`/`integrations` now independent (local Result) but still not circular. No `apps → raw Supabase` bypass — apps are placeholders.
- **Finding:** Duplicated `Result` abstraction is a minor duplication to avoid TS `rootDir` error — recommend fixing `tsconfig.json` `rootDir` removal or centralizing Result in `@winlerr/config` and fixing `rootDir` to allow cross-package imports.

## 2. Verified Database Foundation

**Migration:** `infrastructure/supabase/migrations/20260824120000_domain_persistence_foundation.sql` — **Established**

- **organizations:** `id uuid pk gen_random_uuid()`, `name`, `slug unique`, `owner_user_id → auth.users`, `created_at`, `updated_at` + `handle_updated_at()` trigger + indexes `slug/owner/created_at` — **Established**
- **memberships:** `user_id → auth.users`, `organization_id → organizations`, `role check`, PK `(user_id, organization_id)`, indexes `user/org/role` — **Established**
- **audit_log:** `id uuid pk`, `organization_id → organizations`, `actor_user_id → auth.users`, `action`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at`, indexes `org/org_created/actor/action` — **Established**
- **UUIDs:** `gen_random_uuid()` via `pgcrypto` — **Established**
- **No product tables:** `leads`, `customers`, `bookings`, `conversations`, `messages`, `campaigns`, `products`, `payments`, `subscriptions` — correctly **NOT present** — **Proposal** deferred
- **Types:** `packages/database/src/types.ts` aligned with SQL — **Established**; `types.generated.ts` location documented for future `supabase gen types` — **Current Plan**

## 3. RLS Findings

All three tables have `enable row level security` — **Established**.

- **Unauthenticated access:** Policies use `auth.uid()` — anon (`null`) cannot read/insert tenant data — **PASS**.
- **Cross-tenant leakage:** `organizations` select where `id in (memberships where user_id=auth.uid())`; `memberships` select where own or member; `audit_log` where `organization_id in memberships` — **PASS**, no cross-org leakage.
- **Membership modification:** `memberships_insert_self` requires `user_id=auth.uid()` or `role in (owner,admin)` in that org — prevents arbitrary insertion — **PASS**, but **Current Plan** notes role-based refinement is blocked (needs HQ matrix).
- **Audit actor constraint:** `audit_log_insert_member` requires `actor_user_id is null or = auth.uid()` and `organization_id` in memberships — **PASS**.
- **Service-role bypass:** Remains server-only via `createAdminClient` (throws on `window`) and Supabase `service_role` bypass — **Established**, never exposed to client.
- **Role restrictions:** Correctly identified as **unresolved** — policies are membership-based only, not role-based — documented as blocker, not invented — **Current Plan/Proposal**.

## 4. Security Boundaries

- **Secrets never in client:** `loadServerConfig` throws on `window`, `NEXT_PUBLIC_*` only public, `SUPABASE_SERVICE_ROLE_KEY` server-only, `DATABASE_URL` redacted — **Established**.
- **Service-role server-only:** `createAdminClient` throws on `window`, `bypassRls` flag — **Established**.
- **Config does not leak:** `redactConfig` + Zod field errors avoid raw values — **Established**.
- **AuthN vs AuthZ separate:** `User/Session` vs `Membership/Role` + RLS, server re-check required — **Established**.
- **DB behind boundary:** `from()` via `@winlerr/database`, `organization_id` convention, migrations only — **Established**.
- **Credentials outside Git:** `.env` gitignored (`.gitignore:16`), `.env.example` placeholders only — **Established**.
- **AI tools bounded:** Zod schemas, `validate()`, no autonomous writes — **Established**.
- **Integrations no provider leak:** Adapters validate internally — **Established**.
- **Audit log no secrets:** `metadata jsonb` convention to redact, `redactConfig` pattern — **Established** (doc) + **Current Plan** (enforcement via code review).

No security enforcement is claimed beyond implementation — labels correct.

## 5. Supabase Readiness Assessment

**Ready for SDK integration (contract-only verification, no prod connection) — Current Plan**

Future integration boundary:

```
@winlerr/database
      ↓
@supabase/supabase-js
      ↓
PostgreSQL (Supabase)
```

**Required env vars (already in `@winlerr/config`):**
- Browser: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server: `SUPABASE_SERVICE_ROLE_KEY` (server-only), `DATABASE_URL` (optional direct)
- All optional at foundation stage — **Current Plan** to allow placeholder dev; will become required when first product ships

**Server/client boundaries:**
- Browser client: `createBrowserClient({ supabaseUrl, supabaseAnonKey })` — anon key, RLS enforced — **Established** (placeholder)
- Server client: `createServerClient` — anon key + cookies (Supabase Auth), throws on `window` — **Established** (placeholder)
- Admin client: `createAdminClient` — service-role, `bypassRls:true`, throws on `window` — **Established** (server-only)

**Generated types:**
- Location `packages/database/src/types.generated.ts` documented — **Current Plan**; manual `OrganizationRow` etc. currently **Established** and aligned with migration; will be replaced by `supabase gen types typescript --local` after first real DB

**Migration workflow:**
- File `20260824120000_domain_persistence_foundation.sql` committed — **Established**
- Workflow: `supabase db push` locally → test RLS with `auth.uid()` → PR review → `develop` → staging → production — **Current Plan** documented in `docs/architecture/database-architecture.md`

**Local development workflow:**
- `supabase` CLI + `infrastructure/supabase/config.toml` (api enabled:54321, placeholder) + `.env` + `pnpm install --frozen-lockfile` + `pnpm lint/typecheck/test/build` — **Current Plan** (CLI not pinned, but `config.toml` exists)
- Testing strategy: deterministic unit/contract tests without real Supabase (`client.test.ts`, `domain.test.ts`) — **Established**; integration tests requiring credentials explicitly not added — **Proposal** deferred

**What is NOT ready / not created:**
- No `@supabase/supabase-js` installed yet — **Current Plan** (install when first product needs DB)
- No production Supabase project, no OAuth credentials, no third-party secrets — **Proposal** deferred, never committed
- No deployment (Vercel/Supabase/Cloudflare) — **Proposal** deferred

**Verdict:** Contracts are hard enough to wire Supabase SDK behind `@winlerr/database` without architectural rework — **READY for SDK integration** once HQ approves role matrix and first product priority.

## 6. Unresolved HQ Decisions (Preserved)

All remain **not Established**:

1. OAuth providers — `docs/decisions/0004-authentication-model.md` Current Plan, `authentication.md` lists as open
2. Final role/permission matrix — Current Plan, `guards.ts` placeholder, RLS blocked
3. Multi-organization membership rules — Current Plan, proposed yes, not enforced beyond membership existence
4. Legacy master branch disposition — Proposal, `archive-legacy-main` preserved, `origin/master` still exists
5. First product priority — Proposal, no product choice

Also preserved:
- Automation beyond n8n = **Deferred** (Proposal)
- Notification channel = **Deferred** (Proposal)
- Product tables = **Deferred** (Current Plan)

No silent promotion from Proposal to Established.

## 7. Remaining Blockers

- RLS role-based refinement blocked on HQ role matrix — document, don't invent
- Supabase type generation blocked until real DB exists — manual types are Established but will be replaced
- `Result` duplication workaround — fix `tsconfig` `rootDir` or centralize `Result` — minor tech debt, not product blocker
- `turbo.json` test `outputs: coverage/**` warnings (no coverage files) — cosmetic, not failing
- CI `pnpm` version now fixed (was `ERR_PNPM_BAD_PM_VERSION` on PR #1/#3 before fix, now PASS on PR #2/#4) — **Established** fix

## 8. Classification Summary

- **Established:** Monorepo, pnpm/Turbo, Node 22/pnpm 10.22.0 toolchain (via PR #2), config env/result, database factories/types/migration, auth types/guards, AI/integrations interfaces, RLS enable, service-role server-only, .env gitignore, tests without credentials, platform-contracts doc
- **Current Plan:** organizations/memberships/audit_log tables + membership-based RLS, generated types location, Supabase wiring, migration workflow, local dev workflow
- **Proposal:** Automation, notifications, legacy master deletion, first product priority, role-based RLS, retention, vector DB/MCP
- **Experiment:** n8n lead response agent (separate R&D)
- **Assumption:** "multi-org = yes" — not validated, remains Proposal until HQ confirms

## 9. Product Development Readiness

**Can product development begin?** — **NO** — not until HQ approves at least role/permission matrix and first product priority, and platform contracts PRs (#3, #4) are merged to `develop`. Foundation is **ready to harden**, not yet ready to build CRM/booking.

**Is this branch READY FOR HQ REVIEW?** — **YES** — verification is complete, no product infra, no secrets, docs accurately labeled.
