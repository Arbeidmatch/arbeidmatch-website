create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  email text not null unique,
  contact_name text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Partner onboarding + DocuSign (safe to re-run)
alter table public.partners add column if not exists domain text;
alter table public.partners add column if not exists org_number text;
alter table public.partners add column if not exists phone text;
alter table public.partners add column if not exists partnership_type text;
alter table public.partners add column if not exists verification_status text default 'verified';
alter table public.partners add column if not exists docusign_envelope_id text;
alter table public.partners add column if not exists terms_accepted_at timestamptz;
alter table public.partners add column if not exists signed_at timestamptz;
alter table public.partners add column if not exists updated_at timestamptz default now();

create table if not exists public.partner_sessions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  session_token uuid default gen_random_uuid() not null unique,
  request_token text,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);
