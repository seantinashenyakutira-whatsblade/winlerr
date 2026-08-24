# Platform Contracts — Winlerr

- **Status:** Established (for contracts below) + Proposal/Deferred where noted
- **Branch:** `feature/platform-contracts` (from `develop` 275d221)
- **Related:** `docs/architecture/system-overview.md`, `AGENTS.md`, `docs/development/README.md`

## 1. Purpose

Convert the documented architecture (Phase 1) and developer experience (Phase 2) into a **small set of executable technical contracts** that future Winlerr products can safely build on. The contracts provide **stable interfaces** so applications do not directly couple to Supabase, OpenAI, WhatsApp, etc.

> Applications → Platform Contracts → Business Logic → Infrastructure / External Providers

This PR does **not** implement a Winlerr product. It establishes reusable boundaries.

## 2. Package Boundaries

| Package | Import | Purpose | Status |
|---------|--------|---------|--------|
| `@winlerr/config` | `packages/config` | Runtime env validation + shared Result/Error convention + build presets | **Established** |
| `@winlerr/database` | `packages/database` | Supabase/PostgreSQL boundary, typed client factories, server/client separation | **Established** (interface only, no real tables) |
| `@winlerr/auth` | `packages/auth` | AuthN vs AuthZ types + pure guards (User/Org/Membership/Role/Permission) | **Established** |
| `@winlerr/ai` | `packages/ai` | Provider-agnostic AI interface (request/response/tools/usage) | **Established** |
| `@winlerr/integrations` | `packages/integrations` | Provider-independent integration adapter convention + webhook concepts | **Established** |
| `@winlerr/automation` | `packages/automation` | Workflow primitives | **Deferred — Proposal** (n8n remains R&D) |
| `@winlerr/notifications` | `packages/notifications` | Multi-channel notifications | **Deferred — Proposal** (no validated channel yet) |
| `@winlerr/ui` | `packages/ui` | Shared UI components | **Placeholder** (not in Phase 3 scope) |

## 3. Dependency Direction

```
apps/*  ──→  @winlerr/ui, @winlerr/auth, @winlerr/database, @winlerr/config
services/* ──→  @winlerr/*
@winlerr/ai  ──→  @winlerr/config (Result)
@winlerr/integrations  ──→  @winlerr/config
@winlerr/database  ──→  (none, or @winlerr/config if needed later)
@winlerr/auth  ──→  (pure, no deps)
@winlerr/config  ──→  (lowest, no upward deps)
```

**Rules:**
- `apps/services` may depend on `packages/*`, never the reverse.
- `packages/*` must not import from `apps/*` or `services/*`.
- No circular dependencies.
- Keep dependency tooling minimal — documented here, enforced via review (no enforcement package added).

Examples:

```
apps/web → @winlerr/ui + @winlerr/config
apps/dashboard → @winlerr/ui + @winlerr/auth + @winlerr/database + @winlerr/config
future AI product → @winlerr/ai + @winlerr/database + @winlerr/integrations + @winlerr/auth
```

## 4. Configuration Contract — `@winlerr/config` (Established)

**Files:** `packages/config/src/env.ts`, `result.ts`, `index.ts`

- Validates env with **Zod**, distinguishes **server-only** vs **public** (`NEXT_PUBLIC_*`).
- Server vars: `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `WHATSAPP_*`, `CLOUDFLARE_*` — optional at foundation stage to allow placeholder dev.
- Public vars: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NODE_ENV`.
- Fails clearly: Zod throws with field-level errors (no secrets logged).
- **Never exposes secrets to client:** `loadServerConfig()` throws if `window !== undefined`. `loadPublicConfig()` is safe on client.
- Typed access: `PublicConfig`, `ServerConfig` inferred from Zod.
- **Avoid logging secrets:** `redactConfig()` replaces `KEY/SECRET/TOKEN/PASSWORD/DATABASE_URL` with `[REDACTED]` or `[EMPTY]`.
- Uses optional variables to keep `pnpm dev` working without real credentials.

Tests: `packages/config/src/env.test.ts` (valid, empty optional, invalid URL, redact, isServer), `result.test.ts`.

## 5. Result / Error Contract — `@winlerr/config` (Established)

Shared convention for application/service results:

