-- ArbeidMatch mobile app waitlist (run in Supabase SQL editor)
create table if not exists public.app_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists app_waitlist_email_lower_unique on public.app_waitlist (lower(email));
