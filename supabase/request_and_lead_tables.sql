-- Request flow + lead tables used by API routes.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.request_tokens (
  id uuid primary key default gen_random_uuid(),
  token uuid unique not null,
  full_name text not null,
  company text not null,
  email text not null,
  phone text,
  org_number text,
  job_summary text not null default 'General hiring inquiry',
  how_did_you_hear text,
  social_media_platform text,
  how_did_you_hear_other text,
  referral_company_name text,
  referral_org_number text,
  referral_email text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists request_tokens_token_idx on public.request_tokens (token);
create index if not exists request_tokens_expires_used_idx on public.request_tokens (expires_at, used);
create index if not exists request_tokens_email_idx on public.request_tokens (lower(email));

alter table public.request_tokens add column if not exists gdpr_consent boolean not null default false;

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
  full_time text,
  hours_unit text,
  hours_amount integer,
  overtime text,
  max_overtime_hours integer,
  has_rotation text,
  rotation_weeks_on integer,
  rotation_weeks_off integer,
  accommodation_cost text,
  international_travel text,
  international_travel_coverage text,
  local_travel text,
  local_travel_other text,
  accommodation text,
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
  subscribe text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employer_requests_created_at_idx on public.employer_requests (created_at desc);
create index if not exists employer_requests_email_idx on public.employer_requests (lower(email));
create index if not exists employer_requests_token_id_idx on public.employer_requests (token_id);

create table if not exists public.discount_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  guide_type text not null check (guide_type in ('eu', 'non-eu')),
  coupon_code text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  reminder_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists discount_leads_email_guide_idx on public.discount_leads (lower(email), guide_type);
create index if not exists discount_leads_expires_idx on public.discount_leads (expires_at);

create table if not exists public.dsb_leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  gdpr_consent boolean not null default false,
  source text not null default 'dsb-checklist',
  created_at timestamptz not null default now()
);

create index if not exists dsb_leads_email_idx on public.dsb_leads (lower(email));
create index if not exists dsb_leads_created_at_idx on public.dsb_leads (created_at desc);

create table if not exists public.recruiter_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  country text not null,
  region text not null,
  partner_type text not null check (partner_type in ('influencer', 'recruiter', 'learner')),
  social_url text not null,
  monthly_reach integer not null check (monthly_reach >= 0),
  has_company text not null check (has_company in ('yes', 'want_setup', 'not_yet')),
  motivation text,
  gdpr_consent boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recruiter_applications_email_idx on public.recruiter_applications (lower(email));
create index if not exists recruiter_applications_status_idx on public.recruiter_applications (status);

create table if not exists public.app_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists app_waitlist_email_idx on public.app_waitlist (lower(email));

create table if not exists public.guide_interest_signups (
  id uuid primary key default gen_random_uuid(),
  notify_email text not null,
  target_region text,
  target_country text,
  wants_assistance text,
  email_verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guide_interest_notify_region_country_uidx
  on public.guide_interest_signups (lower(notify_email), coalesce(target_region, ''), coalesce(target_country, ''));
create index if not exists guide_interest_signups_verified_idx on public.guide_interest_signups (email_verified, created_at desc);
create index if not exists guide_interest_signups_email_idx on public.guide_interest_signups (lower(notify_email));

-- Employer request wizard: optional paid branding on job post
alter table public.employer_requests add column if not exists branding_requested boolean not null default false;
alter table public.employer_requests add column if not exists branding_price numeric(10,2) not null default 0;
