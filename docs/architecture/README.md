# Architecture — Winlerr

This directory holds architecture documentation.

- **System overview:** `system-overview.md` — Mermaid map, repository structure, app/package/service boundaries, DB, deployment, AI.
- **Repository audit:** `repository-audit.md` — existing/missing/incorrect/unnecessary/recommended (baseline 275d221).
- **Platform contracts:** `platform-contracts.md` — executable contracts (config, result/error, database, auth, AI, integrations) and deferred automation/notifications.
- **Database:** `database-architecture.md` — tenant model, RLS, migrations.
- **Authentication:** `authentication.md` — authN (Supabase Auth) vs authZ (membership/RBAC).
- **API:** `api-architecture.md` — Route Handlers vs dedicated service (modular monolith).
- **AI:** `ai-architecture.md` — provider abstraction, tools, MCP, agents.
- **Integrations:** `integrations.md` — adapter pattern, webhooks, retries.
- **Security:** `security.md` — secrets, RLS, validation, webhooks, audit trails.
- **ADRs:** `../decisions/` — numbered Architectural Decision Records (0001–0005).

Update `system-overview.md` whenever repository structure, service boundaries, or deployment strategy changes materially. Keep the Mermaid diagram in sync.