```ts
type Result<T, E = AppError> = { ok: true; data: T } | { ok: false; error: E };
interface AppError { code: ErrorCode; message: string; details?: unknown; status?: number; }
type ErrorCode = "VALIDATION_ERROR" | "AUTHENTICATION_ERROR" | "AUTHORIZATION_ERROR" | "NOT_FOUND" | "CONFLICT" | "RATE_LIMITED" | "EXTERNAL_SERVICE_ERROR" | "INTERNAL_ERROR";
```

Helpers: `ok()`, `err()`, `isOk()`, `isErr()`, `toHttpStatus()`, `createError()`, `toAppError()`.

This replaces ad-hoc `{ error }` shapes with a typed, consistent model for future apps. No giant enterprise framework.

## 6. Database Contract — `@winlerr/database` (Established, interface only)

**Files:** `packages/database/src/types.ts`, `client.ts`, `index.ts`

- Provides architectural boundary: apps must import via `@winlerr/database`, not scatter Supabase client creation.
- **Typed client factories:**
  - `createBrowserClient({ supabaseUrl, supabaseKey })` — browser, anon key, `bypassRls: false`
  - `createServerClient(config)` — server (Route Handler), anon key, throws on client
  - `createAdminClient(config)` — server-only, service-role, `bypassRls: true`, throws on client
- **No real Supabase SDK imported** at foundation stage — factories return placeholder that throws `Database not wired` when queried. Will be wired to `@supabase/supabase-js` when first migration ships.
- **Placeholder types:** `Database` with `public.Tables` etc., location `src/types.generated.ts` documented for future generation.
- **Conventions:** `organization_id` on every product table, RLS as primary tenant isolation, migrations in `infrastructure/supabase/migrations/`.

**What is NOT implemented:** No production tables, no tenant tables, no migrations for users/orgs/leads/bookings/CRM, no real connection.

Tests: `packages/database/src/client.test.ts` (browser/server/admin factories, missing config, placeholder query, bypass flag) — no credentials required.

## 7. Auth Contract — `@winlerr/auth` (Established)

**Files:** `packages/auth/src/types.ts`, `guards.ts`, `index.ts`

- **AuthN (who you are):** `User { id, email }`, `Session { user, organizationId, membership }` — will map to Supabase Auth when wired.
- **AuthZ (what you can do):** `Organization`, `Membership { userId, organizationId, role }`, `Role = owner|admin|member|viewer`, `Permission = "resource:action"`.
- **Distinction preserved:** Client checks are UX hints; server re-checks via guards + RLS.
- Pure utilities: `hasPermission(membership, permission)`, `isMember(memberships, userId, orgId)`, `getMembership()`, `hasRoleAtLeast()`, `requireOrganizationId()` — no DB, no side effects.
- Final role/permission matrix remains **HQ/Product decision** — placeholder map in `guards.ts` is illustrative, not frozen.

Tests: `packages/auth/src/guards.test.ts` (permission checks, membership, role hierarchy, org id validation) — pure, no credentials.

**Not implemented:** No OAuth, no login/signup pages, no Supabase users, no role-management UI.

## 8. AI Contract — `@winlerr/ai` (Established)

**Files:** `packages/ai/src/types.ts`, `client.ts`, `index.ts`

- Provider-agnostic boundary: `Application → @winlerr/ai → Provider (OpenAI/Anthropic/other)`
- **Request:** `AiRequest { provider?, model?, messages: ChatMessage[], tools?: ToolDefinition[], temperature?, maxTokens?, responseSchema?: ZodType, organizationId? }`
- **Response:** `AiResponse { content, toolCalls?, usage?: { promptTokens, completionTokens, totalTokens }, provider, model, finishReason }`
- **Tools:** `ToolDefinition { name, description, schema: ZodType }`, `ToolCall { id, name, arguments }`
- **Errors:** `AiError { code, message, provider?, retryable? }`
- **Client:** `AiClient { chat(request): Promise<Result<AiResponse, AiError>>, validate(request): { valid, error? } }` — placeholder throws `not wired` until first product needs LLM; `validate` is pure and testable.
- Depends on `@winlerr/config` for `Result`.

**Not built:** Agent orchestration, memory, MCP server/client, production tools, autonomous workflows, vector DB, RAG — future work, n8n handles experimental Lead Response Agent.

Tests: `packages/ai/src/client.test.ts` (valid request, empty messages, tool schema, not-implemented throw, structured output).

