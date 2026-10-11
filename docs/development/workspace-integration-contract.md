# Workspace Integration Contract (backend → Codex)

> Implemented on `feature/winlerros-workspace-core`. Backend owns data,
> rules, and server actions below; Codex owns the onboarding form visuals.
> Do not change action signatures, error codes, or role semantics without
> updating this file.

## Data model (`supabase/migrations/20261012000000_*`, PROPOSAL — unapplied)

- `organizations(id, created_at, name[1..120], slug unique lowercase-hyphen, created_by → auth.users)`; RLS on, authenticated-only policies.
- `organization_members(org_id → organizations cascade, user_id → auth.users cascade, role ∈ owner|admin|member default member, PK(org_id,user_id))`; RLS on, authenticated-only policies.
- Roles: `owner` (creator, full control), `admin` (granted later via service-role invites — no normal-role path exists yet), `member`. No viewer role in this slice.

## Server actions (`apps/web/src/lib/workspace-actions.ts`, `"use server"`)

- `createOrganizationAction({name, slug}) → {ok, data?: {organization: OrganizationWithRole, role: "owner"}, error?, errorMessage?}` — first creator is ALWAYS owner (role forced server-side, not in input). Errors: `unauthorized | invalid-name | invalid-slug | slug-taken | already-member | unknown` (see `WORKSPACE_ERROR_COPY`).
- `listOrganizationsAction() → {ok, data?: OrganizationWithRole[]}` — caller's orgs only.
- `getOrganizationAction(orgId) → {ok, data?}` — member-only; non-members get `not-member` (no existence oracle).
- Auth: session cookies via the auth integration (no second session system); service-role key unused and unneeded (anon key + RLS suffice).

## Onboarding form contract (Codex)

- Fields: business name (→ `name`), workspace address (→ `slug`, lowercase/hyphen hint). Validate client-side with the same rules (`organizationNameSchema`, `organizationSlugSchema` exported from `@winlerr/workspace`).
- Submit → `createOrganizationAction` → on `ok` with a returned organization, navigate to `/dashboard`, which renders the user's real results from `listOrganizationsAction`; on `slug-taken`, prompt for another address; on `unauthorized`, send to `/login?next=/dashboard/setup`.
- Loading/error/empty states mirror the auth forms (`role="alert"` errors, pending labels). Stable element ids to agree with Codex: `workspace-name`, `workspace-slug`.

## Explicit dependencies (NOT faked, NOT in this slice)

- `admin_profiles`/org-role reads: untouched — the workspace model is deliberately independent of the pending hardening migration and applies cleanly before or after it.
- Member invites, role changes, member removal, org switching UI: follow-up slices (service-role paths). Attempting them against current RLS fails closed by design.

## Verification

New vitest suites in `@winlerr/workspace` (validation incl. slug edge cases; lifecycle incl. tenant isolation, forced-owner, race/duplicate handling, fail-closed auth) — all offline with faked ports, no database contact. Full gates green before push.
