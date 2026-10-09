# Implementation Roadmap

> Sequenced plan derived from the repository audit (2026-10-08). This is documentation only — **no product work has started**. The next phase (WinlaOS implementation) is a separate, explicit task.

## Current state in one paragraph

The repo is a Turborepo/npm monorepo where **`apps/web` (production marketing site) and `packages/ai` are the only implemented workspaces**. All 6 other apps, 7 of 8 packages, and all 4 services are placeholders. The site's four API routes already integrate Supabase (`leads`, `claims` tables — RLS on), Resend, and OpenRouter. CI is broken (pnpm without a pnpm lockfile). Docs contain stale claims from an earlier audit era.

## Phase 0 — Environment & CI hygiene (now → next session)

| # | Item | Owner signal | Priority |
|---|---|---|---|
| 0.1 | Complete `npm ci` + record lint/typecheck/test/build/dev results in `environment-status.md` | blocked on flaky network | P0 |
| 0.2 | Fix Git PATH + PowerShell execution policy on dev machine | see local-development.md | P0 |
| 0.3 | ~~Decide CI's package manager~~ ✅ DONE in Phase 0 (`fix/ci-npm-toolchain`): `ci.yml` → Node 22 + `cache: npm` + `npm ci` + `npm run` gates; test step notes only `packages/ai` has tests | on feature branch, awaiting merge | P0 |
| 0.4 | Refresh stale docs: root README (`.nvmrc`, PR template that don't exist), `docs/architecture/system-overview.md`, `docs/audit/*` (historical — leave `docs/audit` as record) | docs-only | P1 |
| 0.5 | ~~Add `.env.example`~~ ✅ DONE in Phase 0 (empty placeholders only) + `.gitignore` negation so it is committable | on feature branch | P1 |
| 0.6 | ~~Fix `@winlerr/config` tsconfig path~~ ✅ DONE in Phase 0: dead mappings removed (zero code imports; forced typecheck 20/20) | on feature branch | P1 |

## Phase 1 — Platform foundation (WinlaOS, separate task)

> Not started. Order reflects dependency direction.

1. **`packages/database`** — typed Supabase client (server + browser factories, service-role isolated server-only), generated types, migration workflow via `supabase/migrations/`.
2. **`packages/auth`** — Supabase Auth helpers, `admin_profiles` RBAC groundwork (migration deliberately deferred until the WinlaOS task authorizes it).
3. **`packages/config`** — make the shared eslint/tsconfig presets actually load, or delete the dead references.
4. **`packages/ui`** — first real components (currently zero `.tsx`).
5. **`services/api`** — consolidate the four in-app API routes behind a real service *or* formally decide Next.js route handlers stay the API surface (evidence: routes already work; don't build a second API for its own sake).

## Phase 2 — Product surfaces

| App | Depends on | Note |
|---|---|---|
| `dashboard` | auth + database + ui | internal ops; fix its broken `dev`/`build` scripts first |
| `client-portal` | auth + database + ui | |
| `whatsapp-agent` | `packages/integrations` (WhatsApp Business API) | `wa.me` links already in web; real API not wired |
| `booking`, `crm`, `lead-response` | database + ui | lead-response has production data flowing into `leads` already |
| `services/workers`, `webhooks`, `agents` | queue/email/webhook deps | currently pure placeholders; only implement when a trigger exists |

## Phase 3 — Integration backlog (evidence-based)

- **Resend** — already live for claim flow; extend to newsletter (`newsletter_campaigns` table expected but absent).
- **OneSignal** — listed by stakeholders; no repo evidence yet; scope separately.
- **AI** — `packages/ai` is production-ready abstraction (OpenRouter wired); WhatsApp agent = consumer.
- **Schema gaps** — 6 expected tables have no migrations (`waitlist_leads`, `prototype_requests`, `feature_suggestions`, `newsletter_campaigns`, `admin_profiles`, `failed_submissions`): create **only** in the authorized DB phase, against production ref `uqdeuiaymoolyroppwhy` with explicit approval.
- **Prototype flow** — expected by stakeholders (schema table `prototype_requests`) but **no frontend exists**; needs design + implementation from scratch.
- **Site gaps** — contact/pricing/privacy/terms pages missing; sitemap omits `/systems/[slug]`; footer TODOs.

## Phase 4 — Quality gates

- Add tests beyond `packages/ai` (web has zero; `turbo run test` only exercises one package).
- Replace in-memory rate limiters (self-documented MVP-only).
- Add PR template + branch protection verification (needs GitHub access).
- Vercel config-as-code (`infrastructure/vercel/`) — currently a README stub.

## Explicit non-goals of the current phase

No WinlaOS build, no migrations, no production Supabase changes, no WhatsApp/OneSignal implementation, no redesign, no dependency downgrades, no package-manager switch, no test/lint bypass.
