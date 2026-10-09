-- WinlaOS core: admin_profiles
--
-- One row per authenticated user. Rows are created service-role-only
-- (signup sync); authenticated users can read/update ONLY their own row;
-- anonymous callers have no access at all. The `role` column is immutable
-- to non-service-role callers via the trigger below, so the update policy
-- cannot be used for privilege escalation.
--
-- Design review: docs/decisions/0002-winlaos-core-auth-data.md (Proposed).
-- DO NOT apply to production without explicit authorization.

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  email text,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'viewer'))
);

alter table public.admin_profiles enable row level security;

-- Intentionally NO anon policies: anonymous callers cannot read, insert,
-- update, or enumerate profiles.

create policy "users can read own profile"
  on public.admin_profiles for select to authenticated
  using (auth.uid() = id);

create policy "users can update own profile"
  on public.admin_profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert policy for authenticated users: profile rows are created by the
-- service role during signup sync only. (Service role bypasses RLS.)

create or replace function public.prevent_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (auth.jwt() ->> 'role') is distinct from 'service_role'
     and new.role is distinct from old.role then
    raise exception 'admin_profiles.role is immutable to non-service callers';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_admin_role_change on public.admin_profiles;

create trigger trg_prevent_admin_role_change
  before update on public.admin_profiles
  for each row execute function public.prevent_admin_role_change();
