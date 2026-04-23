create table if not exists public.role_alerts (
  id uuid default gen_random_uuid() primary key,
  partner_email text not null,
  job_category text not null,
  alert_status text check (alert_status in ('active', 'paused', 'completed')) default 'active',
  notification_frequency text check (notification_frequency in ('instant', 'daily', 'weekly')) default 'instant',
  min_candidates integer default 3,
  created_at timestamptz default now(),
  unique (partner_email, job_category)
);

create table if not exists public.role_alert_notifications (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid references public.role_alerts(id) on delete cascade,
  candidates_count integer,
  sent_at timestamptz default now()
);

alter table public.role_alerts enable row level security;
alter table public.role_alert_notifications enable row level security;
