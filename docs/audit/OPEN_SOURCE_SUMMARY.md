# Winlerr — Open-Source Summary (one page)

> Full report: `docs/audit/OPEN_SOURCE_ASSESSMENT.md`. All 5 cloned read-only into `research/` (gitignored, uncommitted). No builds run. No code integrated.

## Cloned (5/5)

- Tier 1: `buildproven/saas-starter-kit`, `getsynkora/synkora-ai` (fetch-resumed after stall), `asepindrak/wanie` (retry after transient `Empty reply`).
- Tier 2: `xueyufish/hecate`, `frappe/crm`. No failures outstanding.

## Top 3 to adapt

1. **wanie (MIT)** — AI messaging CRM whose LLM adapters (OpenAI/Anthropic/Ollama/OpenRouter), guarded auto-reply modes, knowledge grounding, and Meta Official API service port directly to `packages/ai`, `lead-response`, and a new `services/whatsapp`.
2. **saas-starter-kit (MIT + paid Commercial)** — only if licensed: org/member/RBAC schema shapes, proxy-RBAC pattern, shadcn primitives, and Stripe webhook handling for `packages/auth`, `packages/database` (as RLS), and `packages/ui`.
3. **synkora-ai (MIT, patterns only)** — credit metering, rate-limit/permission middleware order, and LiteLLM + token-usage design for `packages/ai` metering and `services/api` middleware (Python — rewrite, don't copy).

## Top 3 license risks

1. **saas-starter-kit dual-license contradiction** — `COMMERCIAL_LICENSE.md` requires paid tiers for revenue/for-profit use while `README.md:42` claims MIT covers commercial use. Ideas-only until clarified or purchased.
2. **frappe/crm AGPL-3.0** — network copyleft; zero code may enter the private repo. UX reference only.
3. **wanie WhatsApp compliance** — MIT is clean, but default `whatsapp-web.js` QR automation risks Meta bans; Official API path only.

## Top 3 integration risks

1. **Prisma vs Supabase RLS** — saas/wanie tenancy is app-layer Prisma; Winlerr enforces tenancy in DB policy. Every ported schema must be translated to RLS-first SQL.
2. **Python walls** — synkora/hecate value is patterns-only; TS rewrites cost real effort (esp. LiteLLM routing, MCP/A2A).
3. **Single-tenancy + no tests in wanie** — every adapted module needs `organization_id` scoping and new tests; untested paths must not ship as-is.

## Recommended immediate next task

**Time-boxed spike on a `fix/` branch: port wanie's 4 LLM adapters to TypeScript** behind `packages/ai`'s existing `Provider/ChatMessage/ChatOptions` contract (Zod-validated, server-only keys, tested) — it replaces the throwing stub with the highest-leverage clean-MIT piece and unblocks `lead-response` drafting next.
