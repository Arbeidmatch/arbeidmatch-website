-- Job expiry, audit log, employer_jobs notification flags (idempotent).
-- Run in Supabase SQL editor or via migration pipeline.

-- ---------------------------------------------------------------------------
-- employer_jobs: expiry + renewal + reminder flags
-- ---------------------------------------------------------------------------
alter table public.employer_jobs
  add column if not exists expires_at timestamptz,
  add column if not exists notification_sent_7d boolean not null default false,
  add column if not exists notification_sent_3d boolean not null default false,
  add column if not exists notification_sent_1d boolean not null default false,
  add column if not exists notification_sent_expiry boolean not null default false,
  add column if not exists renew_token uuid;

update public.employer_jobs
set expires_at = created_at + interval '30 days'
where expires_at is null;

update public.employer_jobs
set renew_token = gen_random_uuid()
where renew_token is null and status = 'live';

alter table public.employer_jobs
  alter column expires_at set not null;

alter table public.employer_jobs drop constraint if exists employer_jobs_status_check;
alter table public.employer_jobs
  add constraint employer_jobs_status_check
  check (status in ('draft', 'live', 'closed', 'archived'));

create index if not exists employer_jobs_expires_at_idx on public.employer_jobs (expires_at);
create index if not exists employer_jobs_live_expiry_idx on public.employer_jobs (status, expires_at) where status = 'live';

-- Listing validity: exactly 30 days from created_at (overwrites client-supplied expires_at on insert).
create or replace function public.set_employer_job_expires_at()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.created_at + interval '30 days';
  return new;
end;
$$;

drop trigger if exists trg_employer_jobs_expires_at on public.employer_jobs;
create trigger trg_employer_jobs_expires_at
before insert on public.employer_jobs
for each row execute function public.set_employer_job_expires_at();

-- ---------------------------------------------------------------------------
-- master_audit_log
-- ---------------------------------------------------------------------------
create table if not exists public.master_audit_log (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists master_audit_log_created_at_idx on public.master_audit_log (created_at desc);
create index if not exists master_audit_log_event_type_idx on public.master_audit_log (event_type);
create index if not exists master_audit_log_entity_idx on public.master_audit_log (entity_type, entity_id);

alter table public.master_audit_log enable row level security;

drop policy if exists "service_role_master_audit_log" on public.master_audit_log;
create policy "service_role_master_audit_log" on public.master_audit_log
  to service_role using (true) with check (true);

grant all on public.master_audit_log to service_role;

-- Optional: first Stage-1 employer view timestamp (for audit / analytics)
alter table public.job_applications
  add column if not exists employer_stage1_viewed_at timestamptz;
