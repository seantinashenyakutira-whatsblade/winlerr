# Local Development

> How to run this repo on a fresh Windows/macOS/Linux machine. No secrets are included — put real values only in `.env*` files (never committed).

## Machine prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | **>= 20** (CI uses 22; tested locally on 24) | https://nodejs.org or `nvm install 22` |
| npm | ships with Node (**repo pins npm 10.8.2** via `packageManager`) | see "Package manager" below |
| Git | >= 2.40 | https://git-scm.com |

Not required: pnpm, yarn, Docker, WSL, Python, Java, PostgreSQL client. (The README's pnpm instructions are stale — see repository-audit.md §2.)

## Package manager

**npm** — canonical per `package.json` → `packageManager: "npm@10.8.2"` and `package-lock.json`. Do not use pnpm/yarn; do not create or delete lockfiles.

- If you have Node's bundled npm (any 10.x/11.x): just use it as-is.
- To match the pinned version exactly: `npm i -g npm@10.8.2`.

## Commands (run from repo root)

```bash
# install (first run / after pulling lockfile changes)
npm ci

# development (Next.js dev server, port 3000, binds 0.0.0.0)
npm run dev              # = npm run dev --workspace=web

# lint (turbo across workspaces)
npm run lint
npm run lint:fix         # auto-fix

# typecheck (tsc --noEmit per workspace)
npm run typecheck

# tests (vitest — currently only packages/ai has tests)
npm run test

# production build (only apps/web has a real build)
npm run build

# formatting
npm run format           # prettier --write .
npm run format:check

# single workspace
npm run dev --workspace=web
npm run typecheck --workspace=packages/ai
npx turbo run build --filter=web
```

> On Windows, if `npm` fails with "running scripts is disabled", run it as `cmd /c npm …` or fix the execution policy (Troubleshooting).

## Environment variables

There is **no `.env.example`** in the repo (known gap). The variables the code actually reads:

| Variable | Used by | Required for |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | turbo globalEnv, metadata | canonical URL |
| `NEXT_PUBLIC_SITE_URL` | turbo globalEnv | sitemap/canonical |
| `NEXT_PUBLIC_SUPABASE_URL` | `/api/leads`, `/api/claims` | lead + claim forms (else: lead form silently stubs, claims fail) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as above | same |
| `SUPABASE_SERVICE_ROLE_KEY` | declared only — **unused in code** | future use; never expose to clients |
| `OPENROUTER_API_KEY` | `/api/concierge`, `/api/demo-reply` | live AI (else: canned fallback / WhatsApp link — site still works) |
| `AI_DEFAULT_PROVIDER` / `AI_DEFAULT_MODEL` / `AI_FALLBACK_MODEL` | AI routes | model selection (defaults exist) |
| `RESEND_API_KEY` | `src/lib/email.ts` via `/api/claims` | claim confirmation emails (claim insert still works without) |

Create files: `apps/web/.env.local` (Next.js picks it up; turbo hashes `**/.env.*local` as global dependency).

**The site runs locally with zero env vars** — AI falls back to canned replies, lead form no-ops, but the UI renders fully.

## Supabase setup

- Production project: **Winlerr**, ref `uqdeuiaymoolyroppwhy`, URL `https://uqdeuiaymoolyroppwhy.supabase.co`.
- For local form testing: copy `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase dashboard (Project Settings → API) into `apps/web/.env.local`.
- Migrations live in `supabase/migrations/` (2: `leads`, `claims`). **Do not run migrations against production** without explicit authorization (separate phase).
- Optional local DB: Supabase CLI (`supabase init`/`supabase start` requires Docker) — only if you need a sandbox database; not needed to run the site.

## Vercel setup

- Production: `https://www.winlerr.vip` — Vercel project `winlerr`, production branch `main`.
- The repo contains **no `vercel.json`** and `infrastructure/vercel/` is a stub; deploy settings live in Vercel's dashboard, not the repo.
- Local deploys are unnecessary for development. If you need them later: `npm i -g vercel` → `vercel link` → `vercel` (preview). Never `vercel --prod` without authorization.

## Git / GitHub workflow

- Remote: `https://github.com/seantinashenyakutira-whatsblade/winlerr.git`
- Branches (per README): `main` = production, `develop` = staging, `feature/*` | `fix/*` | `experiment/*` off `develop`; **PRs target `develop`**; conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Caveat: currently only `main` exists on the remote. CI was fixed to npm in Phase 0 (`fix/ci-npm-toolchain`); remote CI runs on push once the branch is pushed.
- Before pushing: `npm run lint && npm run typecheck && npm run test` (repo docs: "Never claim verification without actually running the commands").

## Common troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `'npm' is not recognized` / `npm.ps1 cannot be loaded` | PowerShell execution policy | `cmd /c npm …`, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `'git' is not recognized` | Git installed but not on PATH | Add `C:\Program Files\Git\cmd` to PATH (System Properties → Environment Variables) |
| `npm error network ECONNRESET` during install | flaky connection to registry.npmjs.org | retry; use `npm ci --no-audit --maxsockets=4 --fetch-retries=10`; cache preserves progress |
| `git clone` prompts for username on a public repo | wrong URL / repo private / account flag | verify the URL opens in a logged-out browser; `set GIT_TERMINAL_PROMPT=0` to fail fast |
| `pnpm install --frozen-lockfile` fails | there is no `pnpm-lock.yaml` — repo is npm | use `npm ci` |
| Lead form "works" but nothing persists | missing Supabase env vars (route returns `stub: true`) | add `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` to `apps/web/.env.local` |
| AI demo always canned replies | missing `OPENROUTER_API_KEY` | add key, or accept fallback (site remains functional) |
| `ENOENT` on `@winlerr/config` / tsconfig paths | `tsconfig.base.json` maps a nonexistent `packages/config/src` | known issue (roadmap 0.6) — report, don't hand-edit deps |
| Port 3000 busy | another dev server | stop it, or change `-p 3000` in `apps/web` dev script |
| Turbo cache stale after branch switch | cached task outputs | `npx turbo prune`-style cleanup: `npm run clean` (removes node_modules too — reinstall after) |
