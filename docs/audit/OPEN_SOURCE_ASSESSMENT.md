# Winlerr — Open-Source Assessment

> Date: 2026-09-24. Scope: read-only evaluation of 5 pulled projects in `research/` (gitignored, uncommitted) against Winlerr target architecture (Next.js + TypeScript monorepo, Supabase Postgres + RLS + Auth, multi-tenant, provider-agnostic AI, Vercel deploys). No Winlerr code modified (except `.gitignore` += `research/` per task instructions). No builds/tests run inside pulled projects. No code integrated. Secrets: none encountered (all `.env.example` values empty).

## Executive Summary

- **Best functional match: wanie (MIT)** — an AI messaging CRM (WhatsApp + Telegram) with provider adapters (OpenAI/Anthropic/Ollama/OpenRouter), guarded auto-reply, knowledge grounding, and a Meta Official API path. Directly informs Winlerr `whatsapp-agent`, `lead-response`, and `packages/ai`. Caveats: single-tenant (no org isolation), no tests, and its default WhatsApp transport (`whatsapp-web.js` QR automation) is a Meta-ToS ban risk — use the Official API path only.
- **Best stack match: saas-starter-kit (MIT + paid Commercial license)** — Next.js + TypeScript + Supabase Auth + Prisma + Tailwind/shadcn + Stripe, with Organizations, RBAC, API keys, and usage tracking. Closest to Winlerr's stack, but commercial use by a for-profit company requires a paid tier per its own `COMMERCIAL_LICENSE.md`, its README contradicts that file, it needs Node ≥24 (Winlerr pins 22), and tenancy is app-layer Prisma, not Supabase RLS.
- **Best AI-platform reference: synkora-ai (MIT)** — Python FastAPI + Celery + Next.js; LiteLLM routing, token-usage metering, credits/subscriptions, rate-limit and permissions middleware. Patterns only (Python cannot be imported into the TS monorepo).
- **Best agent-protocol reference: hecate (MIT, alpha)** — LiteLLM + MCP/A2A + OpenAI-compatible API, Org→Workspace→RBAC, budgets/quotas/model pricing, event-sourced execution with HITL approvals. Ideas, not code (Python, alpha APIs, 60+ models of scope).
- **Do-not-copy: frappe/crm (AGPL-3.0)** — strong copyleft; any copied code would force source disclosure of Winlerr's private repo. Use for CRM UX ideas only (all-in-one lead page, Kanban, custom views).
- Net recommendation: port wanie's AI-adapter + auto-reply-guard patterns to TypeScript first (`packages/ai`), borrow saas-starter-kit's org/RBAC shapes only if the commercial license is purchased, and keep everything else as reference.

## Tier 1 Assessment

### 1. buildproven/saas-starter-kit — `research/tier-1/saas-starter-kit`

