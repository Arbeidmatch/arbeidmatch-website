create extension if not exists pgcrypto;

create table if not exists public.job_reactions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.employer_jobs (id) on delete cascade,
  candidate_hash text not null,
  reaction_type text check (reaction_type in ('like', 'dislike')),
  field_reactions jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (job_id, candidate_hash)
);

alter table public.employer_jobs add column if not exists view_count integer default 0;

create index if not exists job_reactions_job_id_idx on public.job_reactions (job_id);
create index if not exists job_reactions_reaction_type_idx on public.job_reactions (reaction_type);
create index if not exists job_reactions_candidate_hash_idx on public.job_reactions (candidate_hash);

alter table public.job_reactions enable row level security;

create or replace function public.set_job_reactions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_job_reactions_updated_at on public.job_reactions;
create trigger trg_job_reactions_updated_at
before update on public.job_reactions
for each row execute function public.set_job_reactions_updated_at();
