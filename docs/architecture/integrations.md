# Integration Architecture — Winlerr

- **Status:** Current Plan
- **Package:** `@winlerr/integrations` (sole provider-specific surface)
- **Related:** `docs/architecture/api-architecture.md`, `docs/architecture/security.md`, `@winlerr/ai`

## 1. Principle

> Application → Winlerr Integration Interface → Provider Adapter → External API

No provider-specific logic scattered across apps. Every external system is behind `@winlerr/integrations` with a typed adapter.

## 2. Adapter Model

```
apps/* ──► @winlerr/integrations
               ├─ whatsapp/ (WhatsApp Business API)
               ├─ email/    (Resend/Postmark)
               ├─ calendar/ (Google Calendar, future)
               ├─ payments/ (Stripe, future)
               ├─ cms/...
               └─ shared: http client, retry, webhook verifier, idempotency
```

Each adapter:

```ts
export interface WhatsAppAdapter {
  sendMessage(to: string, body: string, orgId: string): Promise<{ messageId: string }>;
  verifyWebhook(signature: string, body: Buffer): boolean;
}
export function createWhatsAppAdapter(config: { accessToken: string; phoneNumberId: string }): WhatsAppAdapter;
```

- **Config** from env (server-only: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`) — never in Git, per AGENTS.md.
- **Auth**: adapters attach Bearer/API key, HMAC signature where required.
- **Scope**: every call takes `organization_id` and logs audit entry.

## 3. Webhook Handling

All inbound webhooks go through the same path (initially a Route Handler, later Supabase Edge Function if needed):

```
POST /api/webhooks/:provider
  1. verify signature (HMAC, timing-safe compare)
  2. Zod validate payload
  3. idempotency check (dedup by provider message id / X-Idempotency-Key)
  4. 200 fast (queue work, don’t block)
  5. background worker processes (via @winlerr/automation)
```

Rules (per AGENTS.md): treat payload as untrusted, verify, validate, idempotently handle retries, never log secrets.

## 4. Reliability

- **Retries**: exponential backoff with jitter (provider adapter handles 429/5xx); caller handles 429 rate-limit response.
- **Errors**: shared `{ error: { code, message } }` plus provider code; never leak raw provider stack to client.
- **Timeouts**: per-provider (e.g., WhatsApp 10s); circuit breaker as Proposal when integration instability observed.
- **Secrets**: env-only, rotation via dashboard; no `SUPABASE_SERVICE_ROLE_KEY` exposure.

## 5. What the Repo Has Today

- `@winlerr/integrations/src/index.ts` placeholder `export const placeholder`; `@winlerr/automation` placeholder; `@winlerr/notifications` placeholder.
- No real WhatsApp/email/calendar wiring — correct (do not build prematurely).

## 6. Future Systems (planned but not scattered)

| Integration | Adapter | Webhook | Env |
|-------------|---------|---------|-----|
| WhatsApp Business | whatsapp adapter | /api/webhooks/whatsapp | WHATSAPP_* |
| Email | email adapter | /api/webhooks/email (for inbound) | RESEND_API_KEY |
| Calendar | calendar adapter | — | GOOGLE_* |
| Payments | payments adapter | /api/webhooks/stripe | STRIPE_* |
| CRM third-party | crm adapter | — | per provider |

All behind `@winlerr/integrations` interface; apps never import provider SDK directly (same rule as `@winlerr/ai`).

## 7. Next Step

When first integration (WhatsApp) is needed, implement `whatsapp` adapter with `sendMessage` + `verifyWebhook` + idempotency table (scoped by organization_id) and wire a Route Handler under `apps/whatsapp-agent`.
