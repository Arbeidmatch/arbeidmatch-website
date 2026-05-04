-- Candidate magic-link invite interest (AM-WEB-111). Apply via Supabase SQL editor or CLI.

create table if not exists public.candidate_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  gdpr_consent boolean not null default true,
  consented_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  status text not null default 'pending' check (status in ('pending', 'invited', 'registered'))
);

create index if not exists candidate_invites_email_idx on public.candidate_invites (email);
create index if not exists candidate_invites_consented_at_idx on public.candidate_invites (consented_at desc);

comment on table public.candidate_invites is 'Candidate email invite requests with GDPR consent (AM-WEB-111).';
