# Development — Winlerr

## Canonical Toolchain

Winlerr has **one** clear toolchain. Do not introduce competing version managers.

| Tool | Canonical Version | Source of Truth |
|------|-------------------|-----------------|
| Node.js | **22 LTS** | `.nvmrc` (`22`), `package.json:engines`, `package.json:devDependencies @types/node` |
| pnpm | **10.22.0** | `package.json:packageManager` |
| Turbo | 2.10.11 | `package.json:devDependencies` + `pnpm-lock.yaml` |
| TypeScript | 5.9.3 | `tsconfig.json` + `package.json` |
| ESLint | 9.39.5 | `eslint.config.mjs` + `typescript-eslint` |

> `package.json:packageManager` is authoritative for pnpm. CI reads it directly via `pnpm/action-setup` (no duplicate `version` key). `.nvmrc` is the only Node version manager file — no Volta/asdf competition.

Verify locally:

```bash
node --version   # expect v22.x (22 LTS)
pnpm --version   # expect 10.22.0
```

## Prerequisites

- **Node.js >= 22** (see `.nvmrc` — use `nvm use` or `fnm use`)
- **pnpm >= 10.22.0** (enable via `corepack enable` — respects `packageManager`)
- **Git >= 2.40**

## Setup (New Developer — 10 Steps)

```bash
# 1. Clone
git clone git@github.com:seantinashenyakutira-whatsblade/winlerr.git
cd winlerr

# 2. Use correct Node version (from .nvmrc)
nvm use
# or: fnm use

# 3. Enable pnpm via corepack (reads packageManager)
corepack enable

# 4. Install dependencies (frozen lockfile)
pnpm install --frozen-lockfile

# 5. Configure local environment (never commit .env)
cp .env.example .env
# Edit .env — fill placeholders only where needed; .env is gitignored

# 6. Run development (all workspaces via Turbo)
pnpm dev

# 7. Lint
pnpm lint

# 8. Typecheck
pnpm typecheck

# 9. Test
pnpm test

# 10. Build
pnpm build
```

Individual workspaces (when implemented):

```bash
pnpm --filter @winlerr/ui build
pnpm --filter web dev
turbo run <task> --filter=<name>
```

## Commands

| Command | Purpose | Implementation |
|---------|---------|----------------|
| `pnpm dev` | Dev mode (all workspaces) | `turbo run dev` (persistent, no cache) |
| `pnpm build` | Production build | `turbo run build` (dependsOn ^build, outputs .next/dist) |
| `pnpm lint` | ESLint across monorepo | `turbo run lint` |
| `pnpm lint:fix` | ESLint auto-fix | `turbo run lint:fix` |
| `pnpm typecheck` | TypeScript `--noEmit` per workspace | `turbo run typecheck` (dependsOn ^build) |
| `pnpm test` | Tests | `turbo run test` (outputs coverage) |
| `pnpm format` | Prettier write | `prettier --write ...` |
| `pnpm format:check` | Prettier check | `prettier --check ...` |
| `turbo run <task> --filter=<name>` | Target one workspace | Turborepo filtering |

Each of `pnpm dev/build/lint/typecheck/test` actually performs useful work via Turbo — no fake scripts.

## Branching

- `main` — production
- `develop` — staging / active development (base for `feature/*`)
- `feature/*`, `fix/*`, `experiment/*` — short-lived branches off `develop`

PRs target `develop`. Keep commits conventional (`feat:`, `fix:`, `chore:`, `docs:`, etc.).

## Verification

Before marking work complete, run and report outputs for:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Never claim verification without actually running the commands. CI runs the same sequence (`checkout → setup pnpm (via packageManager) → setup Node 22 → frozen install → lint → typecheck → test → build`).

## Environment

- `.env` is gitignored (`.gitignore:16`), never committed. Verify via `git check-ignore .env`.
- `.env.example` is source of truth, contains placeholders only — no real credentials.
- Placeholders include: `NEXT_PUBLIC_APP_URL`, Supabase (`NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`/`SERVICE_ROLE_KEY`), AI (`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`), WhatsApp (`WHATSAPP_*`), Cloudflare (`CLOUDFLARE_*`).
- All are server-only unless `NEXT_PUBLIC_*`; never expose service-role keys to clients.

## Conventions

- Packages: `@winlerr/<name>` in `packages/<name>/`
- Apps: `apps/<name>/`
- Services: `services/<name>/` (logical namespace — modular monolith, not premature microservices)
- Env: `.env.example` is source of truth; `.env` is ignored
- Migrations: `infrastructure/supabase/migrations/` (migrations-only, no dashboard prod mutation)
- Monorepo: `pnpm-workspace.yaml` defines `apps/*`, `packages/*`, `services/*`
