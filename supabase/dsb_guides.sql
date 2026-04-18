-- DSB guide products, purchases, and waitlist (run in Supabase SQL editor if not applied via migration)

create table if not exists public.dsb_guides (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  price_eur integer not null,
  stripe_price_id text not null,
  created_at timestamp with time zone default now()
);

create table if not exists public.dsb_guide_purchases (
  id uuid default gen_random_uuid() primary key,
  guide_slug text not null references public.dsb_guides (slug),
  email text not null,
  stripe_session_id text unique not null,
  stripe_payment_status text default 'pending',
  access_token text unique not null,
  token_expires_at timestamp with time zone not null,
  accessed_at timestamp with time zone,
  access_count integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.dsb_waitlist (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  email text not null,
  country text not null,
  applicant_type text not null,
  gdpr_consent boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Seed guides (replace stripe_price_id with real Price IDs from Stripe Dashboard)
insert into public.dsb_guides (slug, title, price_eur, stripe_price_id)
values
  ('eu', 'DSB Guide for EU/EEA Electricians', 19, 'price_REPLACE_WITH_STRIPE_PRICE_ID_EU'),
  ('non-eu', 'DSB Guide for Non-EU Electricians', 49, 'price_REPLACE_WITH_STRIPE_PRICE_ID_NON_EU')
on conflict (slug) do nothing;

-- After creating products in Stripe, update:
-- update public.dsb_guides set stripe_price_id = 'price_xxx' where slug = 'eu';
-- update public.dsb_guides set stripe_price_id = 'price_yyy' where slug = 'non-eu';
