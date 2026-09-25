# AI Patterns (reference notes)

> Patterns observed in **synkora-ai** (MIT License, Copyright (c) 2025 Synkora Contributors, https://github.com/getsynkora/synkora-ai). Design notes only — no synkora code is copied or ported here. Paths below refer to the `research/tier-1/synkora-ai` shallow clone.

## 1. Credit metering (credits as a first-class ledger)

- **Source:** `api/src/models/credit_balance.py`, `credit_topup.py`, `credit_transaction.py`, `agent_pricing.py`, `agent_revenue.py`, `llm_token_usage.py`.
- **Pattern:** Every billable event appends an immutable transaction row (balance derived, never mutated in place); pricing lives in its own table so rates change without code deploys; token usage is recorded per call and joined to pricing at query time.
- **Winlerr mapping:** DEFAULT DECISION says metering is bundled into subscription tiers for now with internal usage tracking. Implement as: `packages/ai` `UsageMeter` (done — token accumulation + static pricing) → later a `credit_transactions`-style Supabase table with RLS, priced from the same static table. Keep the ledger append-only from day one.

## 2. Middleware order (auth → permissions → limits → credits)

- **Source:** `api/src/middleware/` — `auth_middleware.py`, `permissions.py`, `rate_limit_middleware.py`, `credit_middleware.py`, `plan_restriction_middleware.py` (plus `agent_api_auth.py`, `widget_auth.py` for non-session callers).
- **Pattern:** Request pipeline is strictly ordered: authenticate identity → resolve permissions → enforce rate limits → check credits/plan → handle. Separate auth entry points exist for sessions vs API keys vs widgets, but all converge on the same permission check.
- **Winlerr mapping:** `services/api` middleware should follow the same order (Supabase session → membership/role check → rate limit → usage check). Dual entry points (dashboard session + agent API keys, as in wanie's `api-key-service`) converge on `packages/auth` guards with RLS as final enforcement.

## 3. LiteLLM-style routing + per-call token accounting

- **Source:** `pyproject.toml` (`litellm`, `openai`, `anthropic` deps), `api/src/models/agent_llm_config.py`, `llm_token_usage.py`.
- **Pattern:** A single routing layer maps logical model names to providers (LiteLLM), while every call records prompt/completion tokens against the agent + model. Routing config and usage facts are separate concerns: config changes routing, facts feed billing.
- **Winlerr mapping:** `packages/ai` `createProvider()` + `resolveDefaultResolution()` is the routing half (env-driven, no LiteLLM dependency — direct fetch adapters keep the TS surface dependency-free); `usage.ts` metering is the accounting half. When provider count grows, add a registry table rather than branching logic.