- **License:** Dual: `LICENSE` = MIT (BuildProven LLC, 2024) AND `COMMERCIAL_LICENSE.md` requiring paid tiers for "Commercial SaaS products, client projects, products generating revenue, white-label deployments" and use "internally by a for-profit company". `README.md:42` simultaneously claims "MIT … Free for personal and commercial use" — direct contradiction with `COMMERCIAL_LICENSE.md:20-26`. Treat as **commercial-license-required** until clarified in writing.
- **Stack:** Next.js 16.3.5 App Router + TypeScript 5 + React 19; PostgreSQL via Prisma 7 (`prisma/schema.prisma`, `prisma.config.ts`); Supabase Auth (Google/GitHub/email) via `@supabase/ssr` + `supabase-js`; Tailwind v4 + shadcn-style primitives (Radix, `class-variance-authority`); Stripe billing; Sentry; Zustand; Zod 4. Package manager npm (`package-lock.json`), Node `>=24.18.0 <25` (`package.json:200-206`).
- **Multi-tenancy:** App-layer via Prisma: `Organization`, `OrganizationMember` (+ `OrganizationRole`, `OrganizationStatus`), `Project`, `ApiKey`, `UsageRecord`, `Plan/Subscription`. No `ROW LEVEL SECURITY` / RLS found in `src/**` or schema (grep for `row.?level|RLS` hit only Supabase Auth client usage). Enforcement is proxy + server-action checks, not DB policy.
- **Auth:** Supabase Auth sessions (`src/hooks/use-auth.ts`, `src/lib/supabase/client`), role-aware proxy (`src/proxy.ts`: `USER`, `ADMIN`, `SUPER_ADMIN`), API keys (`src/app/api/api-keys`), usage records. No service-role exposure found in frontend paths surveyed.
- **AI abstraction:** None — no `openai`/`anthropic`/`langchain` deps, no LLM files. Not an AI reference.
- **Integration points:** REST API routes (`src/app/api/*`: admin, api-keys, auth…), Stripe webhooks (`StripeWebhookEvent`, checkout/portal helpers), Sentry, `landing-page.html` static page.
- **Deployment:** No `Dockerfile`/`docker-compose*`/`vercel.json`/`render.yaml` present; standard `next build/start` (Vercel-compatible by convention, not configured).
- **Dependencies:** Heavy but JS-only: Prisma 7, Next 16, Tailwind 4, Sentry, Stripe. **Conflict:** Node ≥24 vs Winlerr Node 22; npm vs pnpm; Prisma-vs-Supabase data layer.
- **Code quality:** Vitest + Testing Library + Jest + Playwright (`vitest.config.ts`, `jest.config.js`, `playwright.config.ts`), ESLint security plugin, Semgrep, Gitleaks/Trufflehog, Knip, `tsc --noEmit`, GitHub Actions (`ci.yml`, `quality.yml`, `weekly-audit.yml`…). High.
- **Adaptation effort: Medium.** Closest stack overlap, but license cost + Node conflict + Prisma/RLS impedance.
- **Extract (if licensed):** `prisma/schema.prisma` org/member/role/API-key/usage shapes (as design reference for Supabase tables + RLS); `src/proxy.ts` RBAC pattern; shadcn-style primitives; Stripe webhook/idempotency handling; Zod env validation (`src/lib/env.ts`); `landing-page.html` structure.
- **Avoid:** Wholesale template copy (license + Node 24 + Prisma-as-primary-DB conflicts with Winlerr RLS-first tenancy); `template-download`/`template-purchase` self-referential sales code.

### 2. getsynkora/synkora-ai — `research/tier-1/synkora-ai`

- **License:** `LICENSE` = MIT (Synkora Contributors, 2025). Clean.
- **Stack:** Python FastAPI (`api/`, async) + Celery + Celery Beat + Redis + PostgreSQL (Alembic `api/migrations/`) + Next.js 15 web (`web/`, pnpm 9) + Flutter app + Helm/K8s (`helm/`, `k8s/`), Docker Compose. Python `pyproject.toml` includes `litellm`, `openai`, `anthropic`.
- **Multi-tenancy:** First-class: `tenant.py`, `role.py`, `role_permission.py`, `permission.py`, `team_invitation.py`, SAML (`saml_config.py`), Okta (`okta_tenant.py`), SCIM (`scim_membership.py`, `scim_token.py`), `tenant_subscription.py`, `tenant_portal.py`. Enterprise SaaS model.
- **Auth:** JWT (`auth_middleware.py`, `agent_api_auth.py`, `widget_auth.py`), permissions middleware, API keys (`agent_api_key.py`, `voice_api_key.py`), OAuth/social, token blacklisting (per ARCHITECTURE.md), plan-restriction + credit middlewares, rate limiting.
- **AI abstraction:** LiteLLM routing + OpenAI + Anthropic SDKs; `agent_llm_config.py`, `llm_token_usage.py` (metering), `agent_tool.py`, `agent_tool_call_log.py`, `agent_mcp_server.py`, `custom_tool.py`, A2A tasks, seed agents. Credit system: `credit_balance/top-up/transaction.py` + `agent_pricing.py` + `agent_revenue.py`.
- **Integration points:** REST + WebSocket (distributed via Redis), Slack/Telegram/WhatsApp bots (`slack_bot.py`, `telegram_bot.py`, `whatsapp_bot.py`), voice/phone (`phone_call.py`, Twilio-style credentials), recall webhooks, monitoring integrations, Paddle + Stripe plan sync.
- **Deployment:** Docker (`Dockerfile`, `Dockerfile.dev`, k6/LLM-proxy variants), `docker-compose.yml`, Helm charts, K8s-native (health probes, cross-pod cache invalidation). Heavy ops.
- **Dependencies:** Python 3.x + Node (web) + Redis + Postgres + K8s — heaviest of Tier 1; Flutter adds a third platform.
- **Code quality:** ARCHITECTURE.md quality report, k6 load tests, pytest (`api/tests/`), Vitest (web), mypy/ruff configs. High.
- **Adaptation effort: Medium (as reference) / High (as code).** Nothing ports directly to TypeScript; value is architectural.
- **Extract (patterns, not code):** credit-balance/transaction metering design → Winlerr billing/usage; `credit_middleware.py` + `rate_limit_middleware.py` + `permissions.py` shapes → `services/api` middleware; LiteLLM + `llm_token_usage` pattern → `packages/ai` routing/metering; agent tool-call log schema → audit logging; bot-worker (consistent hashing, Redis state) → `services/agents` scaling notes.
- **Avoid:** Python code copy, Celery/Redis/K8s/Flutter adoption at this stage, Paddle billing, widget/auth flows tied to FastAPI.

