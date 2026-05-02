-- AM-WEB-076: legal_documents, legal_document_versions, legal_requests
-- Run in Supabase Website project (ktfgxaoxoboovjatgyam)

CREATE TABLE IF NOT EXISTS public.legal_documents (
  id text PRIMARY KEY,
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT '',
  content_md text NOT NULL DEFAULT '',
  last_updated timestamptz NOT NULL DEFAULT now(),
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_legal_documents" ON public.legal_documents;
CREATE POLICY "service_role_full_access_legal_documents"
  ON public.legal_documents
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_legal_documents" ON public.legal_documents;
CREATE POLICY "anon_select_legal_documents"
  ON public.legal_documents
  FOR SELECT
  TO anon
  USING (true);

CREATE TABLE IF NOT EXISTS public.legal_document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id text NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  content_md text NOT NULL,
  effective_from timestamptz NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by text
);

CREATE INDEX IF NOT EXISTS idx_legal_document_versions_doc_id ON public.legal_document_versions(document_id, version DESC);

ALTER TABLE public.legal_document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_legal_versions" ON public.legal_document_versions;
CREATE POLICY "service_role_full_access_legal_versions"
  ON public.legal_document_versions
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.legal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  identity_verification_method text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'received',
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_requests_status ON public.legal_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_requests_email ON public.legal_requests(email);

ALTER TABLE public.legal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_legal_requests" ON public.legal_requests;
CREATE POLICY "service_role_full_access_legal_requests"
  ON public.legal_requests
  TO service_role
  USING (true)
  WITH CHECK (true);
