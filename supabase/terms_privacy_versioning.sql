create extension if not exists pgcrypto;

create table if not exists public.terms_versions (
  id uuid default gen_random_uuid() primary key,
  version text not null,
  type text check (type in ('terms', 'privacy')),
  summary_of_changes text,
  effective_date date not null,
  created_at timestamptz default now()
);

create table if not exists public.terms_acceptances (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  user_type text check (user_type in ('candidate', 'employer', 'partner')),
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz default now(),
  ip_hash text,
  refused_at timestamptz,
  refusal_feedback text,
  unique(user_email, terms_version, privacy_version)
);

alter table public.terms_versions enable row level security;
alter table public.terms_acceptances enable row level security;

drop policy if exists "service_role_full_access_terms_versions" on public.terms_versions;
create policy "service_role_full_access_terms_versions"
on public.terms_versions
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_access_terms_acceptances" on public.terms_acceptances;
create policy "service_role_full_access_terms_acceptances"
on public.terms_acceptances
to service_role
using (true)
with check (true);

alter table public.candidates add column if not exists terms_refused boolean default false;
alter table public.candidates add column if not exists current_terms_version text;
alter table public.candidates add column if not exists current_privacy_version text;

alter table public.employer_requests add column if not exists terms_refused boolean default false;
alter table public.employer_requests add column if not exists current_terms_version text;
alter table public.employer_requests add column if not exists current_privacy_version text;
