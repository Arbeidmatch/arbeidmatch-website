create table if not exists public.email_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  unsubscribe_token uuid default gen_random_uuid() not null unique,
  subscribed boolean default true,
  source text,
  unsubscribed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists email_subscriptions_email_idx on public.email_subscriptions(email);
create index if not exists email_subscriptions_token_idx on public.email_subscriptions(unsubscribe_token);

grant all privileges on public.email_subscriptions to service_role;
grant all privileges on public.email_subscriptions to postgres;
