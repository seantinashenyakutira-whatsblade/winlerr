# Integrations — Winlerr

Integration guides and contracts for external systems.

| Integration | Status | Docs |
|-------------|--------|------|
| Supabase | Platform foundation | `infrastructure/supabase/` |
| Vercel | Deployment | `infrastructure/vercel/` |
| Cloudflare | DNS / Edge | `infrastructure/cloudflare/` |
| WhatsApp Business API | Planned | — |
| OpenAI / Anthropic | Planned (via `packages/ai`) | — |

Add a doc per integration when its contract is established. Include auth flow, webhook verification, rate limits, and example payloads.

> Secrets for integrations are stored in environment variables (see `.env.example`) and in hosting provider secret managers — never in Git.
