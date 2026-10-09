# Repository Audit

> Evidence-based audit of `seantinashenyakutira-whatsblade/winlerr` (2026-10-08). Findings are observations only — no product code, migrations, or infrastructure were changed in this phase.

## 1. Git repository

| Field | Value |
|---|---|
| Remote | `https://github.com/seantinashenyakutira-whatsblade/winlerr.git` ✅ matches expected repo |
| Branch | `main` (up to date with `origin/main`) |
| HEAD | `caab150 merge: content v2` — 34 commits, working tree clean |
| History | untouched; no reset/clean performed |

## 2. Toolchain reconciliation

**Canonical package manager: npm** — decided by priority order:

1. `packageManager: "npm@10.8.2"` (highest-priority signal) ✅
2. Lockfile: `package-lock.json` present; **no** `pnpm-lock.yaml`, **no** `yarn.lock` ✅
3. Workspace config: npm `workspaces` array in root `package.json` (`apps/*`, `packages/*`, `services/*`); **no** `pnpm-workspace.yaml` ✅
4. CI configuration: ✅ **fixed in Phase 0** (`fix/ci-npm-toolchain`): `ci.yml` now uses `actions/setup-node` (Node 22, `cache: npm`) + `npm ci` + `npm run lint/typecheck/test/build`. Previously said pnpm with no lockfile, which could never succeed.
5. Scripts: ✅ npm (`npm run build --workspace=web`, etc.)

**Conflict (resolved in Phase 0):** root `README.md`, `docs/development/README.md`, `AGENTS.md`, and `.github/workflows/ci.yml` said **pnpm**, while the authoritative signals said **npm**. With no `pnpm-lock.yaml`, `pnpm install --frozen-lockfile` **could never succeed**. Phase 0 (`fix/ci-npm-toolchain`) rewrote CI and the live contributor docs to npm; historical docs (`docs/audit/*`, `docs/decisions/0001-monorepo.md`) intentionally left as records of the earlier pnpm era.

Also stale: README references `.nvmrc` and `.github/pull_request_template.md` — **neither exists**. (`.env.example` was created in Phase 0; `pnpm-workspace.yaml` reference removed.)

## 3. Monorepo status (19 workspaces)

### apps/

| Workspace | Status | Evidence |
|---|---|---|
| `web` | **IMPLEMENTED** | 44 source files: 14 App-Router files (incl. 4 API routes), 24 components, 5 lib modules; real next scripts; prod site |
| `dashboard` | **SCAFFOLDED / BROKEN script** | 1 file `export const placeholder="dashboard"`; `dev` = `next dev` but no `app/` dir → fails; `build` stubbed to `tsc --noEmit` |
| `client-portal` | SCAFFOLDED / BROKEN script | same pattern |
| `lead-response` | SCAFFOLDED / BROKEN script | same pattern |
| `booking` | SCAFFOLDED / BROKEN script | same pattern |
| `crm` | SCAFFOLDED / BROKEN script | same pattern |
| `whatsapp-agent` | SCAFFOLDED / BROKEN script | same pattern |

### packages/

| Workspace | Status | Evidence |
|---|---|---|
| `ai` | **IMPLEMENTED** | 10 src files (providers: openrouter/openai/anthropic/ollama + base, errors, schemas, usage, types); retries, rate/usage metering; 4 vitest suites (37 cases) — the repo's only tests |
| `config` | PARTIAL / partly BROKEN | `eslint-preset.mjs` + `typescript.json` exist, but root `eslint.config.mjs` doesn't use the preset; `tsconfig.base.json` maps `@winlerr/config` → `packages/config/src` which **does not exist** |
| `auth` | SCAFFOLDED | 1 placeholder file, JSDoc contract only; only dep `zod` (no supabase) |
| `database` | SCAFFOLDED | placeholder only; no supabase dep |
| `ui` | SCAFFOLDED | placeholder only; **zero `.tsx` files**, no components |
| `integrations` | SCAFFOLDED | placeholder only |
| `automation` | SCAFFOLDED | 5-line placeholder |
| `notifications` | SCAFFOLDED | 5-line placeholder |

