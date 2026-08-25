-- Winlerr domain persistence foundation
-- Organizations, Memberships, Audit Log
-- Status: Current Plan (RLS minimal, HQ decisions remain open)
-- See docs/architecture/database-architecture.md

-- Enable pgcrypto for gen_random_uuid() if not already (Supabase has it by default)
create extension if not exists "pgcrypto";

-- ============================================================================
-- Organizations — tenant (business/client)
-- ============================================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists organizations_owner_idx on public.organizations (owner_user_id);
create index if not exists organizations_created_at_idx on public.organizations (created_at);

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.handle_updated_at();

alter table public.organizations enable row level security;

-- ============================================================================
-- Memberships — user ↔ organization + role
-- ============================================================================
-- Role is placeholder set; final matrix is HQ/Product decision (ADR 0004 Current Plan)
create table if not exists public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create index if not exists memberships_user_idx on public.memberships (user_id);
create index if not exists memberships_org_idx on public.memberships (organization_id);
create index if not exists memberships_role_idx on public.memberships (role);

alter table public.memberships enable row level security;

-- ============================================================================
-- Audit Log — organization-scoped event log
-- ============================================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_org_idx on public.audit_log (organization_id);
create index if not exists audit_log_org_created_idx on public.audit_log (organization_id, created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_user_id);
create index if not exists audit_log_action_idx on public.audit_log (action);

alter table public.audit_log enable row level security;

-- ============================================================================
-- RLS Policies — minimal, membership-based isolation
-- ============================================================================
-- HQ decisions remain open: final role/permission matrix, multi-org rules,
-- OAuth providers. Therefore policies are membership-based only, not role-based.
-- Service role bypasses RLS (server-only).
--
-- Membership policies must not query public.memberships directly while RLS is
-- evaluating public.memberships: PostgreSQL otherwise detects policy recursion.
-- These SECURITY DEFINER helpers are narrowly scoped, use a fixed search_path,
-- and are executable only by authenticated users.

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin_or_owner(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_org_owner(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = target_org_id
      and o.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin_or_owner(uuid) from public;
revoke all on function public.is_org_owner(uuid) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin_or_owner(uuid) to authenticated;
grant execute on function public.is_org_owner(uuid) to authenticated;

-- Organizations: members can read their organizations; authenticated callers can create organizations they own
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated" on public.organizations
  for insert with check (
    auth.role() = 'authenticated'
    and owner_user_id = auth.uid()
  );

drop policy if exists "organizations_update_member" on public.organizations;
create policy "organizations_update_member" on public.organizations
  for update using (public.is_org_member(id))
  with check (public.is_org_member(id));

-- Memberships: user can read their own memberships; members can read org memberships
drop policy if exists "memberships_select_own" on public.memberships;
create policy "memberships_select_own" on public.memberships
  for select using (
    user_id = auth.uid()
    or public.is_org_member(organization_id)
  );

drop policy if exists "memberships_insert_self" on public.memberships;
create policy "memberships_insert_self_or_admin" on public.memberships
  for insert with check (
    public.is_org_owner(organization_id)
    or public.is_org_admin_or_owner(organization_id)
  );

-- Audit log: members can read org audit; members can insert audit for their org
drop policy if exists "audit_log_select_member" on public.audit_log;
create policy "audit_log_select_member" on public.audit_log
  for select using (public.is_org_member(organization_id));

drop policy if exists "audit_log_insert_member" on public.audit_log;
create policy "audit_log_insert_member" on public.audit_log
  for insert with check (
    public.is_org_member(organization_id)
    and (actor_user_id is null or actor_user_id = auth.uid())
  );

-- ============================================================================
-- Notes
-- ============================================================================
-- Tenant isolation: every row has organization_id (except organizations itself is the tenant).
-- RLS is primary enforcement; app scoping via organization_id is defense-in-depth.
-- Do not log secrets in audit_log.metadata — redact before insert.
-- No product tables (leads, bookings, etc.) are created in this migration.