### 3. asepindrak/wanie — `research/tier-1/wanie`

- **License:** `LICENSE` = MIT (asepindrak, 2026). Clean. Note `README.md:15-19` disclaimer: independent project, not affiliated with Meta/WhatsApp — usage must comply with applicable terms.
- **Stack:** JavaScript: Express API (`server/`) + Next.js 15 dashboard (`web/`) + Prisma 6 (`prisma/schema.prisma`) + Socket.IO realtime; Tailwind 3; Zustand; published as global CLI (`bin/openwa.js`, `wanie`/`openwa` bins). Node `>=20` (compatible with Winlerr 22).
- **Multi-tenancy:** None — `User`, `ApiKey`, sessions/chats with no Organization/Workspace/Tenant model (grep for `Organization|Workspace|Tenant|organizationId|workspaceId|tenantId` in schema = 0 hits). Single-workspace CLI assumption throughout. Tenant scoping must be added for any Winlerr use.
- **Auth:** Dual: JWT bearer for dashboard (`auth-service.js`, `auth-config-service.js`, bcrypt) + API keys for agents/integrations (`api-key-service.js`). OpenAPI + Swagger UI + agent README endpoints.
- **AI abstraction:** Best in class here: `server/ai/llm-adapters/` = `openai.js`, `anthropic.js`, `ollama.js`, `openrouter.js` (raw-fetch adapters with retry, e.g. `postOpenAiJson` with `maxAttempts`, retriable-5xx/no-choices logic); `llm-service.js`, `ai-provider-service.js` (DB-backed `AiProvider` model), `embedding-service.js`, `knowledge-service.js` (`KnowledgeDocument` + `KnowledgeChunk`), tool system (`tool-executor.js`, `agent-orchestrator.js`, `agent-service.js`, `assistant-service.js`), transcription (`transcription-service.js`). CRM automation modes per chat (off / draft-only / auto-send) with global → session → chat override priority, debounced replies, abuse cooldown + daily reply limits (`CrmAiSetting`, `CrmSessionAiSetting`, `CrmChatAiSetting`, `CrmAutomationLog`).
- **Integration points:** WhatsApp dual transport — `whatsapp/adapters/wwebjs-adapter.js` (unofficial QR automation) + `whatsapp-meta-service.js` (Official/Meta Cloud API: Phone Number ID, token, verify token, App Secret; webhook at `/api/whatsapp/meta/webhook`); Telegram via `telegraf` (bot + customer channel with admin allowlist); media upload flow (`MediaFile`, `mediaFileId`); `OutboundDeliveryJob` queue; `WebhookDeliveryLog`; `TerminalCommand` approvals.
- **Deployment:** `Dockerfile` + `docker-compose.yml` + `install.sh`/`uninstall.sh`, self-hosted CLI, SQLite-or-Postgres-via-Prisma local-first. No Vercel config; no CI workflows (`.github/workflows` absent); no test files found (Depth-2 search empty).
- **Dependencies:** JS-only, moderate: `whatsapp-web.js`, `telegraf`, `openai`, `@anthropic-ai/sdk`, `socket.io`, `prisma`, `playwright` (browser automation for QR?). No Python/PHP.
- **Code quality:** No tests, no lint/typecheck configs seen, 832-line README (strong docs). Mixed — excellent domain coverage, unverified correctness.
- **Adaptation effort: Medium (highest value).** Most portable patterns for Winlerr's immediate needs, but single-tenancy + no tests + unofficial-WA default require care.
- **Extract:** `server/ai/llm-adapters/*.js` (4 providers → port to TS+Zod in `packages/ai`); `crm-auto-reply-service.js` guard/mode logic → `lead-response`; `outbound-delivery-service.js` queue → `services/workers`; `knowledge-service.js` chunking → RAG grounding; `api-key-service.js` → `packages/auth`; `whatsapp-meta-service.js` + `session-manager.js` shapes → `services/whatsapp` (Official API only); `UserSetting`/automation-log schemas → audit.
- **Avoid:** `wwebjs-adapter.js` (ban risk; Meta ToS); any code assuming single user/workspace (must add `organization_id` + RLS); untested paths (add tests when porting).

