-- guide_interest_signups: notification signups (eligibility assistance flow).
-- Run in Supabase SQL editor if the table already exists without verification columns:

alter table public.guide_interest_signups
  add column if not exists email_verified boolean not null default false,
  add column if not exists verified_at timestamptz;

-- Optional: prevent duplicate leads for the same email + region + country (skip if duplicates already exist)
-- create unique index if not exists guide_interest_signups_notify_region_country_key
--   on public.guide_interest_signups (notify_email, coalesce(target_region, ''), coalesce(target_country, ''));
