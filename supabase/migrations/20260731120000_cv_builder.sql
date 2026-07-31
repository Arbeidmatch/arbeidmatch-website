-- CV builder (arbeidmatch.no/cv and /cv-gen).
-- Target project: arbeidmatch-ats (navzhgscvzngzbfxayoh), which serves both the ATS and the website.
-- Rollback: supabase/migrations/20260731120000_cv_builder_rollback.sql
--
-- Access model: RLS is enabled on every table with NO policies, so anon and
-- authenticated can read nothing. Every read and write goes through our API
-- routes using the service role key.

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Candidates created by the CV generator, only after a verified OTP consent.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_candidates (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized citext      NOT NULL UNIQUE,
  first_name       text        NULL,
  last_name        text        NULL,
  phone            text        NULL,
  city             text        NULL,
  country          text        NULL,
  headline         text        NULL,
  status           text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'erased')),
  source           text        NOT NULL DEFAULT 'cv-generator',
  marketing_opt_in boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  erased_at        timestamptz NULL
);

COMMENT ON TABLE public.cv_candidates IS 'Work profiles created by the free CV generator. Consent proof lives in cv_consents.';

-- ---------------------------------------------------------------------------
-- Consent records. Append only: never UPDATE a row here, insert a new one.
-- candidate_id is nulled on erasure while the row itself is retained as proof
-- of the lawful basis under which the data was processed.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_consents (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id         uuid        NULL REFERENCES public.cv_candidates (id) ON DELETE SET NULL,
  candidate_email_hash text        NOT NULL,
  consent_privacy      boolean     NOT NULL,
  consent_work_profile boolean     NOT NULL,
  consent_marketing    boolean     NOT NULL DEFAULT false,
  policy_version       text        NOT NULL,
  policy_text_sha256   text        NOT NULL,
  otp_verified_at      timestamptz NOT NULL,
  ip_hash              text        NULL,
  user_agent           text        NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cv_consents_required_consents CHECK (consent_privacy AND consent_work_profile)
);

CREATE INDEX IF NOT EXISTS cv_consents_candidate_idx ON public.cv_consents (candidate_id);
CREATE INDEX IF NOT EXISTS cv_consents_email_hash_idx ON public.cv_consents (candidate_email_hash);

COMMENT ON TABLE public.cv_consents IS 'Append only GDPR consent proof. Survives erasure with candidate_id set to null.';

