-- request_tokens table for arbeidmatch.no/request employer wizard
-- Apply this in the Supabase Dashboard SQL editor:
-- https://supabase.com/dashboard/project/ktfgxaoxoboovjatgyam/sql/new

CREATE TABLE IF NOT EXISTS public.request_tokens (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token                  uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  full_name              text        NOT NULL,
  company                text        NOT NULL,
  email                  text        NOT NULL,
  phone                  text        NOT NULL DEFAULT '',
  org_number             text        NULL,
  job_summary            text        NOT NULL DEFAULT 'General hiring inquiry',
  gdpr_consent           boolean     NOT NULL DEFAULT false,
  how_did_you_hear       text        NULL,
  social_media_platform  text        NULL,
  how_did_you_hear_other text        NULL,
  referral_company_name  text        NULL,
  referral_org_number    text        NULL,
  referral_email         text        NULL,
  expires_at             timestamptz NOT NULL,
  used                   boolean     NOT NULL DEFAULT false,
  industry               text        NULL,
  role                   text        NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS request_tokens_token_idx      ON public.request_tokens (token);
CREATE INDEX IF NOT EXISTS request_tokens_email_idx      ON public.request_tokens (lower(email));
CREATE INDEX IF NOT EXISTS request_tokens_expires_at_idx ON public.request_tokens (expires_at);

ALTER TABLE public.request_tokens ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.request_tokens IS 'Secure tokens for arbeidmatch.no/request employer wizard.';

-- Grant table-level privileges so the Supabase client (service_role key) and anon can INSERT.
-- Without these, PostgreSQL raises "permission denied for table request_tokens" (error 42501)
-- even though RLS is enabled — table privileges are checked before RLS policies.
GRANT ALL ON public.request_tokens TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_tokens TO service_role;
GRANT USAGE ON SEQUENCE public.request_tokens_id_seq TO service_role;
GRANT ALL ON SEQUENCE public.request_tokens_id_seq TO postgres;
GRANT SELECT, INSERT, UPDATE ON public.request_tokens TO anon;
