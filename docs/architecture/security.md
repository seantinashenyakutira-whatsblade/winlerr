# Security Architecture — Winlerr

- **Status:** Current Plan (baseline documented, enforcement incremental)
- **Related:** `AGENTS.md`, `docs/architecture/database-architecture.md`, `docs/architecture/authentication.md`, `docs/decisions/0003-supabase-postgresql.md`

## 1. Boundaries (at minimum)

### Secrets & Env
- Never hardcode secrets; never commit `.env` (`.env.example` has empty placeholders, verified).
- `.env` gitignored (`.gitignore:16`), production secrets in Vercel / Supabase / Cloudflare dashboards or secret manager — never in Git.
- `NEXT_PUBLIC_*` is client-exposed; `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `WHATSAPP_*`, `CLOUDFLARE_*` are server-only. Verified: no leaked token via grep.

### Authentication & Authorization
- AuthN: Supabase Auth (session, JWT, password recovery, OAuth-ready).
- AuthZ: membership + role + permission, org-scoped; server-side `requireUser` / `requireMembership` / `requirePermission` via `@winlerr/auth`.
- Client checks are UX hints; server re-checks every privileged operation.

### Tenant Isolation
- Every product table has `organization_id uuid not null`. App queries scoped by org; **RLS policies per table** enforce `organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())`. `service_role` bypasses RLS — server-only.

### Database
- Migrations-only (`infrastructure/supabase/migrations/`); no dashboard prod mutation without committed migration. Data migrations reviewed, reversible, tested on staging.
- RLS considered core boundary, not optional (see `database-architecture.md`).

### API Validation & Error Handling
- All inputs validated via Zod before use (body, query, headers, webhook payloads).
- Shared error shape `{ error: { code, message } }`, appropriate HTTP status, no stack leaks in production.

### Webhooks
- Treat as untrusted: verify HMAC signature (timing-safe), Zod-validate, idempotent retry handling, 200 fast then queue.

### Rate Limiting
- Public endpoints have auth + rate limiting (per-route, per-org, per-ip). Webhooks idempotent.

### Logging & Audit
- Do not log secrets/PII. Redact tokens. `audit_log` table (organization_id, actor_user_id, action, resource) for privileged actions and AI tool calls.

### AI Tool Permissions
- Tools require explicit Zod schemas and bounded side effects. Agents have scoped permissions; AI writes to DB/external/customer require human approval or tightly-scoped policy. All tool calls audited (see `ai-architecture.md`).

### Service-Role Credentials
- `SUPABASE_SERVICE_ROLE_KEY` is server-only; clients use `NEXT_PUBLIC_SUPABASE_ANON_KEY` + RLS. Never expose service-role to browser.

## 2. Current Posture (Foundation)

- **Documented**: AGENTS.md §2-§5 locks the rules; architecture docs reinforce them.
- **Implemented**: `.env` ignorance, client/server key separation in `.env.example`, placeholder packages ready to host enforcement.
- **Not yet enforced in code** (no real tables/policies yet) — correct; first migration will add RLS.

## 3. What is NOT claimed

- No specific regulatory framework (SOC2, GDPR, HIPAA) claimed — not required at this stage. When needed, add evaluation and recertify.

## 4. Next Steps

1. First migration creates `organizations`, `memberships`, `audit_log` with RLS policies and indexes.
2. `@winlerr/auth` implements `require*` guards; `@winlerr/database` enforces org scoping.
3. Webhook adapter adds HMAC verifier + idempotency table scoped by org.
4. Add protected CI check: `grep -r SUPABASE_SERVICE_ROLE_KEY --include="*.ts" | grep -v "server"` must not expose to client bundle (future CI Proposal).
