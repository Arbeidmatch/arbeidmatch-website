# GDPR og personvernrevisjon — arbeidmatch.no

**Controller:** ArbeidMatch Norge AS, org.nr. 935 667 089, Sverre Svendsens veg 38, 7056 Ranheim, Trondheim
**Scope:** the `arbeidmatch-website` repository (public marketing site + API routes) and the Supabase
project it writes to (`arbeidmatch-ats`, ref `navzhgscvzngzbfxayoh`).
**Audit date:** 15 September 2026 · **Auditor:** Claude Code (automated code audit)
**Method:** source review of all 396 files under `src/`, all 21 SQL scripts under `supabase/`,
`scripts/` and `docs/`, plus read-only queries against the live Supabase project
(`pg_class`, `pg_policy`, `storage.buckets`, row counts, `ats_legal_templates`).

> **Scope limits, stated up front.** Three things could not be verified from this repository and
> are flagged as *unverified* wherever they appear, never assumed:
> 1. **The ATS (`ats.arbeidmatch.no`) is a separate deployment.** Job applications, CV files,
>    candidate records and job-alert delivery are *forwarded* there by this site. The controls on
>    the far side (file gate, retention clock, consent rules, 2FA) are asserted in this repo's
>    comments but live in `ats-recruitment`. **A second audit of that repository is required** before
>    ArbeidMatch can claim end-to-end compliance. The outbound proxy in this environment blocks
>    `ats.arbeidmatch.no`, so nothing there was tested.
> 2. **Whether a databehandleravtale (DPA) exists** with each processor is a commercial fact, not a
>    code fact. This report lists what the code *uses*; §5 records DPA status as "must be confirmed".
> 3. **`jobs.arbeidmatch.no`** (the candidate portal, and the source of the known implied-consent
>    cookie issue) is not in this repository and was not audited.

---

## (a) Executive summary

The engineering baseline here is genuinely better than most staffing-sector sites. Row Level
Security is **enabled on every one of the 28 personal-data tables** in the live database, with no
permissive `anon` read policy on any of them (verified, not assumed — `pg_policy` query, §5.1). The
database and Vercel both run in the EEA (verified: `eu-west-1`, `fra1`). The CV generator is a
model of consent engineering: nothing touches a server before a verified OTP, consent text is
SHA-256 pinned and versioned, erasure is a real `DELETE`, and a daily cron actually runs.

The compliance failures are concentrated elsewhere, and they are serious: a **pre-ticked marketing
consent box**, an **admin password shipped in the public JavaScript bundle**, **no working deletion
mechanism for 15 of 21 tables**, a **published Privacy Notice that contradicts the code in at least
nine places**, a **`/cookies` page that 404s while the notice links to it**, and a cookie banner that
offers no choice and no way to revoke. No DPIA exists.

**Overall exposure: HIGH.** Volumes are currently tiny (22 candidates, 1 employer request, 0 CV
profiles — verified by row count), which limits present harm and makes this the cheapest possible
moment to fix everything before scale.

| # | Area | Rating | One-line verdict |
|---|------|--------|------------------|
| 1 | Data inventory & mapping | **MEDIUM** | 21 tables + 1 bucket mapped; no register existed before this document. |
| 2 | Legal basis & transparency | **CRITICAL** | Pre-ticked consent (F-01); notice contradicts code in 9 places (F-09); CV generator wholly undisclosed (F-10). |
| 3 | Data subject rights | **HIGH** | Excellent for CV data, absent everywhere else. No export, no erasure, no cascade for 15 tables (F-12). |
| 4 | Retention | **CRITICAL** | One working cron covers 6 tables. 15 tables have **no deletion mechanism at all** (F-15). Notice promises periods nothing enforces. |
| 5 | Security & processors | **HIGH** | RLS is sound. But admin password in client bundle (F-02); 4 undisclosed non-EEA processors (F-08); no 2FA despite the notice claiming it (F-22). |
| 6 | Cookies & tracking | **HIGH** | No third-party pixels (good). But `/cookies` 404s (F-05), banner has no reject/revoke (F-06), notice cites a non-existent consent manager. |
| 7 | Automated decisions & AI | **MEDIUM** | No LLM calls in this repo (verified). A `compatibilityScore` is shown to partners with no Art. 22/13(2)(f) disclosure (F-19). **No DPIA (F-21).** |

**The six things to fix this week:** F-01 (pre-ticked consent), F-02 (admin password in bundle),
F-05 (`/cookies` 404), F-06 (cookie banner), F-15 (retention crons), F-09/F-10 (rewrite the notice).

---

## (b) Data inventory

### B.1 Where personal data enters

| # | Entry point | File | Data collected | Lands in |
|---|-------------|------|----------------|----------|
| 1 | Employer request wizard | `src/app/request/[token]/page.tsx` → `src/app/api/save-employer-request/route.ts` | Contact name, email, phone, company, org.nr., advert contact, full job spec, free-text notes | `employer_requests` (+ full raw copy in `form_answers`) |
| 2 | Request access OTP | `src/app/api/request-otp/route.ts` | Email (plaintext), hashed OTP, company, org.nr. | `request_access_otps` |
| 3 | Request token mint | `src/app/api/verify-partner/route.ts`, `verify-request-otp` | Name, company, email, phone, org.nr. | `request_tokens` |
| 4 | Contact form | `src/app/api/contact/route.ts` | Name, company, email, message | e-mail + Slack only (not stored) |
| 5 | CV generator | `src/app/cv-gen/` → `src/app/api/cv/consent/verify/route.ts` | Full CV: name, email, phone, city, country, work-permit status, driving licences, work history, education, certificates, skills, languages, cover letter | `cv_candidates`, `cv_documents`, `cv_consents`, bucket `cv-documents` |
| 6 | CV OTP | `src/app/api/cv/consent/start/route.ts` | **Hashed** email, hashed code, hashed IP | `cv_otp` |
| 7 | Job application | `src/components/jobs/ApplyForm.tsx` → `src/app/api/apply/[token]/route.ts` | Name, email, phone, **nationality / passport country**, residence-permit flag, job title, skills, availability, screener answers, **CV file (≤4 MB)** | **Forwarded to ATS** — not stored here |
| 8 | Legal/DSR request | `src/app/api/legal-request/route.ts` | Name, email, request type, message, **IP**, **user-agent** | `legal_requests` |
| 9 | Newsletter / job alerts | `src/app/api/newsletter/route.ts` | Email, trade, two consents, timestamp | `ats_job_alert_subscriptions` |
| 10 | "Before you go" exit panel | `src/components/home/BeforeYouGo.tsx` | Email, trade, notify + data consent | **POSTs direct from browser to ATS** |
| 11 | Candidate invite | `src/app/api/candidate-invite/route.ts` | Email, consent, **IP**, **user-agent** | `candidate_invites` |
| 12 | Non-EU lead magnet | `src/app/api/non-eu-lead/route.ts` | First name, email | `non_eu_leads` |
| 13 | App waitlist | `src/app/api/app-waitlist/route.ts` | Email | `app_waitlist` |
| 14 | Guide interest / eligibility | `src/app/api/guide-interest-signup/route.ts`, `feature-waitlist`, `send-eligibility-assistance` | Email, target region, target country, assistance wanted | `guide_interest_signups` |
| 15 | Recruiter network apply | `src/app/api/recruiter-network/apply/route.ts` | Name, email, country, region, partner type, social URL, reach, motivation | `recruiter_applications` |
| 16 | Recruiter invite request | `src/app/api/recruiter-network/request-invite/route.ts` | Name, email, motivation, experience, **IP**, **user-agent** | `recruiter_invite_requests` |
| 17 | Partner request | `src/app/api/partner-request/route.ts` | Email, company, org.nr., phone, contact name, consent | `partner_requests` |
| 18 | Premium checkout | `src/app/api/premium/*` | Email, Stripe customer/subscription IDs | `premium_subscribers` + **Stripe** |
| 19 | Feedback forms | `confirmation-feedback`, `site-feedback` | Score, optional email, free-text note, page URL | `candidate_feedback_submissions` |
| 20 | Pageview beacon | `src/components/TrafficBeacon.tsx` → `src/app/api/track/route.ts` | **Daily-rotating hash of IP+UA**, path, referrer host, country, **city** | `ats_web_pageviews` |
| 21 | Error capture | `src/lib/errorNotifier.ts` | Route, message, **stack trace**, **arbitrary `context` JSON** | `error_log`, `odin_incidents`, e-mail, **GitHub issue** |

