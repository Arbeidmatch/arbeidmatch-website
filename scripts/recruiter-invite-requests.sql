-- ArbeidMatch Recruiter Invite Requests
-- AM-WEB-088: BETA invite-only model

CREATE TABLE IF NOT EXISTS public.recruiter_invite_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  motivation text NOT NULL,
  experience_summary text,
  status text NOT NULL DEFAULT 'pending',
  invited_at timestamptz,
  invited_by_email text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_invite_status
  ON public.recruiter_invite_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recruiter_invite_email
  ON public.recruiter_invite_requests(email);

ALTER TABLE public.recruiter_invite_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_recruiter_invites" ON public.recruiter_invite_requests;
CREATE POLICY "service_role_full_access_recruiter_invites"
  ON public.recruiter_invite_requests
  TO service_role
  USING (true)
  WITH CHECK (true);
