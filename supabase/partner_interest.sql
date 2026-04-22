create table if not exists public.partner_interest (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  service_type text not null,
  created_at timestamptz not null default now(),
  constraint partner_interest_email_service_key unique (email, service_type)
);

create index if not exists partner_interest_service_type_idx on public.partner_interest (service_type);
create index if not exists partner_interest_created_at_idx on public.partner_interest (created_at desc);

grant all privileges on public.partner_interest to service_role;
grant all privileges on public.partner_interest to postgres;
