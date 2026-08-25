# Product Readiness Gate — Winlerr

- **Status:** Gate (Established / Current Plan / Proposal / Experiment / Assumption explicitly labeled)
- **Date:** 2026-08-24
- **Branch:** `feature/product-readiness-gate` (from `develop` 275d221)
- **Related:** `docs/architecture/platform-contracts.md`, `docs/architecture/platform-verification.md`, `docs/architecture/database-architecture.md`, `AGENTS.md`
- **PRs audited:** #1 `feature/architecture-audit` (9b9efcc), #2 `feature/developer-experience` (8600bbe), #3 `feature/platform-contracts` (a803b8b), #4 `feature/domain-persistence-foundation` (553007d), #5 `feature/platform-verification` (b7ef67a)

> This gate makes it impossible for a future agent to accidentally treat unresolved HQ decisions as Established architecture.

## 1. Platform Foundation Status

**Current develop (275d221) is minimal placeholder** — no platform contracts, no domain tables, only monorepo scaffolding, Turbo, Node 22/pnpm 10.22.0 toolchain fixed in PR #2.

**Feature branches provide the real foundation, but are stacked and not yet merged:**

| Branch | Base | Commit | Files | CI | Merge Order |
|--------|------|--------|-------|----|-------------|
| `feature/architecture-audit` → `develop` (#1) | develop 275d221 | 9b9efcc | 14 docs | **FAILURE** (pnpm version mismatch `version: 10` vs `packageManager: pnpm@10.22.0`) | **1st** — needs rebase onto toolchain fix |
| `feature/developer-experience` → `develop` (#2) | develop 275d221 | 8600bbe | 4 files (ci.yml, package.json, README, docs/development) | **SUCCESS** 1m33s | **2nd** — fixes toolchain, unblocks #1 |
| `feature/platform-contracts` → `develop` (#3) | develop 275d221 | a803b8b | 31 files (config/result, database, auth, ai, integrations, docs) | **SUCCESS** 1m33s (after fix) | **3rd** — rebased on #2, establishes contracts |
| `feature/domain-persistence-foundation` → `develop` (#4) | `feature/platform-contracts` a803b8b (stacked) | 553007d | 40 files (includes #3's 31 + 8 domain + 1 migration) | **SUCCESS** 1m49s | **4th** — stacked on #3, adds organizations/memberships/audit_log |
| `feature/platform-verification` → `develop` (#5) | develop 275d221 | b7ef67a | 5 files (verification doc + toolchain fix) | **SUCCESS** 1m24s (after fix) | **5th** — verification, can merge after #2 |

**Finding:** PR #4 duplicates PR #3's 31 files because it is stacked on #3 but targets `develop` — GitHub shows 40 files vs 31. This is **expected stacked PR behavior**, not unrelated changes. Must merge sequentially: #2 → rebase #1 → merge #1 → rebase #3 → merge #3 → rebase #4 → merge #4 → rebase #5 → merge #5.

**Finding:** PR #1's CI failure is pre-existing toolchain mismatch, not introduced by architecture docs — will be fixed by rebasing onto #2's `ci.yml` fix (remove `version: 10`).

## 2. Established Decisions

These are **Established** (implemented, verified, and not to be re-debated without ADR):

- **Monorepo:** `pnpm-workspace.yaml` (`apps/*`, `packages/*`, `services/*`) + `turbo.json` (tasks build/dev/lint/typecheck/test/clean) — Established
- **Modular monolith:** `apps/services → @winlerr/*` — no premature microservices, `services/` is logical namespace — Established (ADR 0002)
- **Supabase/PostgreSQL as platform:** `infrastructure/supabase/` + `packageManager` — Established (ADR 0003)
- **Toolchain:** Node 22 LTS (`.nvmrc` 22, `engines >=22`, `CI node-version 22`, `@types/node 22`), pnpm 10.22.0 (`packageManager`), Turbo 2.10.11, TypeScript 5.9.3, ESLint 9.39.5 — Established (via PR #2 fix)
- **Environment strategy:** `main → production`, `develop → staging`, `feature/*` short-lived, `develop` is base, `.env` gitignored, `.env.example` placeholders — Established (ADR 0005)
- **Config contract:** Zod validation, public (`NEXT_PUBLIC_*`) vs server-only split, `loadServerConfig` throws on `window`, `redactConfig` — Established (`@winlerr/config`)
- **Result/Error contract:** `Result<T,E>`, `AppError`, `ErrorCode` 8 variants, `toHttpStatus` — Established (`@winlerr/config`)
- **Database boundary:** `createBrowserClient`/`createServerClient`/`createAdminClient` (admin throws on client, `bypassRls` flag), `organization_id` convention, migrations in `infrastructure/supabase/migrations/` — Established (`@winlerr/database`)
- **Auth shape:** `User`, `Organization`, `Membership`, `Role`, `Permission`, `Session` types + pure guards (`hasPermission`, `isMember`, etc.) — Established (shape, not final values)
- **AI boundary:** Provider-agnostic `AiRequest`/`AiResponse`/`ToolDefinition`/`TokenUsage`/`AiError`, placeholder `AiClient` — Established
- **Integrations boundary:** `IntegrationAdapter`, `WebhookEvent`, example adapter mock — Established
- **Security conventions:** `.env` gitignored, service-role server-only, RLS enablement, audit metadata never secrets — Established as conventions

## 3. Current Plan

These are **Current Plan** (intended direction, supported by implementation, but not yet requiring HQ re-approval):

- **Database domain:** `organizations`, `memberships`, `audit_log` tables + indexes + `handle_updated_at()` trigger — Current Plan (migration 20260824120000) — will be Established after Supabase project wiring and `supabase gen types` replacement of manual `OrganizationRow` etc.
- **RLS minimal:** Membership-based policies only (see §8) — Current Plan until HQ approves role matrix
- **Auth role set:** `owner|admin|member|viewer` placeholder check + `ROLE_PERMISSIONS` illustrative map — Current Plan (not frozen)
- **Generated types location:** `packages/database/src/types.generated.ts` — Current Plan (manual types Established for now)
- **Migration workflow:** `supabase db push` locally → PR → develop → staging → prod — Current Plan
- **Local dev:** `supabase` CLI + `config.toml` + `pnpm install --frozen-lockfile` + `pnpm lint/typecheck/test/build` — Current Plan
- **AI wiring:** `chat()` placeholder throws `not wired` — Current Plan until first product needs LLM

## 4. Proposals

These are **Proposals** (suggested design, needs HQ/Product review before Established):

- **Automation:** `@winlerr/automation` remains placeholder — Proposal, n8n is R&D, will define `Workflow/Trigger/Action` when validated
- **Notifications:** `@winlerr/notifications` remains placeholder — Proposal, future via `@winlerr/integrations` adapters when channel validated
- **Legacy master branch:** `origin/master` (899c763) + `archive-legacy-main` (d311c3e) preserved — Proposal to keep indefinitely vs delete after HQ confirms no legacy consumers (`git push origin --delete master`)
- **Role-based RLS refinement:** Beyond membership existence — Proposal, blocked on HQ matrix
- **Product tables:** `leads`, `bookings`, `customers`, `conversations` etc. — Proposal deferred
- **Vector DB / RAG / MCP / agent orchestration** — Proposal deferred
- **First product priority** — Proposal (see §12)

## 5. Experiments

- **n8n Agent 01 R&D:** Lead Response Agent experimentation — Experiment, may be dropped, do not duplicate internally — `docs/architecture/platform-contracts.md` §10
- **Landing-page prototype:** `archive-legacy-main` at d311c3e — Experiment, preserved for reference

## 6. Assumptions

- **"multi-organization membership = yes"** (a user may belong to multiple orgs) — Assumption in `docs/decisions/0004-authentication-model.md` and `memberships` PK design — must not be treated as Established until HQ confirms
- **"owner > admin > member > viewer" hierarchy** — Assumption in `hasRoleAtLeast` — placeholder, not final
- **"organizations.slug unique"** — Assumption, may need HQ to confirm slug vs domain-based tenant naming

Do **not** silently convert Assumptions → Established.

## 7. Unresolved HQ Decisions — DO NOT INVENT VALUES

The following remain **unresolved** and are **explicitly preserved** as blockers:

| # | Decision | Where It Affects Architecture | Minimum Decision Required Before Implementation |
|---|----------|-------------------------------|-----------------------------------------------|
| A | **Final role/permission matrix** | `packages/auth` (`ROLE_PERMISSIONS`), `memberships.role` check, RLS write policies beyond membership, `hasPermission` map, PR #4 RLS blocked | HQ must approve at least `owner/admin/member/viewer` permissions per product (lead, booking, org:admin) before RLS can be tightened |
| B | **Multi-organization membership rules** | `memberships` PK `(user_id, organization_id)`, RLS `organization_id in (memberships where user_id=auth.uid())`, `Session.organizationId`, UI org switcher | HQ must confirm yes/no and behavior (can user be in 2 orgs simultaneously? org switcher? data isolation expectations?) |
| C | **OAuth providers** | `docs/decisions/0004-authentication-model.md` Open Questions, `@winlerr/auth` types (no OAuth code yet) | HQ must list required providers for launch (Google? Apple?) before wiring `supabase.auth.signInWithOAuth` |
| D | **Legacy master branch disposition** | `git branch -a` shows `origin/master` 899c763 and `archive-legacy-main` d311c3e | HQ must decide: keep indefinitely, archive, or `git push origin --delete master` |
| E | **First product priority** | Determines which product tables (leads vs bookings vs CRM) are created next, and which integration/AI capabilities are wired first | HQ must choose one of Lead Response / CRM / Booking / WhatsApp automation as P0 — see §12 PROPOSAL |

**Also preserved:**
- Automation beyond n8n = **Deferred** (Proposal)
- Notification channel = **Deferred** (Proposal)
- Product tables = **Deferred** (Current Plan)

No silent promotion allowed — each Proposal must be labeled as such until HQ review.

## 8. Technical Blockers

- **PR ancestry stacked duplicates:** PR #4 includes PR #3's 31 files — must merge sequentially and rebase, otherwise GitHub shows duplicate diffs — **blocker for clean merge, not for dev**
- **PR #1 CI failure:** `ERR_PNPM_BAD_PM_VERSION` due to `version: 10` vs `packageManager: pnpm@10.22.0` — **blocker to merge #1**, fixed in #2/#3/#4/#5 by removing `version` key — requires rebase of #1 onto #2
- **Result duplication tech debt:** `Result` type is duplicated locally in `@winlerr/ai` and `@winlerr/integrations` to avoid `TS6059 rootDir` error (instead of importing from `@winlerr/config`) — **minor tech debt**, not product blocker — recommend fixing `packages/*/tsconfig.json` `rootDir` or centralizing `Result` in `@winlerr/config` with proper `composite` setup
- **Supabase type generation blocked:** Manual `OrganizationRow` etc. are Established for now, but must be replaced by `supabase gen types` after real DB — **blocker for prod, not for platform**
- **Turbo `test` outputs `coverage/**` warnings:** No coverage files yet — **cosmetic**, not failing

## 9. Security Blockers

- **RLS is membership-based only, not role-based:** Users can read/write within any org they are member of, regardless of role — **acceptable for foundation, but too permissive for future production** — must be tightened after HQ approves role matrix (see §7A) — **blocker for prod hardening, not for platform gate**
- **No secrets in repo:** Verified via `git ls-files` no `.env`, `git check-ignore .env` PASS, diff scanned no `ghp/gho/AKIA/BEGIN PRIVATE` — **not blocked**
- **Service-role remains server-only:** `createAdminClient` throws on `window`, `bypassRls` flagged — **Established, not blocked**

## 10. Product Implementation Blockers

- **No product tables:** `leads`, `bookings`, `customers`, etc. — **blocked until first product priority (E) chosen**
- **No product UI:** `apps/*` remain placeholders (`No build yet — placeholder`) — **blocked until HQ chooses product**
- **No real Supabase project:** No prod DB, no connection — **blocked until platform PRs merged and Supabase project created (no credentials yet)**
- **No OAuth credentials:** — **blocked until HQ chooses providers (C)**
- **No integration credentials:** — **blocked until first product chooses provider**
- **No deployment:** Vercel/Supabase/Cloudflare not configured — **blocked until product**

## 11. Conditions Required Before Product Implementation

All must be true:

1. **HQ approves at least one of (A) role matrix and (E) first product priority** — minimum to create product tables and tighten RLS
2. **PRs merge in order:** #2 (toolchain) → rebase #1 → merge #1 (architecture) → rebase #3 → merge #3 (contracts) → rebase #4 → merge #4 (domain) → rebase #5 → merge #5 (verification) → rebase this gate → merge this gate — so `develop` contains full platform foundation
3. **Supabase project created (no prod data) and `supabase gen types` run** to replace manual types — `DATABASE_URL` etc. remain placeholders until then
4. **Security review of RLS with HQ-approved matrix** — tighten policies beyond membership
5. **Product boundary PROPOSAL below is approved as HQ decision** (or HQ provides alternative)

Until then, **no `apps/*` product code, no `services/*` product logic, no `infrastructure/supabase/migrations` product tables.**

## 12. Recommended First Product Boundary — PROPOSAL — PENDING HQ APPROVAL

Based **only** on currently established project information (architecture docs, platform contracts, and n8n Agent 01 R&D), the strongest architectural fit is:

### **Lead Response / Lead Qualification — PROPOSAL**

**Why this fits:**
- n8n is already running Winlerr Agent 01 R&D for Lead Response — reusing that R&D minimizes new AI/integration risk
- Lead Response naturally exercises the **entire platform foundation** already Established: `organizations` (tenant), `memberships` (who can see leads), `audit_log` (who qualified what), `@winlerr/ai` (provider-agnostic LLM for qualification), `@winlerr/integrations` (WhatsApp/email/calendar for response), `@winlerr/config` (env), `@winlerr/database` (client factories)
- CRM, Booking, and WhatsApp automation would require additional product tables and provider wiring that have **no R&D advantage** yet

**This is NOT an irreversible HQ decision — it is a Proposal for HQ to approve or reject.**

If HQ chooses a different product, the platform foundation below remains valid without rework.

**Product boundary (if approved):**

- **Required domain entities (not yet created — listed here as Proposal):**
  - `leads` (id, organization_id, source, payload jsonb, status, created_by, created_at)
  - `lead_events` (id, organization_id, lead_id, actor, event_type, payload, created_at)
  - All with `organization_id`, RLS membership-based initially, indexes on organization_id + created_at
- **Required platform contracts (already Established):**
  - `@winlerr/config` (env), `@winlerr/database` (factories + RLS), `@winlerr/auth` (membership guards), `@winlerr/ai` (LLM), `@winlerr/integrations` (WhatsApp/email)
- **Required integrations (Proposal, not yet implemented):**
  - Inbound lead webhook (`/api/webhooks/lead`) — verify, validate Zod, idempotency, 200 fast then queue
  - WhatsApp adapter (if HQ wants WhatsApp response) — via `@winlerr/integrations` whatsapp adapter, not direct SDK
- **Required AI capabilities (Proposal):**
  - `chat()` via `@winlerr/ai` with `responseSchema` for structured lead qualification (e.g., `leadScore`, `intent`)
  - Tools with Zod schemas, bounded, audited — no autonomous writes without human approval
- **Required permissions (Proposal, pending HQ matrix):**
  - `lead:read`, `lead:write`, `lead:qualify` — mapped to `viewer/member/admin` placeholder, final mapping needs HQ (A)
  - Org isolation: every query via `organization_id` + RLS
- **Required tenant isolation (Established pattern):**
  - All lead tables have `organization_id`, RLS `organization_id in (memberships where user_id=auth.uid())`
- **Required audit events (Proposal):**
  - `lead.created`, `lead.qualified`, `lead.responded` in `audit_log` (organization_id, actor, resource_type=lead, metadata without secrets)
- **Minimum viable workflow (Proposal):**
  1. Inbound lead → webhook → validate → idempotency → 200 → queue
  2. Qualification via `@winlerr/ai` (structured output) → store `lead_events`
  3. Human approval or tightly-scoped policy → response via `@winlerr/integrations`
  4. Audit every step in `audit_log`
- **Explicit non-goals (must NOT be built in first product):**
  - Full CRM (contacts, pipelines, activities)
  - Full booking (scheduling, calendar sync)
  - WhatsApp automation beyond single response template
  - Payment/subscription systems
  - MCP server/client, vector DB, RAG, autonomous workflows
  - Production infrastructure beyond Vercel preview + Supabase staging project

## 13. Explicit List of Things That Must NOT Be Built Yet

- CRM functionality, booking, WhatsApp bots, AI agents beyond `chat()` contract, MCP, AI memory
- `leads`, `bookings`, `customers`, `conversations`, `messages`, `campaigns`, `products`, `payments`, `subscriptions` tables — none in current migration, do not add until HQ approves product priority (E)
- Production Supabase tables beyond `organizations`/`memberships`/`audit_log`
- Production Supabase resources, OAuth credentials, third-party API secrets, Vercel/Cloudflare deployment
- Unnecessary applications or microservices — keep modular monolith (ADR 0002)
- Direct `supabase-js` or `openai` SDK calls in `apps/*` — must go via `@winlerr/*`
- Role/permission matrix freeze without HQ (A) — keep as Current Plan
- Multi-org membership final rules without HQ (B)
- Legacy master branch deletion without HQ (D) — keep `archive-legacy-main`

## 14. Verification Summary

- **PR ancestry:** 5 OPEN PRs verified, CI status checked (#1 FAILURE pre-existing, #2-5 SUCCESS after toolchain fix), stacked duplicates documented
- **Architecture:** monorepo, modular monolith, Supabase, workspaces, Turbo, Node 22/pnpm 10.22.0 — Established
- **Database:** organizations/memberships/audit_log with correct PK/FK/indexes/timestamps/trigger/RLS — Established (migration verified)
- **RLS:** membership-based, service-role server-only — PASS with HQ blocker documented
- **Platform contracts:** config/database/auth/ai/integrations — Established with minor Result duplication debt; automation/notifications correctly Deferred
- **Supabase readiness:** contracts hard enough to wire `@supabase/supabase-js` behind `@winlerr/database` without rework — READY, but not yet connected — Current Plan
- **Dependency direction:** `apps/services → @winlerr/* → @winlerr/config` — PASS, no circular, no bypass
- **Tests:** platform contracts on feature branches: 38+ tests PASS; this verification branch (develop + doc) shows placeholder tests PASS (18) — not a failure, just no contracts yet in develop
- **Security:** no secrets, .env ignored, RLS correct — PASS
- **Labels:** Established/Current Plan/Proposal/Experiment/Assumption explicitly distinguished throughout — PASS
