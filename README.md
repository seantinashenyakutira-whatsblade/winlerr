# Winlerr

> Modular business automation, AI, CRM, and client systems platform.

Winlerr is a reusable software platform for business automation. This repository is the engineering monorepo that holds all Winlerr applications, shared packages, services, and infrastructure-as-code.

## Repository Contents

| Area | Path | Description |
|------|------|-------------|
| Applications | `apps/*` | Customer-facing and internal apps (web, dashboard, client-portal, lead-response, booking, CRM, whatsapp-agent) |
| Shared Packages | `packages/*` | Reusable libraries (`ui`, `auth`, `database`, `ai`, `integrations`, `automation`, `notifications`, `config`) |
| Services | `services/*` | Backend services (`api`, `workers`, `webhooks`, `agents`) |
| Infrastructure | `infrastructure/*` | IaC / environment config for Cloudflare, Vercel, Supabase |
| Documentation | `docs/*` | Architecture, ADRs, product docs, integration guides |
| Scripts | `scripts/*` | Operational helper scripts |
| GitHub | `.github/*` | Workflows and PR templates |

## Repository Structure

```
winlerr/
├── apps/
│   ├── web/                 # Marketing / public web
│   ├── dashboard/           # Internal operations dashboard
│   ├── client-portal/       # Client-facing portal
│   ├── lead-response/       # Lead response automation
│   ├── booking/             # Booking system
│   ├── crm/                 # CRM
│   └── whatsapp-agent/      # WhatsApp AI agent frontend
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── auth/                # Authentication helpers
│   ├── database/            # Supabase / DB utilities
│   ├── ai/                  # LLM provider abstraction
│   ├── integrations/        # External API integrations
│   ├── automation/          # Automation primitives
│   ├── notifications/       # Notification channels
│   └── config/              # Shared config (eslint, tsconfig)
├── services/
│   ├── api/                 # API service
│   ├── workers/             # Background workers
│   ├── webhooks/            # Webhook handlers
│   └── agents/              # AI agent runtimes
├── infrastructure/
│   ├── cloudflare/
│   ├── vercel/
│   ├── supabase/
│   └── environments/
├── docs/
│   ├── architecture/
│   ├── decisions/
│   ├── products/
│   ├── integrations/
│   └── development/
├── scripts/
├── .github/
│   ├── workflows/
│   └── pull_request_template.md
├── .env.example
├── .gitignore
├── AGENTS.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Prerequisites

- **Node.js** >= 22 (see `.nvmrc` — canonical: Node 22 LTS)
- **pnpm** >= 10.22.0 (`packageManager: pnpm@10.22.0` — use `corepack enable`)
- **Git** >= 2.40
- **Supabase CLI** (optional, for local DB) — https://supabase.com/docs/guides/local-development/cli/getting-started
- **Vercel CLI** (optional, for deployment preview) — `npm i -g vercel`

Verify:

```bash
node --version
pnpm --version
git --version
```

## Local Setup

```bash
# 1. Clone (SSH recommended)
git clone git@github.com:seantinashenyakutira-whatsblade/winlerr.git
cd winlerr

# 2. Use correct Node version
nvm use  # or fnm use, volta pin, etc.

# 3. Install dependencies
pnpm install

# 4. Environment
cp .env.example .env
# Edit .env with real values — never commit .env

# 5. Run (once apps are implemented)
pnpm dev      # all apps in dev mode via Turborepo
pnpm build    # production build
pnpm lint     # lint all workspaces
pnpm typecheck
pnpm test
```

Individual apps/packages (when implemented):

```bash
pnpm --filter @winlerr/ui build
pnpm --filter web dev
```

## Environment Variables

See `.env.example` for the full list. Categories:

- `NEXT_PUBLIC_APP_URL` — canonical app URL
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — Supabase
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — AI providers (behind abstraction in `packages/ai`)
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc. — WhatsApp Business API
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` — Cloudflare / edge

> Never commit `.env`. Never expose `SUPABASE_SERVICE_ROLE_KEY` to clients.

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all apps/packages |
| `pnpm lint` | ESLint across monorepo |
| `pnpm lint:fix` | ESLint auto-fix |
| `pnpm typecheck` | `tsc --noEmit` per workspace |
| `pnpm test` | Run tests |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |
| `turbo run <task> --filter=<name>` | Target a single workspace |

## Branch Strategy

```
main        → production
develop     → staging (active development branch)
feature/*   → development
fix/*       → bug fixes
experiment/*→ experimental work
```

- Open PRs against `develop`.
- `main` is protected and deploys to production.
- Keep commits conventional: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.

Current active development branch: **`develop`**

## Documentation

- **Architecture overview:** `docs/architecture/system-overview.md`
- **Architecture index:** `docs/architecture/README.md`
- **Architecture Decisions (ADRs):** `docs/decisions/` — e.g. `0001-monorepo.md`
- **Development guide:** `docs/development/README.md`
- **Products:** `docs/products/README.md`
- **Integrations:** `docs/integrations/README.md`
- **Agent rules:** `AGENTS.md`

## Deployment Architecture (Direction)

- **Web / Apps:** Next.js on **Vercel** (per-app projects, shared env via `infrastructure/vercel/`).
- **Database:** **Supabase** (PostgreSQL + Auth + Storage + Realtime). Migrations in `infrastructure/supabase/`.
- **Edge / DNS:** **Cloudflare** (DNS, cache, workers if needed) — `infrastructure/cloudflare/`.
- **Environments:** `infrastructure/environments/` holds environment-specific config (staging vs production).
- **AI:** Provider-agnostic abstraction in `packages/ai` — supports OpenAI, Anthropic, MCP, tool calling, agent runtimes. No direct hard-wiring of business logic to a single provider.

No production deployment is wired automatically at bootstrap. Deployment is enabled explicitly per environment.

## Contributing

1. Read `AGENTS.md`.
2. Create a branch from `develop`: `git checkout -b feature/my-feature`.
3. Make changes, run `pnpm lint && pnpm typecheck && pnpm test`.
4. Open a PR using the template at `.github/pull_request_template.md`.

## License

Private. All rights reserved. Not licensed for public distribution.
