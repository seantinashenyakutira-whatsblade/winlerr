# Development — Winlerr

## Prerequisites

- Node.js >= 20, pnpm >= 9, Git >= 2.40

## Setup

```bash
git clone git@github.com:seantinashenyakutira-whatsblade/winlerr.git
cd winlerr
pnpm install
cp .env.example .env   # fill in values
pnpm dev
```

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev mode (all workspaces) |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript `--noEmit` |
| `pnpm test` | Tests |
| `pnpm format` | Prettier write |
| `pnpm --filter <name> <script>` | Target one workspace |
| `turbo run <task> --filter=<name>` | Turborepo equivalent |

## Branching

- `main` — production
- `develop` — staging / active development
- `feature/*`, `fix/*`, `experiment/*` — short-lived branches off `develop`

PRs target `develop`. Keep commits conventional (`feat:`, `fix:`, `chore:`, etc.).

## Verification

Before marking work complete, run and report outputs for:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Never claim verification without actually running the commands.

## Conventions

- Packages: `@winlerr/<name>` in `packages/<name>/`
- Apps: `apps/<name>/`
- Services: `services/<name>/`
- Env: `.env.example` is source of truth; `.env` is ignored
- Migrations: `infrastructure/supabase/migrations/`