## Tier 2 Assessment

### 4. xueyufish/hecate — `research/tier-2/hecate` (reference only)

- **License:** `LICENSE` = MIT (Hecate Team, 2026). Clean. Status Alpha (`0.1.0`, "APIs and config schemas may change").
- **Stack:** Python 3.12+ FastAPI + SQLAlchemy asyncio + asyncpg + Alembic + Redis + `litellm` + `fastmcp`/`mcp` + Typer CLI; Next.js + Tailwind + shadcn web (`web/` with `components.json`, `tailwind.config.ts`, Vitest). Ruff + mypy-strict + pre-commit.
- **Multi-tenancy:** Native enterprise: `models/organization.py`, `workspace.py`, `workspace_member.py`, RBAC + SSO (OIDC/SAML/LDAP) + SCIM v2, audit trail, PII redaction (`enterprise/auth/`: JWT, API-key, vault, crypto).
- **Auth:** JWT + API keys + vault/secret providers, SSO/SCIM, audit (`models/audit.py`, `api_key.py`).
- **AI abstraction:** LiteLLM-centric (`litellm>=1.50.0` + config/preflight/context-shaping code), `model_provider.py` + `model_pricing.py` + `model_cost_budget.py` + `quota.py` + `budget.py` (cost tracking built in), MCP server+client, A2A server+client, OpenAI-compatible API, event-sourced execution (append-only log, checkpoints, replay), HITL approvals, sandboxed tools.
- **Integration points:** MCP + A2A + OpenAI-wire-compatible REST, channels (IM/gateway/management), webhooks, 60+ SQLAlchemy models covering agents, memory, knowledge, skills, evals, traces.
- **Deployment:** `Dockerfile` + `docker/` + `deploy/` + `install.py`/`install.sh`, self-hosted. CI: `ci.yml`, `docs-check.yml`, `pr-lint.yml`.
- **Dependencies:** Python 3.12+, Redis, Postgres — incompatible with Winlerr TS runtime; scope enormity (agent OS, not an app).
- **Code quality:** Extensive pytest suites (`tests/test_*`, incl. auth/enterprise/migrations/layering), mypy strict, ruff. High (alpha caveat).
- **Adaptation: High effort / reference value.** Take ideas, not code.
- **Extract (ideas):** LiteLLM + pricing/quota/budget tables → `packages/ai` cost tracking; MCP/A2A/OpenAI-compat shape → `services/agents` API design; event log + replay + HITL → automation audit; Org→Workspace→member model → tenancy ADR input.
- **Avoid:** Python engine copy, 60-model schema import, alpha APIs, self-hosted-ops adoption.

### 5. frappe/crm — `research/tier-2/crm` (reference only)

- **License:** `LICENSE` = **AGPL-3.0** (34KB). Strong network copyleft: running modified versions over a network requires offering Corresponding Source. **Do not copy any code into Winlerr's private repo.** UX-study only.
- **Stack:** Frappe framework (Python) backend (`crm/` app: `api`, `automation`, `integrations`, `lead_syncing`, `permissions`, `templates`, `patches`) + MariaDB/Postgres + Vue 3 + Vite + `frappe-ui` + Pinia + TipTap + Twilio voice SDK + Socket.IO. Node `^20.19 || >=22.12` for frontend tooling; `yarn.lock`.
- **Multi-tenancy:** Frappe sites model (framework-level site isolation) — different paradigm from row-level multi-tenancy; not transferable to Supabase RLS.
- **Auth:** Frappe session auth + `crm/permissions`, role-based doctypes. Not portable.
- **AI abstraction:** None found — traditional CRM, no LLM layer.
- **Integration points:** `integrations/`, `lead_syncing/`, `domain_enrichment/`, Twilio voice, PWA, realtime via Socket.IO.
- **Deployment:** `docker/` + Frappe bench/Docker, Frappe Cloud-oriented. Full CI (`frontend-tests`, `server-tests`, `migration-test`, `ui-tests`, linters).
- **Dependencies:** Python + Frappe framework + MariaDB + Vue — entire-stack conflict with Winlerr (Next+React+Supabase).
- **Code quality:** High (mature project, full CI, e2e). Irrelevant for adoption given license.
- **Adaptation: High effort + legally blocked.**
- **Extract (ideas only, never code):** all-in-one Lead/Deal page (activities, comments, notes, tasks consolidated); Kanban with drag-and-drop; custom filtered/sorted views; `lead_syncing`/`automation` module layout as feature checklist for Winlerr `crm`.
- **Avoid:** All code (AGPL), Frappe framework, Vue components, Twilio-centric voice, site-based tenancy assumptions.

