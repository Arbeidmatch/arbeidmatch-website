-- Run in Supabase SQL editor. Table for /dsb-checklist lead magnet.
create table if not exists public.dsb_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  gdpr_consent boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists dsb_leads_email_idx on public.dsb_leads (lower(email));
create index if not exists dsb_leads_created_at_idx on public.dsb_leads (created_at desc);

alter table public.dsb_leads enable row level security;
-- API uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS). No public policies needed.
