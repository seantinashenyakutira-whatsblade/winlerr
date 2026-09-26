create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  business_name text not null,
  slug text not null unique,
  email text not null,
  whatsapp text,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb
);

alter table public.claims enable row level security;

create policy "anon can insert claims"
  on public.claims for insert to anon with check (true);

-- Intentionally NO anon SELECT policy: claims are readable only by the
-- service role. Duplicate slugs are caught by the `claims_slug_key` unique
-- constraint (error code 23505), not by a client-side read.
