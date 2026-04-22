-- Run on existing databases (idempotent)
alter table public.employer_requests add column if not exists branding_requested boolean not null default false;
alter table public.employer_requests add column if not exists branding_price numeric(10,2) not null default 0;