## Comparison Matrix

| Dimension | saas-starter-kit | synkora-ai | wanie | hecate (ref) | frappe/crm (ref) |
|---|---|---|---|---|---|
| License | MIT + paid Commercial (contradictory docs) | MIT | MIT | MIT (alpha) | **AGPL-3.0 — do not copy** |
| Language | TypeScript | Python + TS (web) | JavaScript | Python + TS (web) | Python + Vue/TS |
| Framework | Next.js 16 | FastAPI + Next 15 | Express + Next 15 | FastAPI + Next.js | Frappe + Vue 3 |
| Database | Postgres + Prisma 7 | Postgres + Alembic | Prisma 6 (local-first) | Postgres + Alembic | MariaDB/Postgres (Frappe ORM) |
| Auth | Supabase Auth + proxy RBAC + API keys | JWT + API keys + SAML/Okta/SCIM | JWT + API keys | JWT + API keys + SSO/SCIM + vault | Frappe sessions + roles |
| Multi-tenancy | Org/Member app-layer (no RLS) | tenant.py + teams (app-layer) | **None (single-user)** | Org→Workspace app-layer | Frappe sites (N/A) |
| AI abstraction | None | LiteLLM + OpenAI/Anthropic + metering | 4 raw adapters + KB + guards | LiteLLM + MCP/A2A + budgets | None |
| WhatsApp | No | Bots (WA/TG/Slack) | wwebjs + Meta Official API + TG | No (IM channels generic) | No (Twilio voice) |
| CRM depth | Billing/entities only | Agent marketplace | Messaging CRM + AI workspace | N/A (agent OS) | Full CRM (leads/deals/Kanban) |
| Tests/CI | Vitest+Jest+Playwright, full CI | pytest+k6+Vitest, K8s CI | None found | pytest (extensive) + Vitest, CI | Server+e2e+UI tests, full CI |
| Deploy | Next build (unconfigured) | Docker/Helm/K8s | Docker Compose / CLI self-host | Docker/self-host | Docker/Frappe Cloud |
| Node compat | ≥24 (conflict) | web only | ≥20 (OK) | web only | frontend ≥22.12 (OK) |
| Adaptation | **Medium** | Medium (patterns) | **Medium (highest value)** | High (ideas) | High + blocked |

## Recommended Adaptations

