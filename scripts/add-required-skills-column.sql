ALTER TABLE public.employer_requests
ADD COLUMN IF NOT EXISTS required_skills text[] DEFAULT '{}';
