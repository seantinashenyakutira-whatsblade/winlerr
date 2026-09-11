-- ===== ADD CONSTRAINTS TO EXISTING ADMIN_PROFILES =====
-- Add organization_id to admin_profiles for consistency

-- Update existing admin_profiles to include organization_id (optional for now)
ALTER TABLE public.admin_profiles
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- ===== RLS FOR ADMIN_PROFILES =====
-- The existing policies allow select and insert, but we should enforce tenant isolation

-- Admins can still select all profiles for tenant management
create policy if not exists "admin_profiles: admins can select all" on public.admin_profiles
  for select using (exists (select 1 from public.admin_profiles where id = auth.uid() and role = 'super_admin'));

-- Users can select their own profile
create policy if not exists "admin_profiles: users can select own" on public.admin_profiles
  for select using (id = auth.uid());

-- Only super_admins can insert new admin profiles
create policy if not exists "admin_profiles: super_admins can insert" on public.admin_profiles
  for insert with check (exists (select 1 from public.admin_profiles where id = auth.uid() and role = 'super_admin'));

-- Only super_admins can update admin profiles
create policy if not exists "admin_profiles: super_admins can update" on public.admin_profiles
  for update using (exists (select 1 from public.admin_profiles where id = auth.uid() and role = 'super_admin'));

-- Only super_admins can delete admin profiles
create policy if not exists "admin_profiles: super_admins can delete" on public.admin_profiles
  for delete using (exists (select 1 from public.admin_profiles where id = auth.uid() and role = 'super_admin'));