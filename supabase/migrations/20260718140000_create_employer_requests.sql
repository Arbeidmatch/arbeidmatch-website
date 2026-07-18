-- Production hotfix 2026-07-18: /api/save-employer-request → PGRST205
-- public.employer_requests missing from website Supabase (ktfgxaoxoboovjatgyam / Fixnow).

create extension if not exists pgcrypto;

create table if not exists public.employer_requests (
  id uuid primary key default gen_random_uuid(),
  token_id uuid references public.request_tokens (token),
  company text not null,
  org_number text,
  email text not null,
  full_name text not null,
  phone text not null,
  job_summary text not null default 'General hiring inquiry',
  hiring_type text not null,
  category text not null,
  position text not null,
  position_other text,
  number_of_positions integer,
  qualification text not null,
  certifications text,
  certifications_other text,
  experience integer,
  norwegian_level text,
  english_level text,
  driver_license text,
  driver_license_other text,
  d_number text,
  d_number_other text,
  requirements text,
  contract_type text,
  paslag_percent numeric(8,2),
  salary text,
  full_time boolean,
  hours_unit text,
  hours_amount integer,
  overtime boolean,
  max_overtime_hours integer,
  has_rotation boolean,
  rotation_weeks_on integer,
  rotation_weeks_off integer,
  accommodation_cost text,
  international_travel text,
  international_travel_coverage boolean,
  local_travel text,
  local_travel_other text,
  accommodation boolean,
  accommodation_other text,
  equipment text,
  equipment_other text,
  tools text,
  tools_other text,
  city text not null,
  start_date text,
  how_did_you_hear text,
  social_media_platform text,
  social_media_other text,
  how_did_you_hear_other text,
  referral_company_name text,
  referral_org_number text,
  referral_email text,
  subscribe boolean,
  notes text,
  required_skills text[] not null default '{}'::text[],
  parsed_by_ai boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employer_requests_created_at_idx on public.employer_requests (created_at desc);
create index if not exists employer_requests_email_idx on public.employer_requests (lower(email));
create index if not exists employer_requests_token_id_idx on public.employer_requests (token_id);

alter table public.employer_requests add column if not exists required_skills text[] not null default '{}'::text[];
alter table public.employer_requests add column if not exists parsed_by_ai boolean default false;

alter table public.employer_requests enable row level security;

grant select, insert, update, delete on public.employer_requests to service_role;
grant select, insert on public.employer_requests to anon;

notify pgrst, 'reload schema';
