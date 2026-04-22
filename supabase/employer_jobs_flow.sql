-- Employer auto-generated job board flow (service role only via API).
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.employer_jobs (
  id uuid primary key default gen_random_uuid(),
  employer_request_id uuid references public.employer_requests (id) on delete set null,
  slug text not null unique,
  title text not null,
  description text not null,
  requirements text not null,
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  hours text,
  rotation text,
  license_required boolean not null default false,
  housing_provided boolean not null default false,
  travel_paid boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'live', 'closed')),
  company_name text not null,
  employer_email text not null,
  location text not null,
  category text,
  mapped_job_type text,
  experience_years_min integer,
  edit_token uuid,
  token_expires_at timestamptz,
  locked_at timestamptz,
  published_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employer_jobs_status_idx on public.employer_jobs (status);
create index if not exists employer_jobs_slug_idx on public.employer_jobs (slug);
create index if not exists employer_jobs_request_idx on public.employer_jobs (employer_request_id);

create table if not exists public.job_edit_tokens (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.employer_jobs (id) on delete cascade,
  token uuid not null unique,
  used_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists job_edit_tokens_job_idx on public.job_edit_tokens (job_id);
create index if not exists job_edit_tokens_lookup_idx on public.job_edit_tokens (token, expires_at);

alter table public.job_applications
  add column if not exists behavioral_answers jsonb,
  add column if not exists employer_access_token uuid,
  add column if not exists employer_access_expires_at timestamptz,
  add column if not exists employer_decision text default 'pending',
  add column if not exists stage_2_unlocked_at timestamptz,
  add column if not exists employer_feedback_reason text,
  add column if not exists employer_feedback_details text,
  add column if not exists feedback_shared_with_candidate boolean;

create unique index if not exists job_applications_employer_token_uidx
  on public.job_applications (employer_access_token)
  where employer_access_token is not null;

alter table public.employer_jobs enable row level security;
alter table public.job_edit_tokens enable row level security;

drop policy if exists "service_role_employer_jobs" on public.employer_jobs;
create policy "service_role_employer_jobs" on public.employer_jobs
  to service_role using (true) with check (true);

drop policy if exists "service_role_job_edit_tokens" on public.job_edit_tokens;
create policy "service_role_job_edit_tokens" on public.job_edit_tokens
  to service_role using (true) with check (true);

grant all on public.employer_jobs to service_role;
grant all on public.job_edit_tokens to service_role;