### B.2 Field-level inventory

Categories: **I** identity · **C** contact · **P** professional · **S** special category (Art. 9) ·
**N** national ID · **T** technical.

| Field | Cat | Collected at | Stored (table.column / bucket) | Readable by | Processors | Leaves EEA? |
|---|---|---|---|---|---|---|
| Full name | I | 1,3,4,8,15,16,17 | `employer_requests.full_name`, `request_tokens.full_name`, `legal_requests.full_name`, `recruiter_applications.full_name`, `recruiter_invite_requests.full_name`, `partner_requests.full_name` | service_role only (RLS, 0 anon policies) | Supabase, Vercel, one.com | **Yes — Slack** (F-08) |
| E-mail | C | 1–3, 8–19 | 13 tables incl. `email_subscriptions.email`, `premium_subscribers.email` | service_role only | Supabase, Vercel, one.com, Stripe | **Yes — Slack, Stripe** |
| Phone | C | 1,3,5,7,17 | `employer_requests.phone`, `request_tokens.phone`, `cv_candidates.phone`, `partner_requests.phone` | service_role only | Supabase, Vercel | **Yes — Slack** |
| City / country | C | 5,7,20 | `cv_candidates.city/.country`, `ats_web_pageviews.city/.country` | service_role only | Supabase, Vercel | No |
| Org. number | I (co.) | 1,2,3,17 | `employer_requests.org_number`, `request_tokens.org_number` | service_role only | Supabase, **Brønnøysund** (lookup only) | No |
| CV content (history, education, certs, skills, languages, summary) | P | 5 | `cv_documents.payload` (jsonb), `cv_candidates.headline` | service_role only (RLS **FORCE**d) | Supabase | No¹ |
| CV / cover-letter PDF | P | 5 | bucket `cv-documents` (**private**, 15-min signed URLs) | service_role only | Supabase | No¹ |
| CV file upload (application) | P | 7 | **ATS — not stored here** | *unverified* | ATS, *RecMan (unverified)* | *unverified* |
| **Nationality / passport country** | **S-adjacent** | 7 | **ATS** `Candidate.nationality` — **displayed** by `src/app/api/candidates/route.ts:103` | any holder of a `partner_sessions` token | Supabase, partner companies | No |
| Residence-permit flag | S-adjacent | 7 | ATS | *unverified* | ATS | *unverified* |
| Work-permit status (`eu-eea`/other) | S-adjacent | 5 | `cv_documents.payload.personal.workPermit` | service_role only | Supabase | No |
| Salary expectations | P | — | ATS `Candidate.salaryExpectations` — **displayed** to partners | partner-session holders | Supabase | No |
| Rating / `compatibilityScore` | P | derived | computed at read time, `src/app/api/candidates/route.ts:32` | partner-session holders | — | No |
| **Fødselsnummer / D-number** | **N** | **NOT COLLECTED** | — | — | — | — |
| D-number *choice* (`has_d_number` / `we_handle`) | P (of the *employer*'s requirement) | 1 | `employer_requests.d_number` | service_role only | Supabase | No |
| Date of birth | I | **NOT COLLECTED** | — | — | — | — |
| IP address (raw) | T | 8,11,16 | `legal_requests.ip_address`, `candidate_invites.ip_address`, `recruiter_invite_requests.ip_address` | service_role only | Supabase | No |
| IP address (hashed) | T | 6,20 | `cv_otp.ip_hash`, `cv_consents.ip_hash`, `ats_web_pageviews.visitor_hash` | service_role only | Supabase | No |
| User-agent | T | 6,8,11,16,20 | `cv_consents.user_agent`, `legal_requests.user_agent`, `candidate_invites.user_agent` | service_role only | Supabase | No |
| Consent records | I | 5,9,11,15,17 | `cv_consents.*` (hash + version + SHA-256 + timestamp), `*.gdpr_consent` (bare boolean elsewhere) | service_role only | Supabase | No |
| Stripe customer / subscription ID | C | 18 | `premium_subscribers.stripe_*` | service_role only | **Stripe** | **Yes** |
| Error context (may embed any of the above) | T/varies | 21 | `error_log.context`, `error_log.error_stack` | `ADMIN_PASSWORD` holder (**see F-02**) | Supabase, one.com, **GitHub**, ODIN/ATS | **Yes — GitHub** |
| Free-text notes / messages | varies | 1,4,8,15,19 | `employer_requests.notes/.requirements`, `legal_requests.message`, `candidate_feedback_submissions.note` | service_role only | Supabase, one.com, **Slack** | **Yes — Slack** |

¹ Within the EEA *today*. `CV_PUSH_TO_ATS` is `false`; when switched on, CV data flows to RecMan
(`src/lib/cv/recman.ts`) — see **F-20**.

### B.3 Processor register

| Processor | Purpose | Data | Region | DPA | Evidence |
|---|---|---|---|---|---|
| **Supabase** | Database + object storage | Everything in B.2 | **EEA — `eu-west-1` (Ireland)** ✅ verified via `list_projects` | **Confirm** | `src/lib/supabaseAdmin.ts` |
| **Vercel** | Hosting, serverless functions, cron | All request data in transit | **EEA — `fra1` (Frankfurt)** ✅ verified | **Confirm** | `vercel.json:2` |
| **one.com** | SMTP | Names, e-mails, message bodies, CV PDFs | EU (claimed) | **Confirm** | `src/lib/errorNotifier.ts:12` |
| **Slack Technologies (Salesforce)** | Lead + error notifications | **Names, e-mails, phones, message excerpts** | **US — outside EEA** ❌ | **MISSING / confirm** | `src/lib/slackNotifier.ts`, `contact/route.ts:109`, `non-eu-lead/route.ts:88` |
| **GitHub (Microsoft)** | Auto-filed error issues | Stack traces + `context` JSON | **US — outside EEA** ❌ | **MISSING / confirm** | `src/lib/errorNotifier.ts:168-228` |
| **Stripe** | Premium + job-advert payments | E-mail, customer ID, card data (Stripe-side) | **US/IE** ❌ | **Confirm (Stripe DPA + SCCs)** | `src/app/api/premium/*` |
| **Cloudflare** | Turnstile anti-bot | IP address, browser challenge | **Global anycast** ❌ | **Confirm** | `src/lib/cv/captcha.ts:5` |
| **RecMan** | ATS sync | Full CV + PDF | Norway (claimed) | **MISSING** | `src/lib/cv/recman.ts` — **flag off** |
| **ATS (`ats.arbeidmatch.no`)** | Own system | Applications, CV files, mail relay | *unverified* | Internal (same controller) | `src/lib/atsClient.ts` |
| **Brønnøysundregistrene** | Company lookup | Org.nr. only — **no personal data** | Norway | N/A (public register) | `src/app/api/brreg/search/route.ts` |

---

## (c) Findings

Risk: **CRITICAL** = likely enforcement action / immediate exposure · **HIGH** = clear breach ·
**MEDIUM** = gap to close · **LOW** = hygiene.

### Legal basis, consent and transparency

**F-01 — Pre-ticked marketing consent box. CRITICAL**
`src/components/home/BeforeYouGo.tsx:231`
```tsx
<input name="notify" type="checkbox" defaultChecked className="mt-0.5" />
<span>Email me when a job fits my trade.</span>
```
The value is read at line 161 as `notify_consent: form.get("notify") === "on"` and POSTed to
`ats.arbeidmatch.no/api/public/before-you-go`. A pre-ticked box is silence, not consent.
**Legal:** GDPR Art. 4(11), Recital 32; CJEU *Planet49* (C-673/17); **markedsføringsloven § 15**
(prior consent for e-mail marketing; Forbrukertilsynet enforces, fines are routine).
**Fix:** delete `defaultChecked`. One word. Then confirm the ATS stores the consent with timestamp,
source and policy version — a bare boolean is not evidence under Art. 7(1).

**F-02 — Admin password compiled into the public JavaScript bundle. CRITICAL**
`src/app/admin/errors/page.tsx:32`
```tsx
const configuredPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";
```
Any `NEXT_PUBLIC_*` value is inlined into client-side JS and readable by anyone who opens DevTools.
The value typed into this gate is then sent as `x-admin-password` to `/api/admin/errors`, which
compares it against the server-side `ADMIN_PASSWORD` (`src/app/api/admin/errors/route.ts:20-24`).
**If the two env vars are set to the same secret — the obvious deployment — the entire `error_log`
is world-readable**: routes, stack traces, and the `context` JSON, which for
`/api/save-employer-request` carries the client's company name (`save-employer-request/route.ts:309`).
The route fails closed if `ADMIN_PASSWORD` is unset, so this is a configuration-dependent exposure —
which means it must be verified in Vercel today, not reasoned about.
**Legal:** Art. 32(1)(b), Art. 5(1)(f). **Fix:** delete the client-side gate entirely; put `/admin/*`
behind real authentication (Supabase Auth with 2FA, or Vercel deployment protection). Rotate
`ADMIN_PASSWORD`. Never reintroduce a secret under a `NEXT_PUBLIC_` name.

**F-03 — Client asserts a consent the user was never shown. HIGH**
`src/components/jobs/ApplyForm.tsx:174` — `gdpr_processing_consent: true,` is hardcoded in the
payload. The three boxes the applicant actually sees are `privacy_policy_accepted`,
`recruitment_contact_consent` and `gdpr_consent` (lines 369-384); there is no fourth box.
A consent flag fabricated client-side is unfalsifiable and worthless as Art. 7(1) evidence — worse,
it is affirmative evidence of a bad process if Datatilsynet reads this file.
**Legal:** Art. 7(1), Art. 5(2) (accountability). **Fix:** remove the field, or derive it from an
actual ticked box. Confirm what the ATS does with it.

**F-04 — Consent proof is a bare boolean on 6 tables. HIGH**
`partner_requests.gdpr_consent`, `request_tokens.gdpr_consent`, `request_access_otps.gdpr_consent`,
`recruiter_applications.gdpr_consent`, `candidate_invites.gdpr_consent`, `employer_requests.subscribe`
store `true` with no policy version, no consent text hash, and (except `candidate_invites.consented_at`)
no separate consent timestamp. Contrast `cv_consents`, which does this correctly: `policy_version`,
`policy_text_sha256`, `otp_verified_at`, `ip_hash`, `user_agent`
(`supabase/migrations/20260731120000_cv_builder.sql:38-52`).
**Legal:** Art. 7(1). **Fix:** add `consent_policy_version`, `consent_text_sha256`, `consented_at`
to each; model on `cv_consents`.

**F-05 — Privacy Notice links to `/cookies`, which returns 404. HIGH**
Live notice §9 (`ats_legal_templates` slug `privacy-notice`, v13, verified by query):
> "please see our [Cookie Policy](/cookies)"

`find src/app -ipath '*cookie*'` returns nothing. There is no route, and nothing in `src/` links to
`/cookies` — so the only path to it is the notice itself.
**Legal:** **ekomloven § 3-15** (cookie information must be provided), Art. 12(1) (accessible).
**Fix:** create `/cookies` from the table in §6 of this report, in Norwegian and English.

**F-06 — Cookie banner offers no choice and no way to revoke. HIGH**
`src/components/CookieConsent.tsx` — a single "Got it" button that writes
`localStorage.cookie_info_acknowledged = "1"` (line 30). There is no reject, no granular toggle, no
revocation path, and no record of the acknowledgement server-side. The same notice §9 claims users
"can manage your cookie preferences through ... our consent manager" — **no consent manager exists in
this codebase**.
Mitigating: this site genuinely sets no non-essential cookies (F-18 confirms), so an information-only
banner is *defensible under ekomloven § 3-15* for this host. It is not defensible for
`jobs.arbeidmatch.no`, and the notice's claim is false either way.
**Fix:** keep the banner honest for this host but rewrite the notice; build a real consent manager
before any analytics or pixel is ever added; fix `jobs.` separately.

**F-07 — Consent text references a policy that does not describe the processing. HIGH**
`src/lib/cv/consent.ts:12-16` asks the user to accept "the Privacy Policy", which resolves to
`/privacy` → the live v2.1 notice. That notice **does not mention the CV generator at all**.
A consent whose referenced notice omits the purpose is not informed.
**Legal:** Art. 4(11) ("informed"), Art. 13. **Fix:** publish `docs/cv-generator-privacy-section.md`
(already drafted, "Status: not published") and bump `CV_POLICY_VERSION`.

**F-08 — Four undisclosed processors, all outside the EEA. HIGH**
Notice §6: *"Your personal data is stored securely within Europe... Should any processing outside
Europe ever become necessary, it will take place only with the safeguards the GDPR requires ... and
this notice will say so."* The notice does not say so. In code:

| Processor | Personal data sent | File:line |
|---|---|---|
| Slack (US) | Name, e-mail, phone, message excerpt | `src/app/api/contact/route.ts:109-116`, `non-eu-lead/route.ts:88-91`, `partner-request/route.ts:163-205` |
| GitHub (US) | Stack traces + `context` JSON | `src/lib/errorNotifier.ts:210-222` |
| Stripe (US/IE) | E-mail, customer ID | `src/app/api/premium/create-checkout/route.ts` |
| Cloudflare (global) | IP address | `src/lib/cv/captcha.ts:26-34` |

**Legal:** Art. 13(1)(e)-(f), Art. 44-49, Art. 30(1)(d). **Fix:** either name them and document the
transfer mechanism (SCCs + TIA), or stop sending personal data to them — for Slack, send a record ID
instead of the name and e-mail; for GitHub, strip `context` and stack traces.

**F-09 — Published Privacy Notice contradicts the code in nine places. CRITICAL**
Verified against the live v2.1 body (retrieved from `ats_legal_templates`, updated 14 Sep 2026):

| # | Notice says | Code does | Ref |
|---|---|---|---|
| 1 | §2 collects "date of birth, national ID (where required)" | **Neither is collected anywhere** | — |
| 2 | §5 processors "process your data within Europe" | Slack, GitHub, Stripe, Cloudflare | F-08 |
| 3 | §6 "no processing outside Europe" | Same | F-08 |
| 4 | §7 "Candidate profiles (inactive): 2 years after last activity" | `cv_candidates` rows are **never deleted** | F-16 |
| 5 | §7 "Server access logs 90 days" / "Security logs 1 year" | `ats_web_pageviews` unbounded (35,139 rows from 2026-07-24); `error_log` unbounded | F-15 |
| 6 | §9 links to `/cookies` | 404 | F-05 |
| 7 | §9 "our consent manager" | Does not exist | F-06 |
| 8 | §10 "Encryption at rest for sensitive fields" | No field-level encryption in this repo; only hashing in the CV module | F-23 |
| 9 | §10 "Two-factor authentication for platform users" | Shared plaintext password, no 2FA | F-22 |

**Legal:** Art. 5(1)(a) (fairness and transparency), Art. 12(1), Art. 13. A notice that overstates
safeguards is the single fastest route to a Datatilsynet finding. **Fix:** §(g) below.

**F-10 — CV generator is live and entirely undisclosed. CRITICAL**
`src/app/cv-gen/`, `src/app/api/cv/*`, six database tables, one storage bucket — none of it appears
in the published notice. `docs/cv-generator-privacy-section.md` is a complete, well-written draft
marked *"Status: not published."*
**Legal:** Art. 13(1)-(2). **Fix:** publish the draft. It is ready.

**F-11 — Policy version on consent records points at no published version. MEDIUM**
`src/lib/cv/consent.ts:23` — `DEFAULT_POLICY_VERSION = "2026-07-31"`, stored in
`cv_consents.policy_version`. The published notice is **v2.1, effective 6 August 2026**
(row version 13, updated 14 September 2026). The stored string cannot be resolved to a published
document, which defeats the purpose of storing it.
**Fix:** set `CV_POLICY_VERSION` to the notice's own version identifier and archive each published
version so any stored value resolves to a retrievable text.

### Data subject rights

**F-12 — No access, portability or erasure mechanism outside the CV module. HIGH**
`/api/cv/my-data` (Art. 15/20) and `/api/cv/delete` (Art. 17, via the `cv_erase_candidate` RPC) are
correct and complete — genuine `DELETE`s, cascading to storage objects, with consent rows retained
and unlinked as proof. **They cover `cv_*` only.** A person whose data sits in `employer_requests`,
`request_tokens`, `legal_requests`, `non_eu_leads`, `candidate_invites`, `guide_interest_signups`,
`recruiter_applications`, `recruiter_invite_requests`, `partner_requests`, `email_subscriptions`,
`app_waitlist`, `candidate_feedback_submissions`, `premium_subscribers` or `error_log` can only ask by
e-mail, and nothing in the codebase finds or deletes their rows.
**Legal:** Art. 15, 17, 20. **Fix:** build `eraseSubject(email)` and `exportSubject(email)` covering
every table in B.2, plus the `cv-documents` bucket and the ATS.

**F-13 — DSR intake has no SLA tracking and no identity verification. MEDIUM**
`src/app/api/legal-request/route.ts` stores the request and sets `acknowledged_at` (line 149), but
`resolved_at` is never set by any code path, nothing alerts on the 30-day deadline, and
`identity_verification_method` (line 46-49) is **free text supplied by the requester** — it verifies
nothing. Combined with F-12 (`legal_requests` has no anti-abuse controls: no rate limit, no honeypot,
unlike every other form here), an attacker could submit erasure requests in someone else's name.
**Legal:** Art. 12(3) (one month), Art. 12(6) (identity), Art. 32. **Fix:** add rate limiting and a
honeypot; add an e-mail-confirmation step before any request is actioned; add a cron that alerts at
day 21 on any row with `resolved_at IS NULL`.

**F-14 — No objection or restriction path; profiling cannot be objected to. MEDIUM**
No code implements Art. 18 (restriction) or Art. 21 (objection). Candidates shown to partners with a
`compatibilityScore` (F-19) have no way to object to that profiling.
**Fix:** add a `processing_restricted` flag honoured by every read path, and an objection option on
the `/legal-request` form.

### Retention

**F-15 — 15 of 21 tables have no deletion mechanism of any kind. CRITICAL**
The only working retention is `cv_run_retention()`
(`supabase/migrations/20260731120000_cv_builder.sql:160-179`), called daily by
`/api/cv/retention` (`vercel.json:16-19`). It covers `cv_otp`, `cv_access_tokens`,
`cv_documents`, `cv_consent_declines` — and is properly authenticated with `CRON_SECRET`.

Everything else grows forever. Verified by live row count and oldest row:

| Table | Rows | Oldest | Deletion mechanism | Recommended |
|---|---|---|---|---|
| `ats_web_pageviews` | **35,139** | 2026-07-24 | **none** | 12 months (notice promises 90 days for access logs) |
| `request_access_otps` | **22** | 2026-07-23 | **none** — *plaintext e-mail retained ~2 months after use* | 24 h after `consumed_at`/expiry |
| `email_subscriptions` | 11 | 2026-07-28 | none | keep while subscribed + 3 yrs after unsubscribe (mfl. § 15 proof) |
| `error_log` | 4 | 2026-07-18 | none | 90 days |
| `recruiter_invite_requests` | 3 | 2026-08-07 | none | 12 months |
| `employer_requests` | 1 | 2026-09-10 | none | 24 months from last contact |
| `request_tokens` | 1 | 2026-09-10 | none (`expires_at` set, never enforced) | delete 30 days past `expires_at` |
| `candidate_invites` | 0 | — | none | 6 months if not converted |
| `legal_requests` | 0 | — | none | 36 months after `resolved_at` |
| `non_eu_leads`, `app_waitlist`, `guide_interest_signups`, `recruiter_applications`, `partner_requests`, `candidate_feedback_submissions`, `premium_subscribers` | 0 | — | **none** | 12 months / 12 months / 12 months / 12 months / 24 months / 12 months / 5 yrs (bokføringsloven) |

**Legal:** Art. 5(1)(e) (storage limitation), Art. 17(1)(a). **Fix:** one `run_website_retention()`
SQL function plus one `/api/cron/website-retention` route modelled exactly on the CV one, added to
`vercel.json`. **Do not write this migration without sign-off** — see the Note at the end.

**F-16 — `cv_candidates` rows are never deleted. HIGH**
`cv_run_retention()` deletes documents after 24 months but leaves the `cv_candidates` row — name,
e-mail, phone, city, country, headline — indefinitely. The table comment
(`...cv_builder.sql:101`) documents the 24-month rule for documents only; nothing covers the profile.
This directly contradicts notice §7 "Candidate profiles (inactive): 2 years after last activity".
**Fix:** extend the function to call `cv_erase_candidate()` for any candidate with no activity in 24
months and no remaining documents.

**F-17 — Retention periods in the notice exceed Datatilsynet practice for unsuccessful candidates. MEDIUM**
Notice §7: "Candidate profiles (active): Duration of account + 3 years"; "Application records: 2
years from application date". Datatilsynet's guidance for applicants who were not hired is that data
should go **shortly after the process closes**, typically **6-12 months** (to cover a
diskrimineringsloven claim window), unless the person gives separate, explicit talent-pool consent.
"Account + 3 years" has no stated justification.
**Fix:** unsuccessful applicants **6 months** default, extendable to **24 months** on explicit
talent-pool consent stored per F-04; placed employees **5 years** per **bokføringsloven § 13**;
logs **90 days** (access) / **12 months** (security).

**F-18 — Raw plaintext e-mail and IP retained in OTP rows. MEDIUM**
`supabase/migrations/20260626120000_request_access_otps.sql:7` stores `email text NOT NULL` in
plaintext, alongside `consumed_at` — 22 rows dating to 23 July 2026 are still there. The CV module
solved exactly this problem correctly (`cv_otp` stores only `email_hash`, `src/lib/cv/otp.ts:27-31`,
deleted after 24 h). Two OTP systems, two standards.
**Fix:** delete consumed/expired rows within 24 h; migrate to the `cv_otp` hashing pattern.

### Security and processors

**F-19 — Candidate profiling disclosed to partners with no Art. 13(2)(f) notice. HIGH**
`src/app/api/candidates/route.ts:32,103-114` returns to any holder of a `partner_sessions` token:
`nationality`, `city`, `country`, `salaryExpectations`, `rating`, and a derived
`compatibilityScore`, rendered as a percentage at
`src/app/request/partner/[session_token]/candidates/page.tsx:211-215`.
Three problems: **(a)** nationality disclosed to third parties in a recruitment context is
discrimination-sensitive and close to Art. 9 ethnic-origin data in effect, whatever its formal
classification; **(b)** the score is profiling under Art. 4(4) and is disclosed nowhere;
**(c)** `validateSessionToken` (lines 38-53) checks `used = false` and `expires_at` but **never sets
`used = true`**, so the token is reusable for its full 24-hour life by anyone who obtains the URL —
and the URL is the path itself (`/request/partner/{session_token}`), so it leaks via browser history,
`Referer` and shared links.
**Legal:** Art. 13(2)(f), Art. 5(1)(c) (minimisation), Art. 9, Art. 32.
**Fix:** drop `nationality` and `salaryExpectations` from the partner view unless the candidate has
consented to that specific disclosure; move the token out of the URL into a POST-set `HttpOnly`
cookie; explain the score in the notice.

**F-20 — RecMan integration has no DPA and is unverified. HIGH (latent)**
`src/lib/cv/recman.ts:9-11` states plainly: *"Not verified against a live account: RECMAN_API_KEY has
never been set in this repo, so nothing below has been exercised."* `CV_PUSH_TO_ATS=false`
(`.env.example:97`), so nothing flows today. When the flag flips, full CV content plus the PDF go to
a third-party processor (`toRecmanCandidate`, lines 28-45; `uploadRecmanFile`, lines 82-99).
**Fix:** treat the flag as gated on a signed databehandleravtale, a documented region, and a notice
update. Add a startup assertion that refuses to enable without `RECMAN_DPA_SIGNED=true`.

**F-21 — No DPIA exists. HIGH**
None in the repository, none referenced anywhere. ArbeidMatch's processing hits several Art. 35(3)
and Datatilsynet Art. 35(4)-list triggers: systematic profiling of jobseekers, recruitment data,
data about a **vulnerable group** (migrant blue-collar workers whose residence and livelihood depend
on the outcome), cross-border matching, and CV data at planned scale.
Current volume is small (**22 candidates, 0 CV profiles** — verified), so the "large scale" criterion
is not met *today*. That is precisely why the DPIA should be written now.
**Legal:** Art. 35. **Fix:** skeleton at §(f).

**F-22 — No 2FA and a shared plaintext password on admin surfaces. HIGH**
`ADMIN_PASSWORD` (`src/app/api/admin/errors/route.ts:20`) and `ADMIN_LIVE_PASSWORD`
(`src/app/api/admin/tiktok-live/route.ts:14`) are single shared secrets compared with `!==` — not
constant-time, no per-user identity, no 2FA, no lockout, no audit trail of who read what. The notice
§10 claims "Two-factor authentication for platform users".
**Legal:** Art. 32(1)(b)/(d), Art. 5(1)(f). **Fix:** replace both with Supabase Auth + TOTP; log
every admin read of personal data (see F-24).

**F-23 — No encryption at rest for sensitive fields. MEDIUM**
The notice promises it; no application-level encryption exists. Supabase provides volume-level
encryption, which is not the same claim.
**Fix:** either encrypt `cv_documents.payload` and free-text fields with `pgcrypto`/`pgsodium`, or
amend the notice to say "encrypted at rest at the storage layer".

**F-24 — No audit log of access to candidate data. MEDIUM**
Every route uses the service-role key (`getSupabaseAdminClient`), which bypasses RLS entirely and
leaves no per-actor trace. Nothing records who read a candidate profile, when, or why.
**Legal:** Art. 5(2), Art. 32. Expected of a bemanningsforetak.
**Fix:** an append-only `data_access_log` written by every route that reads candidate data.

**F-25 — Rate limiting is in-memory and ineffective on serverless. MEDIUM**
`src/lib/apiSecurity.ts:9` — `const rateBuckets = new Map<...>()`. Each Vercel lambda instance has
its own Map, and instances are recycled constantly; the limit resets on every cold start. Every form
here (`contact`, `legal-request`, `candidate-invite`, `non-eu-lead`, `save-employer-request`) relies
on it. The CV module, again, does it correctly — counting rows in `cv_otp`
(`src/app/api/cv/consent/start/route.ts:81-110`) precisely because *"memory does not survive a
lambda"*.
**Legal:** Art. 32 (resilience); enables enumeration and mass submission.
**Fix:** move to a shared store (Supabase table or Upstash), following the CV module's pattern.

**F-26 — RLS is correct in the live database but absent from the SQL scripts. MEDIUM**
Verified live: **all 28 tables have `relrowsecurity = true`**, and `pg_policy` shows **no permissive
`anon` policy on any personal-data table** (the only `anon` policy is `anon_select_legal_documents`,
which is intentional — public legal text). This is genuinely good.
But the checked-in scripts don't produce that state: `supabase/partners.sql`,
`premium_subscribers.sql`, `non_eu_leads.sql`, `email_subscriptions.sql`, `guide_interest_signups.sql`
and `request_and_lead_tables.sql` contain **no `ENABLE ROW LEVEL SECURITY`** at all, and
`site_settings.sql:11-13` has it commented out. Supabase's default privileges grant `anon` full table
access, so a fresh environment built from these scripts would expose every row over PostgREST.
Separately, `anon`/`authenticated` still hold table privileges on `employer_requests`,
`request_tokens`, `request_access_otps`, `candidate_feedback_submissions`, `legal_requests`,
`partner_requests` and `recruiter_invite_requests` (verified via `has_table_privilege`) — so a single
careless permissive policy would expose them instantly.
**Fix:** add `ENABLE ROW LEVEL SECURITY` + `FORCE` + `REVOKE ALL FROM anon, authenticated` to every
script, exactly as the CV migration does (`...cv_builder.sql:236-262`). Add a CI check.

**F-27 — `/api/token-data/[token]` returns contact details with no expiry check. MEDIUM**
`src/app/api/token-data/[token]/route.ts:23-27` selects `company, email, full_name, phone,
org_number` for any valid UUID, and **never checks `expires_at` or `used`**, both of which exist on
`request_tokens`. The token travels in the URL path (`/request/{token}`), so it leaks through browser
history, `Referer` headers and forwarded links — and remains valid forever.
**Legal:** Art. 5(1)(f), Art. 32. **Fix:** filter on `expires_at > now()`; consider `used = false`.

**F-28 — Error notifier ships stack traces and arbitrary context to GitHub and e-mail. MEDIUM**
`src/lib/errorNotifier.ts:184-207` embeds `JSON.stringify(context)` and the full stack in a GitHub
issue body. `context` is caller-supplied and already carries a client's company name
(`save-employer-request/route.ts:306-312`). `odinIncidentBridge.ts` correctly truncates and states a
no-secrets rule (lines 12-14); the GitHub path has no such guard.
**Legal:** Art. 5(1)(c), Art. 44 (GitHub is US-hosted). **Fix:** allowlist the keys that may appear
in `context`; drop stack traces from the GitHub path; or remove it.

**F-29 — Whole raw form payload duplicated into `form_answers`. LOW**
`src/app/api/save-employer-request/route.ts:280` writes every submitted field a second time as jsonb.
There is a real reason for it (comment at lines 273-279: fields that had no column were being lost),
but it duplicates personal data into an unindexed blob that erasure and export code will forget.
**Fix:** keep it, but make sure F-12's erasure covers `form_answers`, and strip the contact fields
that already have columns.

**F-30 — `vercel.json` schedules a cron for a route that does not exist. LOW**
`vercel.json:12-15` schedules `/api/cron/send-discount-reminders` daily; no such route exists
(`find src/app/api -ipath '*discount*'` → nothing). A daily 404. Harmless, but it means nobody is
watching cron outcomes — which matters once F-15's retention cron is added.
**Fix:** remove the entry; add alerting on cron failures.

**F-31 — Server-side Turnstile verification disabled on the contact form. LOW**
`src/app/api/contact/route.ts:19-23` — `verifyTurnstileToken` returns `true` unconditionally, with a
comment explaining it was disabled for Vercel Hobby. Client-side only is no protection.
**Fix:** re-enable, or remove the widget so the control is not claimed.

---

## (d) Prioritised remediation plan

### P0 — this week (legal exposure is live)
| # | Action | Effort |
|---|---|---|
| F-02 | Verify `ADMIN_PASSWORD` vs `NEXT_PUBLIC_ADMIN_PASSWORD` in Vercel **today**; remove the client gate; rotate | 2 h |
| F-01 | Delete `defaultChecked` on `BeforeYouGo.tsx:231` | 5 min |
| F-03 | Remove hardcoded `gdpr_processing_consent: true` | 5 min |
| F-05 | Create `/cookies` (NO + EN) | 3 h |
| F-09/F-10 | Publish the rewritten notice from §(g) + the CV section draft | 1 day |

### P1 — this month
| # | Action | Effort |
|---|---|---|
| F-15/F-16 | `run_website_retention()` + cron route + `vercel.json` entry *(needs sign-off)* | 2 days |
| F-08 | Name the four non-EEA processors, or stop sending them personal data | 1 day |
| F-19 | Remove nationality/salary from the partner view; move session token out of the URL | 1 day |
| F-12 | `exportSubject()` / `eraseSubject()` across all tables + bucket + ATS | 3 days |
| F-22 | Supabase Auth + TOTP on `/admin/*` | 2 days |
| F-25 | Shared-store rate limiting | 1 day |
| F-13 | Rate limit + identity confirmation + 30-day alerting on `legal_requests` | 1 day |

### P2 — this quarter
F-04 (consent metadata), F-06 (consent manager), F-11 (version alignment), F-14 (Art. 18/21),
F-17 (retention periods), F-18 (OTP hashing), F-21 (**DPIA**), F-23, F-24 (audit log),
F-26 (RLS in scripts + CI check), F-27, F-28.

### P3 — backlog
F-29, F-30, F-31. **Plus: commission the ATS-side audit** (scope limit 1) and fix
`jobs.arbeidmatch.no` implied consent.

---

## (e) Draft Art. 30 processing register (protokoll)

**Controller:** ArbeidMatch Norge AS, org.nr. 935 667 089, Sverre Svendsens veg 38, 7056 Ranheim.
Contact: legal@arbeidmatch.no. **DPO:** not appointed — assess against Art. 37(1)(b) once candidate
volume grows; a bemanningsforetak systematically monitoring jobseekers will likely need one.

| # | Purpose | Categories of data subject | Categories of data | Legal basis | Recipients | Transfers | Retention (recommended) | Security |
|---|---|---|---|---|---|---|---|---|
| 1 | Employer hiring requests | Employer contacts | Identity, contact, company, job spec | Art. 6(1)(b) + (f) | Supabase, Vercel, one.com, Slack | **Slack → US (F-08)** | 24 months from last contact | RLS, TLS, service-role only |
| 2 | Candidate applications | Jobseekers | Identity, contact, professional, **nationality**, CV file | Art. 6(1)(b) pre-contractual + (a) for talent pool | ATS, employers, partners | *unverified (ATS)* | 6 months unsuccessful / 5 years placed (**bokføringsloven § 13**) | Forwarded server-side; ATS controls unverified |
| 3 | CV generator | Jobseekers | Identity, contact, professional, work-permit status | **Art. 6(1)(a)**, OTP-verified | Supabase | None today; **RecMan if F-20 enabled** | Documents 24 months; **profiles 24 months (F-16)**; consents 5 years | RLS FORCE, private bucket, 15-min signed URLs, hashed OTP/IP |
| 4 | Candidate matching & scoring | Jobseekers | Professional, nationality, salary, rating, score | Art. 6(1)(f) — **LIA required** | Partner agencies | No | While candidate active | Session token (**F-19**) |
| 5 | E-mail marketing / job alerts | Jobseekers, employer contacts | Contact, trade | **Art. 6(1)(a)** + **mfl. § 15** | Supabase, one.com | No | Until withdrawn + 3 years (proof) | Unsubscribe token, RFC 8058 one-click |
| 6 | Partner onboarding | Agency contacts | Identity, contact, company | Art. 6(1)(b) + (f) | Supabase, one.com, Slack | **Slack → US** | 24 months | RLS |
| 7 | Payments (Premium, job ads) | Employer contacts | Contact, Stripe IDs | Art. 6(1)(b) + **Art. 6(1)(c)** (bokføringsloven) | Stripe, Supabase | **Stripe → US/IE** | **5 years** (bokføringsloven § 13) | HttpOnly JWT cookie, webhook signature |
| 8 | Website analytics | Visitors | Pseudonymised visitor hash, path, country, city | Art. 6(1)(f) | Supabase | No | **12 months** | Daily-rotating salted hash; raw IP never stored |
| 9 | DSR handling | Any data subject | Identity, contact, request, IP, UA | **Art. 6(1)(c)** (Art. 12) | Supabase, one.com | No | 36 months after resolution | RLS |
| 10 | Error monitoring | Any (incidental) | Technical, incidental personal data in context | Art. 6(1)(f) | Supabase, one.com, **GitHub**, ODIN/ATS | **GitHub → US (F-28)** | **90 days** | Admin password (**F-02**) |
| 11 | Feedback | Visitors | Score, optional e-mail, free text | Art. 6(1)(f) / (a) if identified | Supabase, one.com | No | 12 months | RLS |
| 12 | Anti-abuse (OTP, captcha, rate limiting) | Any | Hashed/plaintext e-mail, IP | Art. 6(1)(f) | Supabase, **Cloudflare** | **Cloudflare → global** | 24 h (**F-18**) | Hashed in CV module only |

**Not processed:** fødselsnummer, D-number values, date of birth, health data, union membership,
religion, criminal-record data. Confirmed by field-level search across `src/`. The only Art. 9-adjacent
field is **nationality** in the application flow (F-19) — collected as a work-eligibility proxy, which
is a legitimate purpose, but it must never be used for selection and must not be disclosed to third
parties without a specific basis.

---

## (f) DPIA skeleton (Art. 35)

> Status: **not started.** This is the structure to complete, not the assessment itself.
> Datatilsynet expects a DPIA before processing begins. It has effectively not begun at scale yet
> (22 candidates), so this can still be done in the right order.

**1. Systematic description of the processing (Art. 35(7)(a))**
- Data flows: §(b) of this report is the input.
- Purposes: register entries 2, 3 and 4 in §(e).
- Controller/processor boundaries: ArbeidMatch controller; Supabase, Vercel, one.com, Stripe, Slack,
  GitHub, Cloudflare, RecMan processors; partner agencies likely **joint controllers or independent
  controllers** — this must be decided, not left open.

**2. Why a DPIA is required (Art. 35(3) + Datatilsynet's Art. 35(4) list)**
- (a) Systematic and extensive evaluation of personal aspects — the matching/scoring in F-19.
- (b) Recruitment and employment data, on Datatilsynet's published list.
- (c) **Vulnerable data subjects** — migrant blue-collar workers in an asymmetric relationship where
  livelihood and right of residence turn on the outcome. This is the strongest trigger.
- (d) Cross-border processing across EU/EEA jurisdictions.
- (e) Innovative use / new technology if any AI screening is introduced.
- **Note:** the "large scale" criterion is **not currently met** (22 candidates, 0 CV profiles). State
  this honestly and set the volume threshold at which the assessment must be revisited.

**3. Necessity and proportionality (Art. 35(7)(b))**
- Per purpose: is each field necessary? Start with `nationality` and `salaryExpectations` in the
  partner view (F-19) — the hardest to justify.
- Legal basis per purpose; **legitimate interest assessments (LIA) required for entries 4, 8, 10, 11**.
- Retention justification per table (F-15, F-17).
- How Art. 12-22 rights are delivered (F-12 blocks this section today).

**4. Risks to rights and freedoms (Art. 35(7)(c))**
| Risk | Likelihood | Severity | Notes |
|---|---|---|---|
| Discrimination via nationality in matching | Medium | **High** | F-19; also **diskrimineringsloven** |
| Unauthorised disclosure of candidate data to partners | Medium | High | F-19 session-token reuse |
| Indefinite retention → stale data used in decisions | **High** | Medium | F-15, F-16 — happening now |
| Unlawful marketing without valid consent | **High** | Medium | F-01; **mfl. § 15** |
| Admin-surface compromise exposing error log | Medium | Medium | F-02 |
| Non-EEA transfer without safeguards | **High** | Medium | F-08 |
| Candidate cannot exercise erasure | **High** | High | F-12 |

**5. Measures to address the risks (Art. 35(7)(d))**
- The P0/P1 plan in §(d), with owners and dates.
- Residual risk rating after each measure.
- Trigger for **Art. 36 prior consultation** with Datatilsynet if residual risk stays high.

**6. Sign-off and review**
- Owner, approver, date. Review annually or on any material change — specifically: enabling
  `CV_PUSH_TO_ATS`, introducing automated screening, passing 1,000 candidate profiles, or adding a
  processor outside the EEA.

**7. Art. 22 assessment**
Today: `compatibilityScore` is advisory, a human makes every hiring decision, so Art. 22(1) does not
bite. **Document this, and re-assess the moment any ranking filters candidates out of a recruiter's
view** — an automated exclusion a human never sees is a decision, whatever it is called.

---

## (g) Privacy Notice — proposed diff

**Base:** live v2.1, effective 6 August 2026 (`ats_legal_templates`, slug `privacy-notice`, version
13, updated 14 September 2026, `language = 'en'` — **the only language row that exists**).
Publishing means updating that row, not merging code (`src/app/privacy/page.tsx:41`).

> **A Norwegian version is required.** Datatilsynet expects the notice in a language the data
> subject understands. The controller is Norwegian and the site already serves `/no`, `/pl`, `/ro`
> and `/en`. Norwegian and English are the minimum; Romanian and Polish should follow, given who this
> site recruits. The `language` column already supports this — add rows, don't replace.

### Change list

| § | Change | Finding |
|---|---|---|
| 2 | **Delete** "date of birth, national ID (where required)" — neither is collected | F-09.1 |
| 2 | **Add** a CV generator subsection from `docs/cv-generator-privacy-section.md` | F-10 |
| 2 | **Add** hashed identifiers (OTP e-mail hash, IP hash, analytics visitor hash) as a data category | F-09 |
| 5 | **Name** every processor; mark Slack, GitHub, Stripe, Cloudflare as non-EEA | F-08 |
| 6 | **Rewrite**: transfers outside the EEA **do** occur; state the Art. 46 mechanism (SCCs) and that a TIA exists | F-08 |
| 7 | **Replace** the retention table with periods that code enforces | F-15, F-17 |
| 9 | **Publish `/cookies`** before the link goes live; **delete** "our consent manager" until one exists | F-05, F-06 |
| 10 | **Delete** "Encryption at rest for sensitive fields" and "Two-factor authentication" until true | F-09.8-9 |
| 11 | **Expand**: describe the `compatibilityScore`, its inputs, and the right to object | F-19, F-14 |
| — | **Add** a version history section so `cv_consents.policy_version` resolves to a retrievable text | F-11 |

### Replacement §7 — retention (English)

> **7. Data retention**
>
> | Data | Retention |
> |---|---|
> | Candidate profile — application unsuccessful | 6 months after the process closes |
> | Candidate profile — talent pool (separate consent given) | 24 months from last activity, renewable |
> | Candidate profile — placed | 5 years (bokføringsloven § 13) |
> | CV generator profile and documents | 24 months from creation |
> | Consent records | 5 years after the consent ends, as proof of lawful basis |
> | Employer enquiries and requests | 24 months from last contact |
> | Payment and accounting records | 5 years (bokføringsloven § 13) |
> | Marketing consents | Until withdrawn, then 3 years as proof |
> | Website analytics (pseudonymised) | 12 months |
> | Error and security logs | 90 days |
> | One-time verification codes | 24 hours |
> | Data subject rights requests | 36 months after resolution |
>
> When a period expires the data is deleted, not archived. Where a record must be kept for accounting
> purposes, only the fields bokføringsloven requires are retained.

### Replacement §7 — oppbevaring (norsk)

> **7. Lagringstid**
>
> | Opplysninger | Lagringstid |
> |---|---|
> | Kandidatprofil — søknaden førte ikke fram | 6 måneder etter at prosessen er avsluttet |
> | Kandidatprofil — kandidatbank (eget samtykke gitt) | 24 måneder fra siste aktivitet, kan fornyes |
> | Kandidatprofil — utleid eller ansatt | 5 år (bokføringsloven § 13) |
> | Profil og dokumenter fra CV-generatoren | 24 måneder fra opprettelse |
> | Samtykkelogg | 5 år etter at samtykket er avsluttet, som dokumentasjon på behandlingsgrunnlaget |
> | Henvendelser og oppdrag fra arbeidsgivere | 24 måneder fra siste kontakt |
> | Betalings- og regnskapsopplysninger | 5 år (bokføringsloven § 13) |
> | Markedsføringssamtykker | Til samtykket trekkes, deretter 3 år som dokumentasjon |
> | Nettstedsstatistikk (pseudonymisert) | 12 måneder |
> | Feil- og sikkerhetslogger | 90 dager |
> | Engangskoder | 24 timer |
> | Henvendelser om personvernrettigheter | 36 måneder etter at saken er avsluttet |
>
> Når lagringstiden er utløpt slettes opplysningene, de arkiveres ikke. Der en opplysning må beholdes
> av regnskapshensyn, beholdes bare de feltene bokføringsloven krever.

### Replacement §6 — international transfers (English)

> **6. Where your data is stored, and transfers outside the EEA**
>
> Our database and our web servers are located in the EU/EEA — Supabase in Ireland (`eu-west-1`) and
> Vercel in Frankfurt (`fra1`). Your data is stored there.
>
> Some of the services we use to operate the site are provided by companies established outside the
> EEA. Where this involves your personal data, the transfer takes place under the European
> Commission's Standard Contractual Clauses, supported by a transfer impact assessment:
>
> - **Slack Technologies (USA)** — internal notifications about new enquiries. These contain your
>   name, e-mail address and, for the contact form, an excerpt of your message.
> - **Stripe (USA / Ireland)** — payment processing. Your e-mail address and payment identifiers.
> - **GitHub (Microsoft, USA)** — technical error reports. These are not intended to contain personal
>   data, but a technical error can incidentally include some.
> - **Cloudflare (global)** — bot protection on our forms. Your IP address.
>
> You may ask us at legal@arbeidmatch.no for a copy of the safeguards that apply to any of these
> transfers.

### Replacement §6 — overføring ut av EØS (norsk)

> **6. Hvor opplysningene lagres, og overføring ut av EØS**
>
> Databasen og webserverne våre ligger i EU/EØS — Supabase i Irland (`eu-west-1`) og Vercel i
> Frankfurt (`fra1`). Opplysningene dine lagres der.
>
> Noen av tjenestene vi bruker for å drive nettstedet leveres av selskaper etablert utenfor EØS. Når
> dette omfatter personopplysninger om deg, skjer overføringen etter EU-kommisjonens standard
> personvernbestemmelser (SCC), med en tilhørende overføringsvurdering:
>
> - **Slack Technologies (USA)** — interne varsler om nye henvendelser. Disse inneholder navnet ditt,
>   e-postadressen din og, for kontaktskjemaet, et utdrag av meldingen.
> - **Stripe (USA / Irland)** — betalingsbehandling. E-postadressen din og betalingsidentifikatorer.
> - **GitHub (Microsoft, USA)** — tekniske feilrapporter. Disse skal ikke inneholde
>   personopplysninger, men en teknisk feil kan utilsiktet ta med noe.
> - **Cloudflare (globalt)** — robotbeskyttelse på skjemaene våre. IP-adressen din.
>
> Du kan be oss på legal@arbeidmatch.no om en kopi av garantiene som gjelder for disse overføringene.

### Replacement §11 — automated decision-making (English)

> **11. Automated processing and matching**
>
> We use automated matching to suggest candidates to employers and jobs to candidates. When we show a
> candidate profile to an employer or a partner agency, we may show a compatibility indicator. It is
> calculated from the role searched for and the assessment a recruiter has recorded on the profile.
>
> This indicator is a suggestion, not a decision. Every decision to present, interview or hire a
> candidate is made by a person. We do not make decisions producing legal or similarly significant
> effects by automated means alone, and we do not use profiling to exclude anyone automatically.
>
> You may object to this profiling at any time at legal@arbeidmatch.no or through
> arbeidmatch.no/legal-request. You may also ask us how a particular indicator was arrived at.
>
> If we ever introduce automated processing that does produce legal or similarly significant effects,
> we will tell you before it applies to you and give you the right to human review, to express your
> point of view and to contest the outcome.

### Replacement §11 — automatiserte avgjørelser (norsk)

> **11. Automatisert behandling og matching**
>
> Vi bruker automatisk matching for å foreslå kandidater til arbeidsgivere og stillinger til
> kandidater. Når vi viser en kandidatprofil til en arbeidsgiver eller et samarbeidsbyrå, kan vi vise
> en kompatibilitetsindikator. Den beregnes ut fra stillingen det søkes etter og vurderingen en
> rekrutterer har registrert på profilen.
>
> Indikatoren er et forslag, ikke en avgjørelse. Enhver beslutning om å presentere, intervjue eller
> ansette en kandidat tas av et menneske. Vi treffer ikke avgjørelser med rettsvirkning eller
> tilsvarende betydelig virkning utelukkende automatisk, og vi bruker ikke profilering til å utelukke
> noen automatisk.
>
> Du kan når som helst protestere mot denne profileringen på legal@arbeidmatch.no eller via
> arbeidmatch.no/legal-request. Du kan også be om å få vite hvordan en bestemt indikator er kommet fram.
>
> Dersom vi senere innfører automatisert behandling som har rettsvirkning eller tilsvarende betydelig
> virkning, vil vi si fra før den gjelder deg, og gi deg rett til menneskelig overprøving, til å legge
> fram ditt syn og til å bestride resultatet.

---

## What was verified against the live system

| Claim | How | Result |
|---|---|---|
| Supabase region | `list_projects` | `eu-west-1` (Ireland) — **EEA** ✅ |
| Vercel region | `vercel.json:2` | `fra1` (Frankfurt) — **EEA** ✅ |
| RLS on all personal-data tables | `pg_class.relrowsecurity` | **28/28 enabled** ✅ |
| No permissive `anon` read policy | `pg_policy` | ✅ (only `anon_select_legal_documents`, intentional) |
| `cv-documents` bucket private | `storage.buckets` | `public = false` ✅ |
| Retention actually running | row counts + `min(created_at)` | **Only `cv_*`** ❌ (F-15) |
| Live notice text | `ats_legal_templates` | v2.1, **English only** ❌ (F-09) |
| Third-party analytics / pixels | source search | **None** ✅ |
| Live LLM/AI calls in this repo | source search | **None** ✅ |
| fødselsnummer / D-number values | field search | **Not collected** ✅ |

## What was NOT verified

- Everything inside `ats-recruitment` (job applications, CV files, candidate records, mail relay,
  the claimed file gate and retention clock). **Commission a second audit.**
- `jobs.arbeidmatch.no` implied cookie consent.
- Whether a DPA exists with any processor.
- Live Vercel environment variables — specifically **whether `ADMIN_PASSWORD` equals
  `NEXT_PUBLIC_ADMIN_PASSWORD`** (F-02). Check this first.
- Backup retention and deletion at Supabase and one.com.

---

> **Nothing in this audit was fixed.** Per the audit instruction, no code, migration, policy row or
> production data was modified. `supabase/` was read only. The live database was queried read-only
> (`SELECT` only; no `INSERT`, `UPDATE`, `DELETE` or DDL was executed). The remediation plan in §(d)
> awaits a decision on which findings to implement.
