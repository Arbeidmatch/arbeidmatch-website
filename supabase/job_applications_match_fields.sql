alter table public.job_applications
  add column if not exists match_score integer,
  add column if not exists match_summary text,
  add column if not exists profile_snapshot jsonb;

create index if not exists idx_job_applications_match_score on public.job_applications (match_score);
