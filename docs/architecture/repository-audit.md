# Repository Audit — Winlerr
- **Date:** 2026-08-21
- **Baseline commit audited:** `275d221` (`chore: initialize Winlerr engineering foundation`)
- **Branch audited:** `develop` (also `main`, `origin/main`, `origin/develop`, `archive-legacy-main`, `origin/master`)
- **Auditor:** OpenCode (Winlerr Engineering)

Classification legend (per spec):
- **Established** — implemented and verified
- **Current Plan** — intended direction, not yet implemented, supported by audit
- **Proposal** — suggested design, needs product/HQ review before becoming Established
- **Experiment** — exploratory, may be dropped
- **Assumption** — unvalidated belief — must not be treated as decision

---

## 1. Existing (What is already implemented)

### 1.1 Git & Branching — Established
- `main` (production) and `develop` (staging) exist and are in sync at `275d221`. History verified: `git log --oneline --decorate -10` shows single root commit. `archive-legacy-main` (d311c3e) preserved from pre-foundation landing-page prototype; `origin/master` (899c763) still present as legacy. Remote `origin` = `https://github.com/seantinashenyakutira-whatsblade/winlerr.git`, visibility now `PRIVATE` (was public, corrected via `gh repo edit`).

### 1.2 Monorepo Tooling — Established
- `pnpm-workspace.yaml` defines `apps/*`, `packages/*`, `services/*`. `package.json` (private, `packageManager pnpm@10.22.0`, engines node>=20) + `pnpm-lock.yaml` (67550 lines). Verified: `pnpm install` clean, `node v24.12.0`, `pnpm 10.22.0`, `git 2.54`.
- `turbo.json` pipelines: `build` (dependsOn ^build, outputs .next/dist), `dev` (persistent, no cache), `lint`, `typecheck` (dependsOn ^build), `test` (coverage), `clean`. Global env includes Supabase + AI keys. Verified: `pnpm typecheck` 19/19, `pnpm lint` 19/19, `pnpm test` 18/18, `pnpm build` 18/18 all pass (apps build is placeholder echo).
- `tsconfig.json` strict, `baseUrl .`, paths for all `@winlerr/*` → `packages/*/src`. Verified: `tsc --noEmit` passes.
- `eslint.config.mjs` flat config + `typescript-eslint 8.67` + `.prettierrc` + `.editorconfig` + `.nvmrc` (22) + `.gitignore` (.env, .turbo, node_modules, .next etc. correctly ignored; verified via `git check-ignore`).

### 1.3 Documentation Baseline — Established
- `README.md` (factual, covers structure, prerequisites, setup, env, commands, branching, docs, deployment direction), `AGENTS.md` (10 sections, covers repo behavior, security, DB, API, AI, testing, docs, monorepo, env, branching), `docs/decisions/0001-monorepo.md` (Established), `docs/decisions/README.md`, `docs/architecture/README.md`, `docs/architecture/system-overview.md`, `docs/development/README.md`, `docs/products/README.md`, `docs/integrations/README.md`. All present and coherent.

### 1.4 Application Placeholders — Established (as placeholders)
- 7 apps each with `package.json` (next 15, react 19, scripts dev/build/lint/typecheck/test/clean), `tsconfig.json` (extends root), `src/index.ts` (placeholder export), `README.md` (states placeholder), `.gitkeep`. Counted via `Get-ChildItem apps`. Build currently `echo "No build yet — placeholder"` (intentionally not real Next.js build — avoids fake product code).

### 1.5 Shared Packages Placeholders — Established (as placeholders)
- 8 packages with correct naming `@winlerr/ui|auth|database|ai|integrations|automation|notifications|config`. Each has `package.json` (private, exports, scripts lint/typecheck/test/build/clean), `tsconfig.json` (extends root, outDir dist), `src/index.ts` (placeholder + docs comment), `README.md`. `packages/config` also has `typescript.json` and `eslint-preset.mjs`. No circular deps; dependency direction documented in system-overview.

### 1.6 Services Placeholders — Established (as placeholders)
- 4 services (`api`, `workers`, `webhooks`, `agents`) each with `@winlerr/service-*` package.json (zod, tsx), tsconfig, src/index.ts (handlerPlaceholder), README.

### 1.7 Infrastructure Placeholders — Established
- `infrastructure/supabase/{README,config.toml,migrations/.gitkeep}`, `vercel/README`, `cloudflare/README`, `environments/{README,staging.json,production.json}`. Migrations directory ready but empty (correct — no premature schema).

### 1.8 CI — Established (minimal, correct for stage)
- `.github/workflows/ci.yml`: on push/PR to main/develop, concurrency cancel-in-progress, ubuntu-latest, pnpm/action-setup v4 (pnpm10), setup-node v4 (node22 + pnpm cache), frozen lockfile, then lint/typecheck/test/build. `.github/pull_request_template.md` with checklist (lint/typecheck/test, env, decisions, architecture, secrets, reuse). No deployment automation (correct — not enabled prematurely).