### services/

`api`, `workers`, `webhooks`, `agents` — all **SCAFFOLDED**: `src/index.ts` is a placeholder exporting a handler returning `{status:"not-implemented"}`.

### Other stale/broken findings

- `docs/audit/*` claims "`apps/web` is a 3-line placeholder, 0 migrations" — **contradicted** by current state (implemented web + 2 migrations).
- `docs/architecture/system-overview.md` lists all 7 apps as placeholders — only 6 still are.
- `scripts/health-check.mjs` is a `console.log("not implemented yet")` stub.
- `.github/workflows/ci.yml` fixed in Phase 0 (npm + Node 22) — see §2.

## 4. Public website routes (`apps/web`, Next.js 15 App Router)

Base: `winlerr.vip` · `output: "standalone"` · no middleware/not-found/loading files.

| Route | Source | Backend | Supabase | External | Rendering |
|---|---|---|---|---|---|
| `/` | `src/app/page.tsx` | `POST /api/demo-reply`, `/api/leads`, `/api/claims`, `/api/concierge` (concierge mounted in root layout, every page) | via API routes only | OpenRouter, `wa.me` links | Static |
| `/about` | `src/app/about/page.tsx` | — | — | static audio asset | Static |
| `/get-started` | `src/app/get-started/page.tsx` | `POST /api/leads` | via API | WhatsApp link | Static |
| `/systems` | `src/app/systems/page.tsx` | — | — | — | Static (hardcoded 6 entries) |
| `/systems/[slug]` | `src/app/systems/[slug]/page.tsx` | — | — | — | SSG ×6 (source: `src/lib/systems.ts`), `notFound()` else |
| `/docs` | `src/app/docs/page.tsx` | — | — | — | Static (source: `src/lib/docs.ts`) |
| `/docs/[slug]` | `src/app/docs/[slug]/page.tsx` | — | — | — | SSG ×4 |
| `/robots.txt`, `/sitemap.xml` | `robots.ts`, `sitemap.ts` | — | — | — | Static (sitemap omits `/systems/[slug]`) |

**API routes** (all `runtime: nodejs`):

| Route | Behavior |
|---|---|
| `POST /api/claims` | rate-limit 5/IP/h → validate → Supabase insert into `claims` (RLS INSERT-only, client-generated id; `23505`→409) → Resend emails (confirm + owner) |
| `POST /api/leads` | rate-limit 5/min/IP → Supabase insert into `leads` (`source: landing_page`, `status: new`); missing env → `{ok:true, stub:true}` silent no-op |
| `POST /api/concierge` | AI widget via `@winlerr/ai` (openrouter), rate-limited, 12s timeout, falls back to `wa.me` link, never 500s |
| `POST /api/demo-reply` | homepage AI demo, sandbox business profiles, canned fallback without key |

**Flows:** claim flow ✅ (`ClaimGift` → `/api/claims`), lead flow ✅ (`LeadForm` → `/api/leads`), AI demo ✅ + site concierge ✅. **Prototype flow: does not exist** (0 matches for "prototype"). **Contact page: does not exist** (nav "Contact" → `/get-started`). No pricing/privacy/terms pages (footer `href: undefined` → `#`, TODOs in `footer.tsx:33,35`).

**Integration summary:** Supabase (anon key, 2 API routes only), Resend (`src/lib/email.ts`), OpenRouter via `@winlerr/ai`, static `wa.me/260776950796`, Google fonts, framer-motion. No client-side Supabase anywhere.

## 5. Supabase

Expected project: `Winlerr`, ref `uqdeuiaymoolyroppwhy`, URL `https://uqdeuiaymoolyroppwhy.supabase.co` (not contacted this phase — no secrets handled, production untouched).

