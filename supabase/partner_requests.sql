CREATE TABLE IF NOT EXISTS partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  company_name text,
  org_number text,
  phone text,
  full_name text,
  gdpr_consent boolean DEFAULT false,
  status text DEFAULT 'pending',
  token text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access"
ON partner_requests
TO service_role
USING (true)
WITH CHECK (true);
