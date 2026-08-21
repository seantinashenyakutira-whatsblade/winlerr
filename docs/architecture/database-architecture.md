# Database Architecture — Winlerr

- **Status:** Current Plan (establishes model, no full schema yet)
- **Platform:** Supabase / PostgreSQL (ADR 0003)
- **Related:** ADR 0004 (auth model), `infrastructure/supabase/`, `packages/database`, `docs/architecture/security.md`

## 1. Principles

- Multi-tenant by design: every business/client lives in an `organization`. No data leaks across organizations.
- **RLS is the primary isolation boundary** — application scoping is defense-in-depth, RLS is the gate.
- Migrations-only: `infrastructure/supabase/migrations/<timestamp>_<name>.sql`, committed, reviewed, reversible. No dashboard mutation without a migration.
- Types via `@winlerr/database`; no raw SQL sprinkled without helpers.

## 2. Domain Shape

```
Platform (Winlerr itself — provider)
  └─ organization  (tenant: a business/client)
      ├─ users  (Supabase auth.users, global)
      ├─ memberships  (user ↔ organization, role)
      ├─ roles / permissions
      ├─ products  (which Winlerr products this org uses)
      ├─ product data  (leads, bookings, contacts, conversations, etc. — all scoped by organization_id)
      └─ audit_log (who did what, when, in which org)
```

### 2.1 Core Tables (planned, not yet migrated)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `organizations` | Tenant identity | `id uuid pk`, `name`, `slug unique`, `created_at`, `owner_user_id fk` |
| `users` | Supabase `auth.users` (managed) | `id uuid pk` (FK to auth), `email` |
| `memberships` | User ↔ org, role | `user_id fk auth.users`, `organization_id fk`, `role text`, `created_at`; PK `(user_id, organization_id)` |
| `roles` / `permissions` | RBAC | `role`, `permission` (e.g., `lead:read`), seed table; apps check `hasPermission(membership, permission)` |
| `products` | Org entitlements | `organization_id fk`, `product text` (crm, booking, lead-response, whatsapp-agent), `enabled bool` |
| `audit_log` | Auditability | `id uuid`, `organization_id fk`, `actor_user_id fk`, `action text`, `resource_type`, `resource_id`, `metadata jsonb`, `created_at` |

> Product data (e.g., `leads`, `bookings`, `contacts`, `conversations`) not modeled here — each product will own its tables, all with `organization_id uuid not null references organizations(id)`.

### 2.2 Example product tables (illustrative, not yet created)

```sql
-- all product tables follow this shape
create table leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by uuid references auth.users(id),
  payload jsonb not null,
  created_at timestamptz default now()
);
-- every table gets RLS + index on organization_id
```

## 3. Tenant Isolation

1. **Application layer**: all queries include `.eq("organization_id", currentOrgId)` via `@winlerr/database` helpers. Helper enforces presence of org context — query without org throws.
2. **RLS layer** (Postgres): per table policy:

```sql
alter table leads enable row level security;
create policy "org-isolation" on leads
  for all
  using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );
-- service_role bypasses RLS; anon/authenticated do not
```

Admin/service clients (`SUPABASE_SERVICE_ROLE_KEY`) bypass RLS — server-only, never exposed.

## 4. AuthN vs AuthZ

- **AuthN** (Supabase Auth) proves `auth.uid()` is who they say they are.
- **AuthZ** (membership + role + permission) proves they may access `organization_id` and action. Enforced server-side in Route Handlers via `@winlerr/auth` (`requireMembership`, `requirePermission`) and reinforced by RLS.

See `docs/architecture/authentication.md` and ADR 0004.

## 5. Migrations

- Location: `infrastructure/supabase/migrations/` as `<YYYYMMDDHHMMSS>_<name>.sql`
- Workflow: branch → write migration → `supabase db push` locally → test RLS with `auth.uid()` → PR review → merge to `develop` → staging auto-applies → promote to `main` → production.
- Data migrations: separate `data_migrations/` or reversible `up/down` scripts; reviewed, tested on staging, logged in `audit_log`.

## 6. What is NOT built yet

- No production schema beyond placeholder `infrastructure/supabase/config.toml`. No `leads`/`bookings` tables yet — intentionally. First real migration will be `organizations` + `memberships` + `audit_log`.
- No partition strategy — premature. Postgres can handle Winlerr’s early scale without partitioning; revisit at >10M rows/table or per-tenant bulky history.
- No read replicas / pgBouncer tuning — handled by Supabase defaults.

## 7. Next Steps (Current Plan)

1. Product/HQ review of org/membership/role model (ADR 0004 open questions).
2. First migration: `organizations`, `memberships`, seed `roles`, `audit_log` with RLS.
3. `@winlerr/database` helpers: `createBrowserClient`, `createServerClient`, `createAdminClient`, `withOrganization` wrapper.
