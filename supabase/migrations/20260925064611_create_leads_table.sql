create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  business_name text,
  whatsapp text,
  email text,
  message text,
  source text default 'landing_page',
  status text default 'new',
  metadata jsonb default '{}'::jsonb
);

alter table public.leads enable row level security;

create policy "anon can insert leads"
  on public.leads for insert to anon with check (true);
