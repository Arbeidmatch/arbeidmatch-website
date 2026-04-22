# ArbeidMatch - Project Context

## Company
- Name: ArbeidMatch Norge AS
- Founder: Mirel Manoliu
- Org.nr: 935 667 089 MVA
- Address: Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway
- Email: post@arbeidmatch.no
- Website: arbeidmatch.no
- Business: Recruitment EU/EEA + Non-EU for Norwegian employers (blue-collar), authorized staffing company

## Stack
- Frontend: Next.js 16, App Router, TypeScript, Tailwind CSS
- Backend: Supabase (ktfgxaoxoboovjatgyam) - same project for site and ATS
- Deploy: Vercel (arbeidmatch.no)
- Repo: GitHub - Arbeidmatch/arbeidmatch-website (branch: main)
- Email SMTP: send.one.com, port 465, no-reply@arbeidmatch.no
- ATS: ats-two-omega.vercel.app (GitHub: Arbeidmatch/ats)

## Design System
- Navy: #0D1B2A, #0a0f18, #0f1923, #111e2e
- Gold: #C9A84C / hover: #b8953f
- Green: #1D9E75 / Red: #E24B4A
- Card: background rgba(255,255,255,0.03), border 1px solid rgba(201,168,76,0.15), border-radius 16px
- Button primary: linear-gradient(135deg, #C9A84C, #b8953f), color #0D1B2A, font-weight 700, border-radius 10px
- Spinner: .spinner-arc with @keyframes spin - white arc 20px stroke-width 2
- ZERO em-dash anywhere in code or text
- ZERO box-shadows - flat design + rgba glow
- ZERO console.log in production
- English only on the entire site

## Mandatory Rules
- ZERO em-dash in any file
- Do not modify graphics without explicit approval
- When modifying mobile do not touch desktop and vice versa
- Maximum 1 level of nesting in cards
- Never delete files
- Run npm run build + fix ALL TypeScript errors before commit
- Locked files: .env*, middleware.ts, supabaseAdmin.ts, dsbGuideCheckout.ts, dsb-guide/webhook/route.ts
- All API routes must use supabaseAdmin (service role key), never the public Supabase client
- Use maybeSingle() not single() on all Supabase queries

## Supabase Tables
- request_tokens - UUID token generated at first employer form step
- employer_requests - all employer form fields
- partners - partner domains (domain, company_name, active) - RLS enabled, service_role policy
- partner_sessions - secure partner sessions (session_token, request_token, expires_at 30 min, used)
- partner_requests - partner applications (email, company_name, org_number, phone, full_name, gdpr_consent, status, token)
- email_subscriptions - unsubscribe system (email, unsubscribe_token, subscribed, source)
- non_eu_leads - non-EU leads
- error_log - production errors
- Candidate - candidates from ATS (40 columns, preferenceTags jsonb currently NULL for all)
- Application - candidate applications

## RLS Grants Applied
- partners: service_role full access + GRANT ALL + GRANT service_role TO authenticator
- request_tokens: GRANT ALL TO service_role
- employer_requests: GRANT ALL TO service_role
- partner_sessions: GRANT ALL TO service_role

## Partners in DB
- people.no - People
- twinauto.no - Winther Auto Service
- fjellmark.no - Fjellmark AS
- bergebemanning.no - Berge Bemanning
- arbeidmatch.no - ArbeidMatch (for testing)

## Slack Channels
- #errors - production errors (SLACK_WEBHOOK_URL)
- #emprequests - employer requests (SLACK_WEBHOOK_EMPLOYERS)
- #contact-form - contact (SLACK_WEBHOOK_CONTACTS)
- #recruiter-network - recruiters (SLACK_WEBHOOK_RECRUITERS)
- #dsb-leads - DSB leads (SLACK_WEBHOOK_DSB_LEADS)
- #non-eu-leads - non-EU leads (SLACK_WEBHOOK_NON_EU)
- #cursor-tasks - Slack to GitHub Issues automation (SLACK_CURSOR_TASKS_CHANNEL_ID)

## Vercel Env Vars
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- SLACK_WEBHOOK_URL, SLACK_WEBHOOK_EMPLOYERS, SLACK_WEBHOOK_CONTACTS, SLACK_WEBHOOK_RECRUITERS, SLACK_WEBHOOK_DSB_LEADS, SLACK_WEBHOOK_NON_EU
- SLACK_SIGNING_SECRET
- SLACK_CURSOR_TASKS_CHANNEL_ID
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
- ANTHROPIC_API_KEY (GitHub Actions)
- ADMIN_PASSWORD
- GITHUB_ISSUES_TOKEN

## Partner Flows
### Partner Flow (existing partner):
1. Goes to /request, searches role
2. Clicks "I am a partner"
3. Partner verification modal opens - enters company email
4. Animated shield loading state
5. If found: "Check your inbox" - receives secure link valid 30 minutes
6. Link goes to /request/partner/[session_token] - redirects to wizard
7. Wizard skips company details (isPartnerFlow detection), goes straight to candidate request
8. Submit sends request

### Non-Partner Flow:
1. Goes to /request, searches role
2. Clicks "I am not a partner"
3. Sees 3 cards: Become a Partner / Premium Subscription / Pay per use
4. "Become a Partner" - opens modal, enters company email (no free providers)
5. Receives email with link to /become-a-partner?token=...
6. Fills company details form
7. Submits - receives "We will review and notify you when access is ready"
8. Mirel receives Slack notification with 3 buttons: Approve / Contact First / Reject
9. On Approve: domain added to partners, session created, email sent automatically
10. On Contact First: email sent "we will contact you"
11. On Reject: email sent politely

## What Was Built Today
- BetaBanner component (fixed bottom, gold pulse dot)
- /request page complete premium redesign:
  - Back buttons on all steps
  - Industry selection step
  - Role search step
  - Result step with "0" gradient number, beta badge, divider
  - "I am a partner" / "I am not a partner" buttons
  - Partner verification modal with animated shield loading, success state, not-found state, feedback form state
  - Non-partner cards with benefits, mobile carousel, uniform sizing
  - Waitlist capture with premium success card
  - Abandon flow confirmation dialog
- Fixed verify-partner: uses inline createClient with service role key
- Fixed all Supabase RLS issues: GRANT ALL + GRANT service_role TO authenticator
- Partner session links reusable (removed used:true marking)
- /become-a-partner page (noindex, premium design, 6 benefit cards, beta notice, CTA)
- src/app/api/candidates/route.ts - anonymized candidate profiles API
- src/app/api/candidate-interest/route.ts - partner interest notification
- src/app/request/partner/[session_token]/candidates/page.tsx - candidate profiles page
- src/app/api/partner-issue/route.ts - partner verification issue reporting to Slack
- src/app/api/slack/events/route.ts - Slack to GitHub Issues automation
- src/app/api/unsubscribe/route.ts - employer unsubscribe endpoint
- Warning email to non-recognized emails with unsubscribe option
- Premium partner verification email design
- Homepage cards equal height premium redesign
- Partner approval flow with Slack interactive buttons (FILES CREATED, NOT YET TESTED):
  - src/app/api/partner-request/route.ts
  - src/app/api/partner-request/start/route.ts
  - src/app/api/slack/interactions/route.ts

## PENDING / TODO

### URGENT - Not yet working:
1. Slack #cursor-tasks to GitHub Issues - Event Subscriptions not fully configured (message.channels not saved yet)
2. Employer wizard submit still failing - boolean/string field mismatch in Zod schema (hasRotation, internationalTravel, localTravel, subscribe, phone)
3. Partner approval Slack interactive buttons - built but not tested
4. partner_requests table - needs to be created in Supabase (run supabase/partner_requests.sql)

### HIGH:
5. Non-partner "Become a Partner" modal - email input + /api/partner-request/start flow not yet connected in UI
6. /become-a-partner page - needs to read token from URL and show company details form
7. All forms premium redesign - prompt sent to Cursor but not confirmed complete
8. Content protection on profile pages - disable right-click, print, scraping
9. Branch protection on main in GitHub

### MEDIUM:
10. Success screen for employer wizard after successful submit
11. DSB content consolidation - move all DSB-related content to /electricians-norway only
12. Norway Work Guide - new product (planning phase)
13. Credits system - Pay as you go + Partner plan (planning phase)

### LOW:
14. RLS on error_log and non_eu_leads
15. Light/dark theme switcher

## IMPORTANT INSTRUCTIONS FOR NEW CONVERSATIONS
When starting a new conversation, always:
1. Read this file first
2. Check PENDING/TODO section
3. Start with URGENT items
4. Update this file after every completed task under a ## Changelog section at the bottom

## Changelog
### 2026-04-21
- Complete session described above
