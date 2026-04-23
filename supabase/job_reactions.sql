create extension if not exists pgcrypto;

create table if not exists public.job_reactions (
  id uuid primary key default gen_random_uuid(),
  job_id text not null,
  candidate_fingerprint text not null,
  reaction text null check (reaction in ('like', 'dislike')),
  field_key text null check (field_key in ('salary', 'location', 'rotation', 'contract_type')),
  field_reaction text null check (field_reaction in ('happy', 'neutral', 'concerned')),
  viewed_at timestamptz null,
  premium_only_reactions boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists job_reactions_job_candidate_unique
  on public.job_reactions (job_id, candidate_fingerprint);

create index if not exists job_reactions_job_id_idx on public.job_reactions (job_id);
create index if not exists job_reactions_reaction_idx on public.job_reactions (reaction);
create index if not exists job_reactions_field_idx on public.job_reactions (field_key, field_reaction);

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
