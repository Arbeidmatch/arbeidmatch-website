-- Enable RLS on all existing tables
ALTER TABLE IF EXISTS public.request_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for request_tokens
DROP POLICY IF EXISTS "service_role_full" ON public.request_tokens;
DROP POLICY IF EXISTS "auth_read_own" ON public.request_tokens;

CREATE POLICY "service_role_full" ON public.request_tokens
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_own" ON public.request_tokens
FOR SELECT TO authenticated
USING (auth.uid()::text = user_id);

-- Create RLS policies for employer_requests
DROP POLICY IF EXISTS "service_role_full" ON public.employer_requests;
DROP POLICY IF EXISTS "auth_read_own" ON public.employer_requests;

CREATE POLICY "service_role_full" ON public.employer_requests
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "auth_read_own" ON public.employer_requests
FOR SELECT TO authenticated
USING (auth.uid()::text = employer_id);

-- Create RLS policies for guides (public read)
DROP POLICY IF EXISTS "service_role_full" ON public.guides;
DROP POLICY IF EXISTS "public_read" ON public.guides;

CREATE POLICY "service_role_full" ON public.guides
TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "public_read" ON public.guides
FOR SELECT TO anon, authenticated USING (true);

-- Create RLS policies for waitlist
DROP POLICY IF EXISTS "service_role_full" ON public.waitlist;

CREATE POLICY "service_role_full" ON public.waitlist
TO service_role USING (true) WITH CHECK (true);

-- Create RLS policies for error_log
DROP POLICY IF EXISTS "service_role_full" ON public.error_log;

CREATE POLICY "service_role_full" ON public.error_log
TO service_role USING (true) WITH CHECK (true);

-- Create RLS policies for partner_requests
DROP POLICY IF EXISTS "service_role_full" ON public.partner_requests;

CREATE POLICY "service_role_full" ON public.partner_requests
TO service_role USING (true) WITH CHECK (true);

-- Grant permissions to service_role
GRANT ALL ON public.request_tokens TO service_role;
GRANT ALL ON public.employer_requests TO service_role;
GRANT ALL ON public.guides TO service_role;
GRANT ALL ON public.waitlist TO service_role;
GRANT ALL ON public.error_log TO service_role;
GRANT ALL ON public.partner_requests TO service_role;