| Item | Repository state |
|---|---|
| Browser client | ❌ none (no shared client; components don't use Supabase) |
| Server client | ⚠️ ad-hoc `createClient(url, anonKey)` inside `/api/claims` + `/api/leads` only |
| Service role usage | ❌ none in code (but `SUPABASE_SERVICE_ROLE_KEY` declared in `turbo.json` globalEnv) |
| Environment variables | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (declared; no `.env*` files exist) |
| Migration directory | ✅ `supabase/migrations/` (2 files) |
| Database package | ⚠️ `packages/database` scaffolded (placeholder, no supabase dep) |
| Generated types | ❌ none |

**Schema reconciliation** (repo migrations vs expected production schema):

| Expected table | In repo migrations? |
|---|---|
| `leads` | ✅ `20260925064611_create_leads_table.sql` |
| `claims` | ✅ `20260926000000_create_claims_table.sql` |
| `waitlist_leads` | ❌ absent |
| `prototype_requests` | ❌ absent |
| `feature_suggestions` | ❌ absent |
| `newsletter_campaigns` | ❌ absent |
| `admin_profiles` | ❌ absent |
| `failed_submissions` | ❌ absent |

Both existing migrations enable RLS. Actual production schema **not verified** (would require connecting to Supabase — out of scope this phase; do not create migrations yet).

## 6. Vercel

| Item | State |
|---|---|
| `vercel.json` | ❌ none anywhere in repo |
| Build/install/root dir config | ❌ none committed (defaults presumed: root, `npm install`? unverified) |
| `.vercelignore` | ✅ present |
| Next config | ✅ `output: "standalone"` (`apps/web/next.config.ts`) |
| Rewrites/redirects | ❌ none found |
| Domains | README metadata: `winlerr.vip`; production is `https://www.winlerr.vip` |
| `infrastructure/vercel/` | README stub only: "Per-app Vercel projects will be configured here. No auto-prod deployment at bootstrap." |

Project `winlerr`, production branch `main` — **not verifiable from the repo** (no committed Vercel config; Vercel CLI not installed, not authenticated). Not modified, not deployed this phase.

## 7. GitHub workflow

- **CI:** `.github/workflows/ci.yml` — lint/typecheck/test/build on push + PR to `main` and `develop`; **fixed to npm in Phase 0** (`fix/ci-npm-toolchain`), YAML-validated, gates re-verified locally on the branch.
- **Branch strategy** (README + `docs/development/README.md`): `main` = production (protected, deploys), `develop` = staging/active, `feature/*`, `fix/*`, `experiment/*` off `develop`; **PRs target `develop`**; conventional commits.
- **PR template / branch protection:** ❌ no `.github/pull_request_template.md`; protection not verifiable without GitHub API access.
- **Recommendation (safest, matches evidence):** work on `feature/*`/`fix/*` branches cut from `main` (the only branch that currently exists on the remote), open PRs → `main`.

## 8. CLI requirements

| Tool | Verdict | Why |
|---|---|---|
| Git | **REQUIRED NOW** — installed, needs PATH fix | everything |
| GitHub CLI (`gh`) | **REQUIRED LATER** | branch protection/PR verification once authenticated; not needed to clone (repo public) |
| Vercel CLI | **REQUIRED LATER** | inspect/deploy Vercel project in a later phase; not needed for local dev |
| Supabase CLI | **OPTIONAL** | local DB sandbox later; repo has no local-dev requirement on it now |
| Playwright | **NOT NEEDED** | no e2e config/tests exist (only vitest unit tests) |
| Docker | **NOT NEEDED** | no docker-compose/service evidence |
| WSL | **NOT NEEDED** | plain Node/Next stack runs natively on Windows |

## 9. Not touched (stop condition)

No WinlaOS work, no migrations created, no organizations tables, no Supabase changes, no WhatsApp/OneSignal implementation, no website redesign, no product features, no third-party code copied. Git history untouched.
