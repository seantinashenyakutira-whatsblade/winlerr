-- ===== WINLERR FOUNDATION RLS POLICIES =====
-- Row-level security for the new foundation tables

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.product_catalogue enable row level security;
alter table public.product_requests enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.lead_responses enable row level security;

-- ===== ORGANIZATIONS =====
-- Only admins can select and manage organizations
create policy "Organizations: admins can select" on public.organizations
  for select using (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Organizations: admins can insert" on public.organizations
  for insert with check (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Organizations: admins can update" on public.organizations
  for update using (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Organizations: admins can delete" on public.organizations
  for delete using (exists (select 1 from public.admin_profiles where id = auth.uid()));

-- ===== MEMBERSHIPS =====
-- Users can manage their own memberships
create policy "Memberships: users can select own" on public.memberships
  for select using (auth.uid() = user_id);

create policy "Memberships: users can insert own" on public.memberships
  for insert with check (auth.uid() = user_id);

create policy "Memberships: users can update own" on public.memberships
  for update using (auth.uid() = user_id);

create policy "Memberships: users can delete own" on public.memberships
  for delete using (auth.uid() = user_id);

create policy "Memberships: admins can manage" on public.memberships
  for all using (exists (select 1 from public.admin_profiles where id = auth.uid()));

-- ===== PRODUCT_CATALOGUE =====
-- Public read, admin write
create policy "Product catalogue: anyone can select" on public.product_catalogue
  for select using (true);

create policy "Product catalogue: admins can insert" on public.product_catalogue
  for insert with check (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Product catalogue: admins can update" on public.product_catalogue
  for update using (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Product catalogue: admins can delete" on public.product_catalogue
  for delete using (exists (select 1 from public.admin_profiles where id = auth.uid()));

-- ===== PRODUCT_REQUESTS =====
-- Users can manage their own requests
create policy "Product requests: users can select own" on public.product_requests
  for select using (auth.uid() = submitted_by);

create policy "Product requests: users can insert own" on public.product_requests
  for insert with check (auth.uid() = submitted_by);

create policy "Product requests: users can update own" on public.product_requests
  for update using (auth.uid() = submitted_by);

create policy "Product requests: users can delete own" on public.product_requests
  for delete using (auth.uid() = submitted_by);

-- Allow public to submit requests (anonymous submissions)
create policy "Product requests: anyone can insert" on public.product_requests
  for insert with check (true);

create policy "Product requests: admins can select all" on public.product_requests
  for select using (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Product requests: admins can update all" on public.product_requests
  for update using (exists (select 1 from public.admin_profiles where id = auth.uid()));

create policy "Product requests: admins can delete all" on public.product_requests
  for delete using (exists (select 1 from public.admin_profiles where id = auth.uid()));

-- ===== LEADS =====
-- Tenants can manage their own leads
create policy "Leads: tenants can select own" on public.leads
  for select using (
    exists (select 1 from public.memberships where organization_id = leads.organization_id and user_id = auth.uid() and status = 'active')
  );

create policy "Leads: tenants can insert own" on public.leads
  for insert with check (
    exists (select 1 from public.memberships where organization_id = leads.organization_id and user_id = auth.uid() and status = 'active')
  );

create policy "Leads: tenants can update own" on public.leads
  for update using (
    exists (select 1 from public.memberships where organization_id = leads.organization_id and user_id = auth.uid() and status = 'active')
  );

create policy "Leads: tenants can delete own" on public.leads
  for delete using (
    exists (select 1 from public.memberships where organization_id = leads.organization_id and user_id = auth.uid() and status = 'active')
  );

create policy "Leads: admins can manage" on public.leads
  for all using (exists (select 1 from public.admin_profiles where id = auth.uid()));

-- ===== LEAD_EVENTS =====
-- Tenants can manage their own lead events
create policy "Lead events: tenants can select own" on public.lead_events
  for select using (
    exists (select 1 from public.leads l join public.memberships m on l.organization_id = m.organization_id and l.id = lead_events.lead_id where m.user_id = auth.uid() and m.status = 'active')
  );

create policy "Lead events: tenants can insert own" on public.lead_events
  for insert with check (
    exists (select 1 from public.leads l join public.memberships m on l.organization_id = m.organization_id and l.id = lead_events.lead_id where m.user_id = auth.uid() and m.status = 'active')
  );

create policy "Lead events: admins can manage" on public.lead_events
  for all using (exists (select 1 from public.admin_profiles where id = auth.uid()));

-- ===== LEAD_RESPONSES =====
-- Tenants can manage their own lead responses
create policy "Lead responses: tenants can select own" on public.lead_responses
  for select using (
    exists (select 1 from public.leads l join public.memberships m on l.organization_id = m.organization_id and l.id = lead_responses.lead_id where m.user_id = auth.uid() and m.status = 'active')
  );

create policy "Lead responses: tenants can insert own" on public.lead_responses
  for insert with check (
    exists (select 1 from public.leads l join public.memberships m on l.organization_id = m.organization_id and l.id = lead_responses.lead_id where m.user_id = auth.uid() and m.status = 'active')
  );

create policy "Lead responses: tenants can update own" on public.lead_responses
  for update using (
    exists (select 1 from public.leads l join public.memberships m on l.organization_id = m.organization_id and l.id = lead_responses.lead_id where m.user_id = auth.uid() and m.status = 'active')
  );

create policy "Lead responses: tenants can delete own" on public.lead_responses
  for delete using (
    exists (select 1 from public.leads l join public.memberships m on l.organization_id = m.organization_id and l.id = lead_responses.lead_id where m.user_id = auth.uid() and m.status = 'active')
  );

create policy "Lead responses: admins can manage" on public.lead_responses
  for all using (exists (select 1 from public.admin_profiles where id = auth.uid()));