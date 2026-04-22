-- Profile completion tracking, resume draft, magic-link token for reminder emails.
-- Run after supabase/candidates.sql

alter table public.candidates
  add column if not exists profile_completion_step integer not null default 0;

alter table public.candidates
  add column if not exists profile_draft jsonb not null default '{}'::jsonb;

alter table public.candidates
  add column if not exists profile_token uuid;

alter table public.candidates
  add column if not exists token_expires_at timestamptz;

alter table public.candidates
  add column if not exists last_email_sent timestamptz;

-- Allow saving in-progress profiles before a video URL exists
alter table public.candidates
  alter column video_link drop not null;

create index if not exists idx_candidates_profile_token on public.candidates (profile_token)
  where profile_token is not null;

-- Anyone who already finished the legacy wizard should stay eligible to apply
update public.candidates
set profile_completion_step = 9
where profile_completed_at is not null and profile_completion_step < 9;
