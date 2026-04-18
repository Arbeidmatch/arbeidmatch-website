create table if not exists public.discount_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  guide_type text not null check (guide_type in ('eu', 'non-eu')),
  coupon_code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  reminder_sent boolean default false,
  created_at timestamptz default now()
);

create index if not exists discount_leads_email_idx
  on public.discount_leads (lower(email));

create index if not exists discount_leads_expires_idx
  on public.discount_leads (expires_at);

create index if not exists discount_leads_reminder_idx
  on public.discount_leads (reminder_sent, expires_at)
  where used = false;

grant all on table public.discount_leads to service_role;
