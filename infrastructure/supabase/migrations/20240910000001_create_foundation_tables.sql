-- ===== WINLERR FOUNDATION TABLES =====
-- Organizations, Memberships, Products, Product Requests

-- 1. ORGANIZATIONS (Tenant root)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  contact_email text,
  contact_phone text,
  business_type text,
  industry text,
  country text,
  timezone text default 'UTC',
  billing_status text default 'none',
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. MEMBERSHIPS (Organization ↔ User)
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, user_id)
);

-- 3. PRODUCT_CATALOGUE (Available products)
create table if not exists public.product_catalogue (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  status text not null default 'available',
  category text,
  price_range text default 'custom',
  requires_customization boolean default true,
  implementation_guide text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. PRODUCT_REQUESTS (Organization product requests)
create table if not exists public.product_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid references public.product_catalogue(id),
  product_name text not null,
  requirements text not null,
  business_name text,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text not null default 'submitted',
  priority text default 'normal',
  estimated_timeline text,
  internal_notes text,
  submitted_by uuid references auth.users(id),
  submitted_by_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. LEADS (Tenant-scoped leads)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text,
  name text not null,
  email text,
  phone text,
  company text,
  title text,
  status text not null default 'new',
  priority text default 'medium',
  qualification_score integer default 0,
  notes text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. LEAD_EVENTS (Timeline of lead interactions)
create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  event_data jsonb default '{}',
  performed_by uuid references auth.users(id),
  performed_by_email text,
  notes text,
  created_at timestamptz default now()
);

-- 7. LEAD_RESPONSES (AI-generated or human responses)
create table if not exists public.lead_responses (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  response_text text not null,
  response_type text not null default 'proposal',
  status text not null default 'draft',
  channel text,
  generated_by text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  sent_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===== INDEXES =====
create index if not exists organizations_slug_idx on public.organizations(slug);
create index if not exists memberships_organization_id_idx on public.memberships(organization_id);
create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists product_catalogue_code_idx on public.product_catalogue(code);
create index if not exists product_catalogue_status_idx on public.product_catalogue(status);
create index if not exists product_requests_organization_id_idx on public.product_requests(organization_id);
create index if not exists product_requests_status_idx on public.product_requests(status);
create index if not exists leads_organization_id_idx on public.leads(organization_id);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists lead_events_lead_id_idx on public.lead_events(lead_id);
create index if not exists lead_responses_lead_id_idx on public.lead_responses(lead_id);
create index if not exists lead_responses_organization_id_idx on public.lead_responses(organization_id);
create index if not exists lead_responses_status_idx on public.lead_responses(status);

-- ===== AUTOMATED TIMESTAMPS =====
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_updated_at before update on public.organizations
  for each row execute function update_updated_at_column();

create trigger memberships_updated_at before update on public.memberships
  for each row execute function update_updated_at_column();

create trigger product_catalogue_updated_at before update on public.product_catalogue
  for each row execute function update_updated_at_column();

create trigger product_requests_updated_at before update on public.product_requests
  for each row execute function update_updated_at_column();

create trigger leads_updated_at before update on public.leads
  for each row execute function update_updated_at_column();

create trigger lead_responses_updated_at before update on public.lead_responses
  for each row execute function update_updated_at_column();