| Winlerr component | Source project | Extract (port, don't paste) | Avoid |
|---|---|---|---|
| `packages/ai` | wanie → `server/ai/llm-adapters/*.js`, `llm-service.js`, `ai-provider-service.js` | 4-provider adapter interface + retry semantics + `AiProvider` config shape, rewritten in TS with Zod schemas and `bypassRls`-safe server-only keys | Raw JS copy; API keys client-side; wanie's single-user assumptions |
| `packages/ai` (metering) | synkora-ai → `llm_token_usage.py`, `agent_pricing.py`; hecate → `model_pricing.py`, `model_cost_budget.py`, `quota.py` | Token-usage + pricing + quota table shapes → Supabase tables + `packages/ai` cost helpers | Python code; LiteLLM dependency (TS port uses direct SDKs) |
| `services/agents` | hecate (MCP/A2A/OpenAI-compat, event log + replay + HITL); synkora-ai (`agent_tool_call_log.py`, bot worker) | API shapes + approval/audit-log design → `services/agents` + `audit_log` table | Python engine; 60-model schema; alpha APIs |
| `services/whatsapp` (new) | wanie → `whatsapp-meta-service.js`, `session-manager.js`, `outbound-delivery-service.js` | Official-API device/session/delivery-queue design on Meta Cloud API webhooks | `wwebjs-adapter.js` (ban risk); QR-pairing flows |
| `apps/lead-response` + `crm` (future) | wanie → `crm-auto-reply-service.js`, `knowledge-service.js`; frappe/crm (ideas) | Draft/auto-send/off modes + override priority + cooldowns + KB grounding; all-in-one lead page + Kanban as UX spec | wanie's untested code paths; any frappe code (AGPL) |
| `packages/auth` + `packages/database` | saas-starter-kit → `Organization/OrganizationMember` schema, `proxy.ts` RBAC, Zod env; synkora-ai → permissions/rate-limit middleware shapes | Table/role shapes translated to Supabase + RLS policies (DB-enforced, not app-only) | Prisma-as-primary; app-only enforcement; Node 24 |
| `apps/web` + `dashboard` | saas-starter-kit → shadcn primitives, `landing-page.html` structure; hecate `web/` (shadcn + Tailwind) | Component/Token patterns for `packages/ui` + landing sections | Whole-template copy (saas commercial terms); Python web code (none — both TS) |
| `services/api` | synkora-ai middleware; wanie `api-key-service.js` + OpenAPI output | Rate-limit/permissions/credit middleware order; agent-facing OpenAPI docs | FastAPI code; JWT-secret handling without rotation |

## License Risk Summary

1. **saas-starter-kit dual-license contradiction (HIGH).** `COMMERCIAL_LICENSE.md` demands paid tiers for any revenue-generating or for-profit-internal use (Winlerr qualifies); `README.md:42` claims MIT covers commercial use. Do not extract anything beyond ideas without written clarification or a purchased license; the "no competing boilerplate" clause could arguably brush against Winlerr OS.
2. **frappe/crm AGPL-3.0 (BLOCKING).** Network copyleft — any derivative running for users must offer full Corresponding Source. Zero code may enter Winlerr's private repo. UX reference only.
3. **wanie Meta-compliance (MEDIUM, non-license).** MIT is clean, but its default `whatsapp-web.js` QR automation violates Meta's terms and risks number bans — a Zambia-market operational risk. Use Official API path only; budget for Meta template/24h-window constraints.
4. Clean: synkora-ai (MIT), hecate (MIT) — attribution only. Note hecate's alpha status is a stability risk, not a license risk.

## Open Questions

1. Will Winlerr purchase the saas-starter-kit commercial license, seek written MIT clarification, or restrict use to ideas-only?
2. WhatsApp transport decision: Meta Official API exclusively (recommended) vs QR automation for onboarding ease (banned-risk)?
3. Prisma vs Supabase-native data layer for ported schemas — translate to RLS-first SQL at port time (recommended) or keep Prisma?
4. Node 22 vs 24: adopt saas patterns requiring Node 24 features, or stay on Winlerr's Node 22 pin?
5. Python references (synkora/hecate): TS ports owned by whom, and is LiteLLM-equivalent routing built in-house in `packages/ai`?
6. CRM scope: messaging-CRM depth (wanie) vs sales-pipeline depth (frappe) — which does Winlerr `crm` target first?
7. Billing provider for Zambia (M-Pesa/Airtel vs Stripe/Paddle in references) — none of the references cover mobile money.

## Next Steps

1. **Spike (time-boxed, `fix/` branch): port wanie's 4 LLM adapters to TypeScript** behind `packages/ai`'s `Provider/ChatMessage/ChatOptions` contract with Zod validation, server-only keys, and tests — replaces the throwing stub with the highest-leverage clean-MIT piece.
2. Resolve saas-starter-kit licensing in writing before extracting anything beyond ideas.
3. ADR: WhatsApp Official-API-only transport + tenant-scoped sessions/delivery tables (RLS-first, using saas org shapes as input).
4. ADR: cost-tracking tables (`model_pricing`, usage logs, quotas) informed by hecate/synkora shapes.
5. Keep `research/` gitignored and uncommitted; re-run this assessment only if shortlisting replacements (e.g. mobile-money billing references).

*Evidence: paths and line numbers above were read directly from shallow clones on 2026-09-24. No builds/tests executed. License texts quoted from `LICENSE`/`COMMERCIAL_LICENSE.md` heads. UNVERIFIED: runtime behavior of all five projects; saas-starter-kit deploy target (no config found); wanie test coverage beyond Depth-2 search.*
