-- ArbeidMatch Security Advisor RLS Fixes
-- Enables RLS and creates policies for all tables

-- Enable RLS on all tables
ALTER TABLE IF EXISTS public.request_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guide_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "service_role_full_access" ON public.request_tokens;
DROP POLICY IF EXISTS "authenticated_read_own" ON public.request_tokens;
DROP POLICY IF EXISTS "service_role_full_access" ON public.employer_requests;
DROP POLICY IF EXISTS "authenticated_read_own" ON public.employer_requests;
DROP POLICY IF EXISTS "service_role_full_access" ON public.guide_purchases;
DROP POLICY IF EXISTS "service_role_full_access" ON public.guides;
DROP POLICY IF EXISTS "public_read" ON public.guides;
DROP POLICY IF EXISTS "service_role_full_access" ON public.waitlist;
DROP POLICY IF EXISTS "service_role_full_access" ON public.error_log;
DROP POLICY IF EXISTS "service_role_full_access" ON public.partner_requests;

-- Create policies for request_tokens
CREATE POLICY "service_role_full_access" ON public.request_tokens
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_own" ON public.request_tokens
FOR SELECT TO authenticated
USING (auth.uid()::text = user_id);

-- Create policies for employer_requests
CREATE POLICY "service_role_full_access" ON public.employer_requests
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_own" ON public.employer_requests
FOR SELECT TO authenticated
USING (auth.uid()::text = employer_id);

-- Create policies for guide_purchases
CREATE POLICY "service_role_full_access" ON public.guide_purchases
TO service_role USING (true) WITH CHECK (true);

-- Create policies for guides
CREATE POLICY "service_role_full_access" ON public.guides
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read" ON public.guides
FOR SELECT TO anon, authenticated
USING (true);

-- Create policies for waitlist
CREATE POLICY "service_role_full_access" ON public.waitlist
TO service_role USING (true) WITH CHECK (true);

-- Create policies for error_log
CREATE POLICY "service_role_full_access" ON public.error_log
TO service_role USING (true) WITH CHECK (true);

-- Create policies for partner_requests
CREATE POLICY "service_role_full_access" ON public.partner_requests
TO service_role USING (true) WITH CHECK (true);

-- Grant permissions to service_role
GRANT ALL ON public.request_tokens TO service_role;
GRANT ALL ON public.employer_requests TO service_role;
GRANT ALL ON public.guide_purchases TO service_role;
GRANT ALL ON public.guides TO service_role;
GRANT ALL ON public.waitlist TO service_role;
GRANT ALL ON public.error_log TO service_role;
GRANT ALL ON public.partner_requests TO service_role;
