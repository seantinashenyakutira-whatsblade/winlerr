-- ===== WINLERR DATABASE SCHEMA =====
-- Run this in your Supabase SQL editor

-- 1. WAITLIST LEADS
create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  whatsapp text,
  business_name text,
  country text,
  business_type text,
  has_website text,
  main_goal text,
  source text default 'landing_page',
  status text default 'New',
  email_consent boolean default false,
  resend_contact_id text,
  created_at timestamptz default now()
);

-- 2. PROTOTYPE REQUESTS
create table if not exists public.prototype_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  whatsapp text,
  business_name text not null,
  industry text,
  country text,
  existing_website text,
  social_links text,
  prototype_type text,
  business_description text,
  customer_actions text[],
  brand_style text,
  status text default 'New',
  admin_notes text,
  email_consent boolean default false,
  created_at timestamptz default now()
);

-- 3. FEATURE SUGGESTIONS
create table if not exists public.feature_suggestions (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  business_name text,
  email text,
  whatsapp text,
  feature text not null,
  reason text,
  status text default 'New',
  created_at timestamptz default now()
);

-- 4. NEWSLETTER CAMPAIGNS
create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  body_html text not null,
  status text default 'Draft',
  email_sequence integer,
  planned_send_date timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- 5. ADMIN PROFILES
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text default 'admin',
  created_at timestamptz default now()
);

-- 6. FAILED SUBMISSIONS (sync recovery)
create table if not exists public.failed_submissions (
  id uuid primary key default gen_random_uuid(),
  form_type text not null,
  payload jsonb,
  error_message text,
  recovered boolean default false,
  created_at timestamptz default now()
);