-- ---------------------------------------------------------------------------
-- One time codes. Only the hashed email and hashed code are stored, so nothing
-- here identifies a person before they verify.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_otp (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash  text        NOT NULL,
  code_hash   text        NOT NULL,
  expires_at  timestamptz NOT NULL,
  attempts    int         NOT NULL DEFAULT 0,
  consumed_at timestamptz NULL,
  ip_hash     text        NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cv_otp_email_hash_created_idx ON public.cv_otp (email_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS cv_otp_ip_hash_created_idx ON public.cv_otp (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS cv_otp_expires_idx ON public.cv_otp (expires_at);

COMMENT ON TABLE public.cv_otp IS 'Hashed CV generator OTP codes. Rows are deleted 24 hours after creation.';

-- ---------------------------------------------------------------------------
-- Generated documents. payload holds a validated CvDocument.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id     uuid        NOT NULL REFERENCES public.cv_candidates (id) ON DELETE CASCADE,
  kind             text        NOT NULL CHECK (kind IN ('cv', 'cover_letter')),
  template_id      text        NOT NULL,
  payload          jsonb       NOT NULL,
  storage_path     text        NULL,
  pdf_sha256       text        NULL,
  ats_pushed_at    timestamptz NULL,
  recman_pushed_at timestamptz NULL,
  push_attempts    int         NOT NULL DEFAULT 0,
  push_last_error  text        NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cv_documents_candidate_idx ON public.cv_documents (candidate_id);
CREATE INDEX IF NOT EXISTS cv_documents_created_idx ON public.cv_documents (created_at);

COMMENT ON TABLE public.cv_documents IS 'Generated CVs and cover letters. Hard deleted after 24 months together with their storage objects.';

-- ---------------------------------------------------------------------------
-- Short lived, single use tokens for download, self service access and erasure.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_access_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid        NULL REFERENCES public.cv_candidates (id) ON DELETE CASCADE,
  token_hash   text        NOT NULL UNIQUE,
  purpose      text        NOT NULL CHECK (purpose IN ('download', 'my-data', 'delete')),
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cv_access_tokens_candidate_idx ON public.cv_access_tokens (candidate_id);
CREATE INDEX IF NOT EXISTS cv_access_tokens_expires_idx ON public.cv_access_tokens (expires_at);

-- ---------------------------------------------------------------------------
-- Consent declines. No personal data, only a random session id, so we can see
-- how many people abandon the consent step.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cv_consent_declines (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text        NOT NULL,
  step       text        NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.cv_consent_declines IS 'Abandonment counter for the consent modal. Contains no personal data.';

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cv_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cv_candidates_set_updated_at ON public.cv_candidates;
CREATE TRIGGER cv_candidates_set_updated_at
  BEFORE UPDATE ON public.cv_candidates
  FOR EACH ROW EXECUTE FUNCTION public.cv_set_updated_at();

-- ---------------------------------------------------------------------------
-- Retention. Called by the Vercel cron route /api/cron/cv-retention.
--   cv_otp                 deleted after 24 hours
--   cv_access_tokens       deleted 7 days after expiry
--   cv_documents           deleted after 24 months (storage objects removed by the caller)
--   cv_consent_declines    deleted after 12 months
-- Returns the storage paths the caller must delete from the bucket.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cv_run_retention()
RETURNS TABLE (storage_path text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.cv_otp WHERE created_at < now() - interval '24 hours';
  DELETE FROM public.cv_access_tokens WHERE expires_at < now() - interval '7 days';
  DELETE FROM public.cv_consent_declines WHERE created_at < now() - interval '12 months';

  RETURN QUERY
  WITH expired AS (
    DELETE FROM public.cv_documents
    WHERE created_at < now() - interval '24 months'
    RETURNING cv_documents.storage_path
  )
  SELECT expired.storage_path FROM expired WHERE expired.storage_path IS NOT NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Erasure. Anonymises the candidate, keeps the consent rows as proof with the
-- candidate link removed, deletes the documents and returns their storage paths.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cv_erase_candidate(p_candidate_id uuid)
RETURNS TABLE (storage_path text)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.cv_consents
     SET candidate_id = NULL
   WHERE candidate_id = p_candidate_id;

  DELETE FROM public.cv_access_tokens WHERE candidate_id = p_candidate_id;

  RETURN QUERY
  WITH removed AS (
    DELETE FROM public.cv_documents
    WHERE candidate_id = p_candidate_id
    RETURNING cv_documents.storage_path
  ),
  anonymised AS (
    UPDATE public.cv_candidates
       SET status           = 'erased',
           erased_at        = now(),
           email_normalized = ('erased-' || p_candidate_id::text || '@invalid')::citext,
           first_name       = NULL,
           last_name        = NULL,
           phone            = NULL,
           city             = NULL,
           country          = NULL,
           headline         = NULL,
           marketing_opt_in = false
     WHERE id = p_candidate_id
    RETURNING 1
  )
  SELECT removed.storage_path FROM removed WHERE removed.storage_path IS NOT NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- Private storage bucket. Objects are served only through 15 minute signed URLs.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cv-documents', 'cv-documents', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['application/pdf'];

-- ---------------------------------------------------------------------------
-- RLS on, no policies. Service role bypasses RLS; anon and authenticated get nothing.
-- ---------------------------------------------------------------------------
ALTER TABLE public.cv_candidates       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_consents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_otp              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_access_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_consent_declines ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cv_candidates       FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_consents         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_otp              FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_documents        FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_access_tokens    FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cv_consent_declines FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.cv_candidates       FROM anon, authenticated;
REVOKE ALL ON public.cv_consents         FROM anon, authenticated;
REVOKE ALL ON public.cv_otp              FROM anon, authenticated;
REVOKE ALL ON public.cv_documents        FROM anon, authenticated;
REVOKE ALL ON public.cv_access_tokens    FROM anon, authenticated;
REVOKE ALL ON public.cv_consent_declines FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_candidates       TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_consents         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_otp              TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_documents        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_access_tokens    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cv_consent_declines TO service_role;

REVOKE ALL ON FUNCTION public.cv_run_retention() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cv_erase_candidate(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cv_run_retention() TO service_role;
GRANT EXECUTE ON FUNCTION public.cv_erase_candidate(uuid) TO service_role;
