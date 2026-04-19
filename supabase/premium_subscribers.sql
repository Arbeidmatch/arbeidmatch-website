-- Run in Supabase SQL Editor (or via migration) before enabling Premium APIs.
CREATE TABLE IF NOT EXISTS premium_subscribers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text CHECK (plan IN ('monthly', 'annual')),
  status text CHECK (status IN ('trialing', 'active', 'canceled', 'past_due')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  subscribed_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS premium_subscribers_email_idx ON premium_subscribers (lower(email));
