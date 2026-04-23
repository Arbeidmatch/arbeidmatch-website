create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  employer_email text not null,
  company_name text,
  plan text check (plan in ('trial', 'growth', 'scale', 'enterprise')) not null,
  status text check (status in ('active', 'cancelled', 'past_due', 'trialing')) default 'trialing',
  stripe_subscription_id text unique,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  requests_used integer default 0,
  requests_limit integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists subscriptions_employer_email_idx on public.subscriptions (employer_email);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

insert into credit_pricing (action, credits_cost, description)
values
  ('subscription_growth_monthly', 0, 'Growth plan - 1499 NOK/month'),
  ('subscription_scale_monthly', 0, 'Scale plan - 3999 NOK/month')
on conflict (action) do nothing;

alter table public.subscriptions enable row level security;

drop policy if exists "service_role_subscriptions" on public.subscriptions;
create policy "service_role_subscriptions" on public.subscriptions
  to service_role using (true) with check (true);

create or replace function public.set_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_subscriptions_updated_at();
