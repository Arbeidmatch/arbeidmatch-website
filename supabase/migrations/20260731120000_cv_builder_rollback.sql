-- Rollback for 20260731120000_cv_builder.sql
-- Destructive: drops every CV builder table and its data. Empty the storage
-- bucket first, otherwise the bucket delete fails on remaining objects.
--
-- Run manually, never as part of the normal migration sequence.

DROP FUNCTION IF EXISTS public.cv_erase_candidate(uuid);
DROP FUNCTION IF EXISTS public.cv_run_retention();

DROP TRIGGER IF EXISTS cv_candidates_set_updated_at ON public.cv_candidates;
DROP FUNCTION IF EXISTS public.cv_set_updated_at();

DROP TABLE IF EXISTS public.cv_consent_declines;
DROP TABLE IF EXISTS public.cv_access_tokens;
DROP TABLE IF EXISTS public.cv_documents;
DROP TABLE IF EXISTS public.cv_otp;
DROP TABLE IF EXISTS public.cv_consents;
DROP TABLE IF EXISTS public.cv_candidates;

DELETE FROM storage.objects WHERE bucket_id = 'cv-documents';
DELETE FROM storage.buckets WHERE id = 'cv-documents';

-- citext is left in place: other tables may rely on it.