## 9. Integration Contract — `@winlerr/integrations` (Established)

**Files:** `packages/integrations/src/types.ts`, `adapter.ts`, `index.ts`

- Provider-independent: `Application → Integration interface → Provider adapter → External API`
- **Providers:** `whatsapp | email | calendar | crm | payments | social | other`
- **Adapter:** `IntegrationAdapter<Config, Request, Response> { provider, validateConfig, execute }` — no real API calls, returns mock success.
- **Error:** `IntegrationError { code, message, provider, retryable? }`
- **Webhook concepts:** `WebhookEvent { provider, eventId, eventType, payload }`, `WebhookVerification { verify(signature, rawBody, secret), isDuplicate, markProcessed }` — documented but not implemented as endpoints.
- Depends on `@winlerr/config` for `Result`.

**Not implemented:** No real WhatsApp/Email/Calendar wiring, no credentials, no external calls.

Tests: `packages/integrations/src/adapter.test.ts` (validate config, success without external call, missing organizationId, provider).

## 10. Automation Contract — Deferred

`@winlerr/automation` remains **Deferred (Proposal)**. `packages/automation/src/index.ts` contains placeholder with comment.

**Reason:** n8n is the R&D/automation platform for experiments; no reusable platform abstraction beyond n8n is validated yet. When justified, contract will define `Workflow, Trigger, Action, ExecutionContext, ExecutionResult` provider-neutral.

## 11. Notification Contract — Deferred

`@winlerr/notifications` remains **Deferred (Proposal)**.

**Reason:** No validated notification channel yet. Future email/WhatsApp/SMS/in-app will be delivered via `@winlerr/integrations` adapters when HQ/Product confirms first channel. Package remains placeholder until then.

## 12. Security Boundaries (Established where implemented, Current Plan otherwise)

- **Secrets never enter client bundles:** `loadServerConfig()` throws on `window`, `NEXT_PUBLIC_*` is only public prefix, `SUPABASE_SERVICE_ROLE_KEY` etc. are server-only.
- **Service-role credentials are server-only:** `createAdminClient` throws on client, `bypassRls` flagged.
- **Config validation does not leak secrets:** `redactConfig()` and Zod errors avoid raw values.
- **AuthN vs AuthZ separate:** `User/Session` vs `Membership/Role/Permission`, server re-check required, RLS planned as final enforcement.
- **Database behind boundary:** `from()` via `@winlerr/database`, not scattered Supabase imports, `organization_id` convention documented.
- **External credentials outside source control:** `.env` gitignored, `.env.example` placeholders only.
- **AI tools not granted arbitrary privileges:** Tools require Zod schemas, bounded, validated via `validate()`, no autonomous writes.
- **Integrations do not expose provider credentials:** Adapters validate config, attach auth internally, never leak to apps.

No security enforcement is claimed beyond what is implemented — labels above distinguish **Established** (code) vs **Proposal** (deferred).

## 13. What Is Implemented

- `@winlerr/config`: env validation (Zod), public/server split, redact, Result/Error convention, tests
- `@winlerr/database`: client factories (browser/server/admin), types placeholder, conventions, tests
- `@winlerr/auth`: User/Org/Membership/Role/Permission/Session types, pure guards, tests
- `@winlerr/ai`: provider-agnostic request/response/tools/usage/errors, placeholder client, tests
- `@winlerr/integrations`: adapter interface, webhook concepts, example adapter, tests
- `@winlerr/automation`: deferred (comment)
- `@winlerr/notifications`: deferred (comment)
- Docs: `docs/architecture/platform-contracts.md` (this file), dependency direction documented

## 14. What Remains Future Work

- Real Supabase wiring and migrations (organizations, memberships, RLS) — after ADR 0004 HQ approval
- Supabase Auth OAuth providers, role/permission matrix, multi-org rules
- AI provider SDKs (openai/anthropic) and `chat()` implementation
- Real integration adapters (WhatsApp, Email, etc.) with HMAC verification and idempotency tables
- Automation workflow engine (if validated beyond n8n)
- Notification channel implementations
- Vector DB / RAG / MCP / agent orchestration
- Production infrastructure (Vercel/Supabase/Cloudflare deployment)
- Product UI (CRM, booking, lead-response, portal, whatsapp-agent)

Every future section will replace a placeholder throw with a real implementation behind the same interface — no architectural rework required.
