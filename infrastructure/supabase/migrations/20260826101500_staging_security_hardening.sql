-- Winlerr Phase 5 staging security hardening
-- Move RLS SECURITY DEFINER helpers out of the exposed public API schema,
-- fix the mutable trigger search_path, and preserve authenticated policy use.
-- No product tables or data are created.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_org_member(target_org_id uuid)
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

create or replace function private.is_org_admin_or_owner(target_org_id uuid)
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

create or replace function private.is_org_owner(target_org_id uuid)
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

alter function public.handle_updated_at()
  set search_path = public;

revoke all on function public.handle_updated_at() from public, anon, authenticated;
revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.is_org_admin_or_owner(uuid) from public, anon;
revoke all on function private.is_org_owner(uuid) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.is_org_admin_or_owner(uuid) to authenticated;
grant execute on function private.is_org_owner(uuid) to authenticated;

alter policy organizations_select_member on public.organizations
  to authenticated
  using (private.is_org_member(id));
alter policy organizations_update_member on public.organizations
  to authenticated
  using (private.is_org_member(id))
  with check (private.is_org_member(id));
alter policy memberships_select_own on public.memberships
  to authenticated
  using (user_id = auth.uid() or private.is_org_member(organization_id));
alter policy memberships_insert_self_or_admin on public.memberships
  to authenticated
  with check (private.is_org_owner(organization_id) or private.is_org_admin_or_owner(organization_id));
alter policy audit_log_select_member on public.audit_log
  to authenticated
  using (private.is_org_member(organization_id));
alter policy audit_log_insert_member on public.audit_log
  to authenticated
  with check (private.is_org_member(organization_id) and (actor_user_id is null or actor_user_id = auth.uid()));

drop function if exists public.is_org_member(uuid);
drop function if exists public.is_org_admin_or_owner(uuid);
drop function if exists public.is_org_owner(uuid);
