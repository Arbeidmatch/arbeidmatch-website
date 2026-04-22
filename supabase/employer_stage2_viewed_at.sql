-- First Stage-2 employer view timestamp (audit / parity with stage 1).
alter table public.job_applications
  add column if not exists employer_stage2_viewed_at timestamptz;
