create table if not exists public.candidates (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null,
  last_name text not null,
  phone text not null,
  current_country text not null,
  city text not null,
  gdpr_entry_accepted boolean not null default false,
  privacy_policy_version text,
  video_link text,
  experiences jsonb not null default '[]'::jsonb,
  job_preferences jsonb not null default '{}'::jsonb,
  experience_years numeric,
  salary_min integer,
  hours_pref text,
  rotation_pref text,
  housing_pref text,
  travel_pref text,
  job_type_pref text,
  has_permit boolean,
  permit_categories text,
  share_with_employers boolean not null default false,
  can_apply boolean not null default false,
  profile_completed_at timestamptz,
  profile_completion_step integer not null default 0,
  profile_draft jsonb not null default '{}'::jsonb,
  profile_token uuid,
  token_expires_at timestamptz,
  last_email_sent timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_candidates_email on public.candidates (email);
create index if not exists idx_candidates_completed_at on public.candidates (profile_completed_at);

alter table public.candidates enable row level security;

create policy "service_role_full_access_candidates"
on public.candidates
to service_role
using (true)
with check (true);
