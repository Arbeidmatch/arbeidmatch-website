-- Candidate anonymous feedback storage for weekly reporting
create table if not exists public.candidate_feedback_submissions (
  id bigint generated always as identity primary key,
  source text not null,
  purpose text not null,
  page_url text not null,
  score integer not null check (score between 1 and 10),
  note text,
  email text,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists candidate_feedback_submissions_created_at_idx
  on public.candidate_feedback_submissions (created_at desc);

create index if not exists candidate_feedback_submissions_anonymous_created_at_idx
  on public.candidate_feedback_submissions (is_anonymous, created_at desc);

create index if not exists candidate_feedback_submissions_page_url_idx
  on public.candidate_feedback_submissions (page_url);

alter table public.candidate_feedback_submissions enable row level security;

-- Service-role calls (used by Next.js API routes) bypass RLS automatically.
-- Keep public access blocked by default.
