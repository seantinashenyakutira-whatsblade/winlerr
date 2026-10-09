# Development — Winlerr

## Prerequisites

- Node.js >= 20, npm >= 10, Git >= 2.40

## Setup

```bash
git clone git@github.com:seantinashenyakutira-whatsblade/winlerr.git
cd winlerr
npm ci
cp .env.example .env   # fill in values
npm run dev
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev mode (all workspaces) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm run test` | Tests |
| `npm run format` | Prettier write |
| `npm run <script> --workspace=<name>` | Target one workspace |
| `turbo run <task> --filter=<name>` | Turborepo equivalent |

## Branching

- `main` — production
- `develop` — staging / active development
- `feature/*`, `fix/*`, `experiment/*` — short-lived branches off `develop`

PRs target `develop`. Keep commits conventional (`feat:`, `fix:`, `chore:`, etc.).

## Verification

Before marking work complete, run and report outputs for:

```bash
npm run typecheck
npm run lint
npm run test
```

Never claim verification without actually running the commands.

## Conventions

- Packages: `@winlerr/<name>` in `packages/<name>/`
- Apps: `apps/<name>/`
- Services: `services/<name>/`
- Env: `.env.example` is source of truth; `.env` is ignored
- Migrations: `infrastructure/supabase/migrations/`
