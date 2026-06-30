-- ===== ROW LEVEL SECURITY POLICIES =====
-- Run after schema.sql

-- Enable RLS on all tables
alter table public.waitlist_leads enable row level security;
alter table public.prototype_requests enable row level security;
alter table public.feature_suggestions enable row level security;
alter table public.newsletter_campaigns enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.failed_submissions enable row level security;

-- ===== WAITLIST LEADS =====
-- Anyone can insert
create policy "Anyone can insert waitlist_leads"
  on public.waitlist_leads for insert
  with check (true);

-- Only admins can select
create policy "Admins can select waitlist_leads"
  on public.waitlist_leads for select
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- Only admins can update
create policy "Admins can update waitlist_leads"
  on public.waitlist_leads for update
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- Only admins can delete
create policy "Admins can delete waitlist_leads"
  on public.waitlist_leads for delete
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- ===== PROTOTYPE REQUESTS =====
create policy "Anyone can insert prototype_requests"
  on public.prototype_requests for insert
  with check (true);

create policy "Admins can select prototype_requests"
  on public.prototype_requests for select
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

create policy "Admins can update prototype_requests"
  on public.prototype_requests for update
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

create policy "Admins can delete prototype_requests"
  on public.prototype_requests for delete
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- ===== FEATURE SUGGESTIONS =====
create policy "Anyone can insert feature_suggestions"
  on public.feature_suggestions for insert
  with check (true);

create policy "Admins can select feature_suggestions"
  on public.feature_suggestions for select
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

create policy "Admins can update feature_suggestions"
  on public.feature_suggestions for update
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

create policy "Admins can delete feature_suggestions"
  on public.feature_suggestions for delete
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- ===== NEWSLETTER CAMPAIGNS =====
create policy "Admins can all newsletter_campaigns"
  on public.newsletter_campaigns for all
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- ===== ADMIN PROFILES =====
create policy "Admins can select admin_profiles"
  on public.admin_profiles for select
  using (true);

create policy "Admins can insert admin_profiles"
  on public.admin_profiles for insert
  with check (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- ===== FAILED SUBMISSIONS =====
create policy "Anyone can insert failed_submissions"
  on public.failed_submissions for insert
  with check (true);

create policy "Admins can manage failed_submissions"
  on public.failed_submissions for all
  using (
    exists (select 1 from public.admin_profiles where id = auth.uid())
  );

-- ===== HELPER FUNCTION: Create first admin =====
-- Run this after creating the admin user in Supabase Auth:
-- replace the UUID with the actual auth.users id
-- insert into public.admin_profiles (id, full_name, role)
-- values ('REPLACE_WITH_AUTH_USER_ID', 'Admin Name', 'admin');
