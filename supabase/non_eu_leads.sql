-- Non-EU lead magnet signups (outside-eu-eea page)
-- Safe to run multiple times.

create table if not exists public.non_eu_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists non_eu_leads_email_idx on public.non_eu_leads (lower(email));
create index if not exists non_eu_leads_created_at_idx on public.non_eu_leads (created_at desc);
