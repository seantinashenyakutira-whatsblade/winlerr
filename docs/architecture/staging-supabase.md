# Winlerr Staging Supabase Foundation

- **Status:** Established for the non-production staging project; production remains unconfigured.
- **Date:** 2026-08-26
- **Project:** `Winlerr Staging`
- **Project ref:** `xvwgumawzoqjduvtnlcs`
- **Region:** `eu-west-1`
- **Database engine:** PostgreSQL 17.6.1
- **Environment mapping:** `develop` → staging; `main` → production

## 1. Environment boundary

This project is a dedicated non-production Supabase project for Winlerr staging. It must never receive production customer data, production provider credentials, or production deployment traffic. Phase 5 does not create or configure a production Supabase project.

The non-secret project reference may be recorded in repository documentation. Project URLs and keys must be supplied through environment configuration or the deployment secret manager, never hardcoded into source, tests, generated types, or documentation.

## 2. Environment variables

The existing `@winlerr/config` package remains the environment contract:

| Variable | Boundary | Phase 5 handling |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Staging project URL may be supplied at runtime. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe publishable key | Staging publishable/anon key may be supplied at runtime. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only privileged | Must remain in server/deployment secrets only; never commit or expose to browser code. |
| `DATABASE_URL` | Server-only direct database access | Optional; not required for the repository foundation. |

`.env.example` contains names and empty placeholders only. A local `.env` is gitignored. No staging secret values were added to Git.

## 3. Migration state

The repository’s foundation migration was applied to the empty staging project:

```text
20260824120000_domain_persistence_foundation.sql
→ domain_persistence_foundation (recorded by Supabase at version 20260826100609)
```

A forward-only security-hardening migration was then applied:

```text
20260826101500_staging_security_hardening.sql
→ staging_security_hardening
```

The schema contains only these three public tables, all with zero rows at verification time:

```text
public.organizations
public.memberships
public.audit_log
```

The foundation includes the expected keys, foreign keys, constraints, indexes, timestamps, organization update trigger, RLS enablement, owner-bound organization creation, owner/admin membership creation, and organization-scoped audit logging. No lead, CRM, booking, WhatsApp, agent, conversation, message, payment, subscription, or other product tables are present.

## 4. RLS and helper security

All foundation tables have RLS enabled. RLS policies enforce organization membership and actor scoping. The helper functions are now in the non-exposed `private` schema:

```text
private.is_org_member(uuid)
private.is_org_admin_or_owner(uuid)
private.is_org_owner(uuid)
```

The helpers use `SECURITY DEFINER`, a fixed `search_path = public`, and explicit privileges: anonymous execution is denied and authenticated execution is allowed for policy evaluation. The `public.handle_updated_at()` trigger function also has a fixed `search_path` and is not executable by anonymous or authenticated API roles.

Supabase security advisors were rerun after hardening and returned zero lints. The verified live privilege query returned `anon_execute = false`, `authenticated_execute = true` for all three private helpers, and `anon_execute = false`, `authenticated_execute = false` for the public trigger function.

## 5. Authentication setup

Supabase Auth is available in the staging project. The currently established mechanism is email/password authentication. Phase 5 does not introduce OAuth providers. No staging test user was created because no owner-approved test identity and password were supplied.

Consequently, the following authenticated-user scenarios remain owner/test-environment actions rather than claims made by this repository change:

- an authenticated user creating an organization with `owner_user_id = auth.uid()`;
- an organization owner or owner/admin member creating a membership;
- rejection of unauthorized membership insertion;
- non-member isolation against a populated organization;
- authenticated audit-log insertion with the correct actor.

The live schema, policy definitions, helper privileges, empty initial state, and anonymous boundary were verified without creating user data.

## 6. Runtime verification record

| Check | Result | Evidence or limitation |
|---|---|---|
| Project health | PASS | Project status `ACTIVE_HEALTHY`. |
| Migration history | PASS | Foundation and security-hardening migrations recorded. |
| Foundation table inventory | PASS | Exactly three public tables; all empty at verification. |
| RLS enabled | PASS | `organizations`, `memberships`, and `audit_log` report RLS enabled. |
| Policy definitions | PASS | Live `pg_policies` query shows organization, membership, and audit policies. |
| Anonymous table reads | PASS with empty-state limitation | REST reads returned HTTP 200 for empty tables; no rows were exposed. Authenticated row-level behavior needs a test user and populated fixtures. |
| Helper privileges | PASS | Anonymous execution denied; authenticated execution allowed; fixed search paths verified. |
| Security advisors | PASS | Zero security lints after hardening. |
| Owner/admin positive and unauthorized negative flows | BLOCKED | Requires an approved staging test identity and authenticated session. |
| Service-role behavior | PARTIAL | Repository code keeps the service-role key server-only; no service-role runtime test was performed because no secret was introduced. |

## 7. Generated database types

Types were generated from the live staging schema and checked into `packages/database/src/types.generated.ts`. The generated output contains only public schema metadata for the three foundation tables and their public relationships/functions; it contains no secrets or credential values.

The repository-facing aliases in `packages/database/src/types.ts` now derive from the generated schema while preserving the existing `OrganizationRow`, `MembershipRow`, `MembershipRole`, `AuditLogRow`, and `OrganizationScoped` exports.

For future reviewed migrations, regenerate reproducibly with a staging-authorized Supabase CLI session:

```bash
supabase gen types typescript --project-id <STAGING_PROJECT_REF> --schema public > packages/database/src/types.generated.ts
```

Then run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `git diff --check`. Never generate against production during development and never commit credential values.

## 8. Phase 5 blockers and deferrals

Production remains blocked by the final role/permission matrix, OAuth decisions, product priority, deployment configuration, production secret provisioning, and owner approval of any first product schema. The current staging project is a safe schema foundation, not a production-ready product environment.

Runtime authenticated RLS testing is deferred until an owner-approved staging test identity and fixture plan exist. Product-specific tables remain prohibited until the product scope is deliberately approved. No Phase 6 or product implementation was started in this phase.
