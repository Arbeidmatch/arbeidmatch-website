# Database Tables

## Tables with SQL definitions in /supabase folder

- dsb_guides
- dsb_guide_purchases
- dsb_waitlist
- premium_subscribers
- site_settings
- guide_interest_signups
- candidate_feedback_submissions

## Tables used in code but WITHOUT SQL definition in repo

(Schema exists in Supabase Dashboard only)

- request_tokens
- employer_requests
- app_waitlist
- recruiter_applications
- discount_leads
- dsb_leads

## Action required

Export schema for tables without SQL definition from Supabase Dashboard and add to `/supabase` folder for version control.

## RLS Status

- Verify Row Level Security is enabled on all tables in Supabase Dashboard.
- Service role key bypasses RLS (used in API routes only, never client-side).