### 1.9 Environment — Established
- `.env.example` covers App (NEXT_PUBLIC_APP_URL), Supabase (URL/ANON/SERVICE_ROLE/DATABASE_URL), AI (OPENAI/ANTHROPIC), WhatsApp (ACCESS_TOKEN/PHONE_ID/VERIFY_TOKEN/APP_SECRET), Cloudflare (ACCOUNT_ID/API_TOKEN/ZONE_ID), placeholders for Stripe/Resend/Sentry commented out. `.env` gitignored verified; no real secrets committed (grep found none).

### 1.10 Security Baseline — Established (documented, not yet enforced in code)
- AGENTS.md §2/§3/§4 covers never hardcode secrets, never commit .env, never expose service-role, validate input (Zod), server-side authZ, webhook untrusted, tenant isolation. RLS and tenant isolation stated as plan.

---

## 2. Missing (Intended architecture requires but repository lacks)

| Item | Classification | Detail | Required action |
|------|----------------|--------|-----------------|
| Modular-monolith principle doc | Current Plan → Establish | No ADR explicitly stating “modular monolith, not premature microservices”. Needed per task §6. | Create ADR 0002 |
| Database architecture doc | Current Plan | No `docs/architecture/database-architecture.md` defining Organization→Users→Memberships→Roles→Permissions model + RLS. | Create doc |
| Authentication architecture doc | Current Plan | No `docs/architecture/authentication.md` separating authN/authZ, Supabase Auth + membership/RBAC. | Create doc |
| API architecture doc | Current Plan | No `docs/architecture/api-architecture.md` deciding Next.js route handlers vs dedicated api service. | Create doc |
| AI architecture doc | Current Plan | No `docs/architecture/ai-architecture.md` for provider abstraction, tools, MCP, memory, evals. | Create doc |
| Integrations architecture doc | Current Plan | No `docs/architecture/integrations.md` for adapter pattern, webhook verification, retries. | Create doc |
| Security architecture doc | Current Plan | No `docs/architecture/security.md` enumerating secrets, RLS, validation, rate limiting, audit trails, AI permissions. | Create doc |
| Environment strategy ADR | Current Plan | No ADR 0005 for develop→staging / main→production + Supabase/Vercel env isolation. | Create ADR 0005 |
| Supabase ADR | Current Plan | No ADR 0003 for Supabase/PostgreSQL as platform choice. | Create ADR 0003 |
| Auth model ADR | Current Plan | No ADR 0004 for Supabase Auth + membership/RBAC model. | Create ADR 0004 |
| System-overview Mermaid diagram | Current Plan | `system-overview.md` is text-only, lacks Mermaid diagram required by task §19. | Update doc |
| Shared config enforcement | Proposal | `packages/config` preset exists but not actually extended by apps/packages (each has inline tsconfig). Should be Current Plan to extend it. | Document as Proposal or wire up |
| CODEOWNERS | Proposal | No CODEOWNERS for package ownership — useful when team grows, premature now. | Note as Proposal |
| Supabase migrations tooling | Proposal | No `supabase` CLI pinned, no migration naming/lint script — premature until first schema. | Note as Proposal |
| Real app implementations | Assumption → not missing | All 7 apps are placeholders — correct per “do not build products” rule. Not a gap. | Document as Current Plan (placeholders correct) |

---

## 3. Incorrect (Structurally wrong or inconsistent)

| Issue | Classification | Evidence | Fix |
|-------|----------------|----------|-----|
| `package.json` description encoding artifact | Incorrect (minor) | Character `Winlerr �?" modular` shows broken em-dash (UTF-8 mojibake) vs README `Winlerr —` | Normalize to `Winlerr — modular...` in package.json |
| Remote had 2 default branches (`main` + `master`) + legacy landing-page files on `origin/master` | Incorrect (legacy) | `git ls-remote` showed `refs/heads/master` 899c763 and `archive-legacy-main` backup. Spec expects only `main`/`develop`. | Keep backup on `archive-legacy-main`; optionally `git push origin --delete master` after confirmation (do not delete without product input). Document as Established (legacy) |
| Repo was public before audit, should be private per spec | Incorrect (now fixed) | `gh api ... {private:false}` before, now `true` after `gh repo edit --visibility private` | Verified fixed; record in audit |
| `apps/*/package.json` dev script hardcodes `--port 3000` for all apps (port collision) | Incorrect (premature micro-detail) | All 7 apps would collide if `pnpm dev` runs all. | Change to port per app or let Next choose; document as Proposal (fix when first real app lands) |
| `pnpm clean` script uses `&&` (Unix) but Windows cmd uses different chaining; root `clean` uses `&& rimraf` — not verified cross-platform | Incorrect (minor) | `package.json clean: "turbo run clean && rimraf node_modules"` — works on Unix, may need `rimraf` cross-platform handling | Mark as Proposal to test on Windows CI or switch to `turbo run clean; rimraf` via JS |

