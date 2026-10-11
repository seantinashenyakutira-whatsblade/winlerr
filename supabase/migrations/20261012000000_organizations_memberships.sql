-- PROPOSAL UNDER REVIEW — DO NOT APPLY without explicit owner approval.
--
-- Purpose: minimum organization + membership model for WinlerrOS workspace
-- persistence. Independent of the admin_profiles hardening migration
-- (20261011): this file references NEITHER admin_profiles NOR any role
-- outside its own tables, so it applies cleanly before or after it, and
-- the hardening decision does not block workspace work.
--
-- Security properties (enforced here, not trusted to callers):
--   * No anonymous access at all: zero policies for anon, all anon
--     privileges revoked. Every statement below requires an authenticated
--     JWT (auth.uid()).
--   * First-creator-becomes-owner is structural: the only membership INSERT
--     policy allows exactly (user_id = self AND role = 'owner' AND the org
--     was created by self). Callers cannot choose any other role and cannot
--     join orgs they did not create. Later member management (invites,
--     role changes, removal) has NO normal-role path — service_role only,
--     to be added with the invitations slice.
--   * Tenant isolation: every SELECT/UPDATE/DELETE policy is scoped by
--     membership or creator id. Cross-org reads/writes are denied by RLS.
--   * Nested policy reads are safe: subqueries below only ever match the
--     caller's own rows through the sibling SELECT policies (no recursion —
--     these policies read no tables outside organizations/members), and the
--     retained SELECT grants prevent permission-denied errors.
--
-- Supabase runs each migration inside a transaction; no explicit
-- BEGIN/COMMIT here. Fails closed (precondition + per-table guards).

-- §0. Preconditions.
do $$
begin
  if to_regclass('public.organizations') is not null
     or to_regclass('public.organization_members') is not null then
    raise exception 'workspace migration: target tables already exist — reconcile manually, refusing to overwrite';
  end if;
end
$$;

-- §1. Tables.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$'),
  created_by uuid not null references auth.users (id)
);

create table public.organization_members (
  org_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- §2. Organizations policies (authenticated only).
create policy "org_insert_own"
  on public.organizations for insert to authenticated
  with check (created_by = auth.uid());

create policy "org_select_member"
  on public.organizations for select to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.organization_members m
      where m.org_id = id and m.user_id = auth.uid()
    )
  );

create policy "org_update_owner"
  on public.organizations for update to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.organization_members m
      where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "org_delete_owner"
  on public.organizations for delete to authenticated
  using (
    exists (
      select 1 from public.organization_members m
      where m.org_id = id and m.user_id = auth.uid() and m.role = 'owner'
    )
  );

-- §3. Membership policies (authenticated only). No UPDATE/DELETE policies
-- for normal roles: membership changes go through service_role (invites
-- slice). A member always sees their own rows (required for lookups and
-- for the nested checks above).
create policy "members_select_own"
  on public.organization_members for select to authenticated
  using (user_id = auth.uid());

create policy "members_insert_owner_self"
  on public.organization_members for insert to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from public.organizations o
      where o.id = org_id and o.created_by = auth.uid()
    )
  );

-- §4. Grants: nothing for anon; authenticated keeps only the operations
-- that have policies (SELECT/INSERT/UPDATE/DELETE). Maintenance-class
-- privileges are revoked. service_role is untouched (bypasses RLS).
revoke all
  on public.organizations, public.organization_members from anon;

revoke truncate, references, trigger, maintain
  on public.organizations, public.organization_members from authenticated;

-- §5. Post-deployment verification (READ-ONLY — run after apply, compare):
--   select tablename, policyname, roles, cmd from pg_policies
--     where tablename in ('organizations','organization_members')
--     order by 1, 2;
--     -- expect 4 org policies + 2 member policies, all TO authenticated.
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_name in ('organizations','organization_members')
--       and grantee = 'anon';
--     -- expect zero rows.
--   -- tenant test (two verified users A/B, service_role setup only):
--   -- A creates org → owner row exists; B lists orgs → A's org absent;
--   -- B reads A's org id → 0 rows; B inserts membership into A's org →
--   -- denied; A updates own org name → ok.
--   -- anon probe: SELECT/INSERT on both tables → denied/0 rows.

-- §6. Rollback — forward-repair preferred. These tables are brand-new
-- (precondition §0 refuses to run if they exist), so rollback is simply:
--   drop table public.organization_members;
--   drop table public.organizations;
-- provided no later migration references them (check first). Data loss is
-- confined to rows created after apply — acceptable only pre-launch with
-- owner approval, never as routine.
