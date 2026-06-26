-- OTP storage for /request access (partner + new company flows)
-- Apply in Supabase SQL editor for project ktfgxaoxoboovjatgyam

CREATE TABLE IF NOT EXISTS public.request_access_otps (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  verification_id     uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email               text        NOT NULL,
  otp_hash            text        NOT NULL,
  flow_type           text        NOT NULL CHECK (flow_type IN ('partner', 'new_company')),
  attempt_count       int         NOT NULL DEFAULT 0,
  consumed_at         timestamptz NULL,
  request_token       uuid        NULL,
  expires_at          timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  partner_company_id   text        NULL,
  partner_company_name text        NULL,
  partner_org_number  text        NULL,
  industry            text        NULL,
  role                text        NULL,
  gdpr_consent        boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS request_access_otps_email_flow_created_idx
  ON public.request_access_otps (lower(email), flow_type, created_at DESC);

CREATE INDEX IF NOT EXISTS request_access_otps_verification_id_idx
  ON public.request_access_otps (verification_id);

ALTER TABLE public.request_tokens
  ADD COLUMN IF NOT EXISTS ats_company_id text NULL;

COMMENT ON TABLE public.request_access_otps IS 'Hashed OTP codes for arbeidmatch.no/request email verification.';
COMMENT ON COLUMN public.request_tokens.ats_company_id IS 'ATS ats_companies.id when partner verified via public API.';

ALTER TABLE public.request_access_otps ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.request_access_otps TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.request_access_otps TO service_role;
GRANT USAGE ON SEQUENCE public.request_access_otps_id_seq TO service_role;
GRANT ALL ON SEQUENCE public.request_access_otps_id_seq TO postgres;
