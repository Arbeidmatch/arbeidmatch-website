-- ArbeidMatch Recruiter Network applications
-- Run in Supabase SQL editor (or migrate via CLI).

create table if not exists public.recruiter_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  country text not null,
  region text not null,
  partner_type text not null check (partner_type in ('influencer', 'recruiter', 'learner')),
  social_url text not null,
  monthly_reach integer not null,
  has_company text not null check (has_company in ('yes', 'want_setup', 'not_yet')),
  motivation text,
  gdpr_consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'rejected', 'accepted')),
  created_at timestamptz not null default now()
);

create index if not exists recruiter_applications_created_at_idx on public.recruiter_applications (created_at desc);
create index if not exists recruiter_applications_status_idx on public.recruiter_applications (status);
create index if not exists recruiter_applications_email_idx on public.recruiter_applications (email);

comment on table public.recruiter_applications is 'Partnership applications for ArbeidMatch Recruiter Network';

alter table public.recruiter_applications enable row level security;

-- No public policies: inserts only via service_role from API.

grant all on table public.recruiter_applications to service_role;
