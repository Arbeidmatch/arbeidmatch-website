-- Company country for employer intake (Norway / Denmark / Sweden).
alter table public.employer_requests add column if not exists company_country text;

alter table public.request_tokens add column if not exists company_country text;
