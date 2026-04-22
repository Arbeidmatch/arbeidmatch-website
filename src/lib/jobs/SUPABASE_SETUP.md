## Supabase Setup For Job Applications

Run the SQL below in Supabase SQL Editor.

```sql
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  job_slug text not null,
  job_title text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  current_country text not null,
  city text not null,
  work_authorization text not null,
  years_experience text not null,
  trade text not null,
  english_level text not null,
  norwegian_level text not null,
  driving_licence text not null,
  availability text not null,
  message text null,
  gdpr_consent boolean not null default false,
  cv_storage_bucket text not null,
  cv_storage_path text not null,
  cv_file_name text not null,
  cv_file_size bigint not null,
  status text not null default 'new',
  source text not null default 'job-board',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  match_score integer null,
  match_summary text null,
  profile_snapshot jsonb null
);

create index if not exists idx_job_applications_job_slug on public.job_applications(job_slug);
create index if not exists idx_job_applications_email on public.job_applications(email);
create index if not exists idx_job_applications_status on public.job_applications(status);
```

Create private storage bucket for CV files:

```sql
insert into storage.buckets (id, name, public)
values ('job-cvs', 'job-cvs', false)
on conflict (id) do nothing;
```

Optional environment variable override:

- `SUPABASE_JOB_CV_BUCKET=job-cvs`

## Candidate profiles (site)

Run `supabase/candidates.sql` in Supabase SQL Editor to create the `candidates` table used by `/candidates` profile completion.

If your `job_applications` table was created earlier, run `supabase/job_applications_match_fields.sql` to add optional match metadata columns.