---

## 4. Unnecessary (Complexity without current value — audit against “avoid premature scaling”)

| Item | Classification | Reason | Recommendation |
|------|----------------|--------|----------------|
| 7 full Next.js app scaffolds with `next` + `react` deps each (7× deps) | Unnecessary at foundation | Placeholder apps don’t need full Next.js yet; empty `src/index.ts` suffices. Adds 7× install weight and port collision. | **Current Plan**: Keep directory + package.json placeholder but remove heavy `next/react` deps until first app is implemented; or keep as is but mark as Proposal to lazy-install. Audit recommends: keep structure, note as “Future application — no code” and consider removing Next from placeholder package.json until needed. |
| 4 independent `services/*` deployables | Unnecessary at foundation | Task explicitly says avoid premature microservices; `services/api|workers|webhooks|agents` as separate deployables is premature. | **Proposal**: Treat `services/` as logical namespace only; initial implementation uses Next.js route handlers + Supabase Edge Functions + background workers inside apps, not 4 separate deploys. Keep directories but mark as future; do not create pipelines for them now. |
| `services/*` each with `tsx` + `zod` deps | Unnecessary duplicate | Same placeholder logic copied 4× | Keep but note as Proposal to deduplicate via `packages/database`/`packages/auth` when services materialize |
| Generated `.next/trace` + `.turbo` logs checked-in view? | Not committed but present on disk | `.next` is ignored (verified), but audit `Get-ChildItem` showed `.next/trace` and `.turbo` under apps due to earlier build — not tracked but creates confusion | No action; ensure `.gitignore` covers `.next`, `.turbo` (it does). Mark as Established (correctly ignored) |
| Separate `packages/automation` + `packages/notifications` placeholders | Proposal | Two packages with identical one-line placeholders; not justified until automation/notification logic exists | Keep as placeholders but merge conceptually under `packages/automation` + `packages/integrations` until use case emerges; document as Proposal |

---

## 5. Recommended (Concrete changes required — this audit’s deliverables)

### Priority 1 — Must (this branch)
- [ ] Create `docs/architecture/repository-audit.md` (this file) — **Established**
- [ ] Update `docs/architecture/system-overview.md` with Mermaid diagram — **Current Plan**
- [ ] Create `docs/decisions/0002-modular-monolith.md` — **Established Decision**
- [ ] Create `docs/decisions/0003-supabase-postgresql.md` — **Established Decision**
- [ ] Create `docs/decisions/0004-authentication-model.md` — **Current Plan** (needs product review before Established)
- [ ] Create `docs/decisions/0005-environment-strategy.md` — **Established Decision**
- [ ] Create `docs/architecture/database-architecture.md` — **Current Plan**
- [ ] Create `docs/architecture/authentication.md` — **Current Plan**
- [ ] Create `docs/architecture/api-architecture.md` — **Current Plan**
- [ ] Create `docs/architecture/ai-architecture.md` — **Current Plan**
- [ ] Create `docs/architecture/integrations.md` — **Current Plan**
- [ ] Create `docs/architecture/security.md` — **Current Plan**
- [ ] Normalize `package.json` description em-dash encoding — **Established**

### Priority 2 — Should (next PR, not this branch’s scope)
- [ ] Decide `packages/config` adoption: make apps/packages extend `@winlerr/config/typescript.json` — **Proposal**
- [ ] Document CODEOWNERS as Proposal — **Proposal**
- [ ] Deprecate/remove `master` branch remote (`git push origin --delete master`) after confirming no legacy consumers — **Proposal**

### Priority 3 — Could (future, when first product ships)
- [ ] First real app (`apps/web`) as Next.js App Router with shared UI — **Experiment**
- [ ] First Supabase migration for `organizations`, `users`, `memberships`, `roles` — **Proposal**
- [ ] AI provider wiring in `packages/ai` behind abstraction — **Proposal**

---

## 6. Classification Summary

| Status | Count | Examples |
|--------|-------|----------|
| **Established** | 12 | Monorepo (0001), pnpm/turbo/tsconfig/eslint, CI minimal, placeholder dirs, .env handling, system-overview existing, auth/security rules documented |
| **Current Plan** | 10 | Modular monolith (0002), Supabase choice (0003), auth model (0004), env strategy (0005), DB/auth/API/AI/integrations/security docs, Mermaid diagram |
| **Proposal** | 6 | Shared config enforcement, CODEOWNERS, Supabase CLI pin, port handling, service deployment nuance, master deletion |
| **Experiment** | 1 | First real Next.js app scaffolding |
| **Assumption** | 1 | “7 apps all need separate Vercel projects” — not yet validated; depends on product priority |

> Rule: Do not silently convert Assumption → Established. Each Proposal must be labeled as such in its ADR/doc until product/HQ review.
