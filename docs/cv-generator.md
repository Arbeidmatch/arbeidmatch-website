# CV generator

Free, public CV builder for blue collar and trades candidates applying to Norwegian
employers. Two routes: `/cv` (guide and landing page) and `/cv-gen` (the builder).

## What is built

| Area | Status |
|---|---|
| `lib/cv/schema.ts` and types | Done |
| Supabase migration, RLS, storage bucket, retention and erasure functions | Written, **not applied** |
| Five CV templates plus a cover letter template | Done |
| PDF pipeline: render, metadata, embedded JSON, XMP | Done |
| Parsability test suite (build gate) | Done, passing |
| `/cv-gen` builder, stepper, live preview, mobile preview tab, ATS meter | Done |
| "Improve this" suggestion engine | Done |
| `/api/cv/*` routes: OTP, consent, download, my-data, erasure, retention | Done |
| `/cv` landing page and guide | Done |
| Guide screenshots | Generated, 9 steps at 1440x900 and 390x844 |
| Supabase migration applied to `navzhgscvzngzbfxayoh` | Done, 2026-07-31 |
| ATS and RecMan push | Written, behind `CV_PUSH_TO_ATS`, **endpoints unconfirmed** |
| Privacy policy section | Drafted in `cv-generator-privacy-section.md`, **not published** |

## What has actually been exercised

The whole flow was run against the real database on 2026-07-31: consent refused without
both boxes, a tampered consent hash rejected, a code issued with nothing personal stored
yet and the address held only as a hash, a wrong code refused, verification creating the
candidate, the consent record and both documents, the PDF downloading at 29 KB under the
right filename, the download token refused on replay, erasure anonymising the candidate
while keeping the consent proof, and the retention function running.

**The one step that could not be exercised locally is the email itself.** Before switching
this on for real traffic, send yourself one code from a deployed environment and confirm it
arrives. The failure path is correct either way: the route returns 502 and deletes the OTP
row rather than leaving a code nobody can receive.

## Mail goes through the ATS

The website does not send CV mail itself. The ATS owns the mail infrastructure:
suppression lists, bounce handling, SMTP routing and the Gmail circuit breaker. A second
path from the website to the same mailboxes would mean a hard bounce recorded in the ATS
would not stop us mailing that person from here.

`lib/cv/mailer.ts` posts to `POST {ATS_BASE_URL}/api/public/website-email`, authenticated
with `ATS_EMAIL_SECRET`, which must match `WEBSITE_EMAIL_SECRET` in the ATS environment.
Everything is sent as no-reply, which the ATS endpoint enforces rather than trusting the
caller. Attachments travel base64 encoded and are capped at 3 files of 5 MB each.

That endpoint and the attachment support in `sendHtmlEmailDirect` are new work in the ATS
repo, so the ATS side must be deployed before the CV flow can send anything.

## The "Improve this" button

Next to the summary, every experience bullet and the skill field. It rewrites weak English
into the phrasing a Norwegian employer and their software expect, and explains what it
changed. It never overwrites: the user picks "Use this" or "Keep mine".

**It makes no network call and uses no AI service at runtime.** The wording lives in
`lib/cv/phrasing-library.ts`, authored offline with the Claude Code CLI and shipped as
static data; `lib/cv/suggest.ts` matches against it in the browser. That is deliberate on
two counts: it costs nothing per use, and it does not break the promise below by sending a
candidate's draft text anywhere before they have consented.

Adding a trade means adding a `TradeProfile` block to the library, not changing code.
Outside the trades in the library the button still fixes grammar, tense and filler, but it
cannot rewrite content it has no vocabulary for.

### Spelling

Two things fix spelling, and they are separate on purpose.

The text fields carry `spellCheck` and `lang="en"`, which gives the candidate the spell
checker already installed on their own machine: red underline while typing, right click to
correct. The `lang` attribute is not optional here. The page is `lang="nb"`, so without it
the browser checks English CV text against a Norwegian dictionary and underlines every
word. The basic checker runs on the device. Chrome's "enhanced spell check" is a setting
the user owns, not something the page can turn on.

The button also corrects spelling itself, from `MISSPELLINGS` and `PREFIX_COMPLETIONS` in
the phrasing library, so a candidate who never right clicks still gets it fixed and is told
which words changed. `MISSPELLINGS` is an exact map; `PREFIX_COMPLETIONS` finishes a long
word cut short mid-typing, such as `experie`. A real word that happens to start a longer one
goes in `NOT_TRUNCATED` so it is left alone. Trade detection runs after the correction, so a
trade spelled wrong is still recognised. Add a row, do not change the code.

## Work experience order and length

Roles are sorted most recent first when the candidate leaves the work experience step, not
while they type, so a card never jumps away mid-date. `sortExperienceByDate` ranks on the end
date and then the start date; a role whose dates cannot be read yet keeps its own order at
the bottom. Move up and move down still work within the step.

`durationLabel` works the length out from the two dates and the CV prints it after the
range: `01/2025 - 01/2026 (1 year)`. It is counted as the distance between the dates, so a
January to January year reads as one year rather than thirteen months, and a role inside a
single month still counts as one. The plain range stays in front of the duration because
`parsability.ts` requires a parser to extract exactly that substring.

## Architecture

```
lib/cv/schema.ts        zod schema, the single source of truth for the form,
                        the preview, the PDF, the ATS payload and the jsonb column
lib/cv/ats-rules.ts     the readiness meter and `linearise()`, the exact text a
                        parser should extract
lib/cv/templates/       five CV layouts plus the cover letter, all sharing
                        shared.tsx for fonts, typography and section blocks
lib/cv/pdf.ts           renders a template, then applies metadata, the embedded
                        JSON attachment and the XMP packet
lib/cv/parsability.ts   renders each template and asserts what a parser sees
```

### Why the templates look the way they do

Every template renders the same content in the same render tree order:

```
Name and contact, Headline, SUMMARY, WORK EXPERIENCE, EDUCATION,
CERTIFICATIONS, SKILLS, LANGUAGES
```

Visual columns are produced by positioning, never by reordering content, because
text extraction follows draw order. The rail in `two-column-right` carries
certifications, skills and languages, which are the last three sections in the
linear order anyway. `compact-sidebar` paints its sidebar in two absolutely
positioned blocks, contact first and the skill block last, for the same reason.

**No letter spacing anywhere.** Letter spacing makes pdf.js and most CV parsers
extract `S U M M A R Y` instead of `SUMMARY`. This was measured, not assumed:
the parsability suite failed on every template until it was removed.

Hyphenation is disabled through `Font.registerHyphenationCallback`, so no bullet
is ever split mid word.

### Fonts

Inter Regular, SemiBold and Bold ship as TTF files in `public/fonts/`, subset to
latin and latin-ext so Romanian (s-comma, t-comma, a-breve, i-circumflex) and
Norwegian (ae, o-slash, a-ring) characters render as real text with correct
ToUnicode maps. The test suite renders a diacritics probe and asserts it survives
extraction.

### PDF output guarantees

Enforced by `npm run cv:verify-pdf`, which fails the build if any template breaks:

- real embedded text, nothing rasterised
- name, email and phone on page 1
- the six section headings, each exactly once, in the linear order
- every job title, company and date range present, with the title extracted
  before its own dates and bullets
- every skill, language, qualification and certificate present
- at most 2 pages, under 400 KB
- the embedded `arbeidmatch-cv.json` attachment round trips

Metadata set on every file: title, author, subject (the headline), keywords (the
skills), creator, and `/Lang en-US`. The validated `CvDocument` is attached as
`arbeidmatch-cv.json` and also written into XMP under
`https://www.arbeidmatch.no/ns/cv/1.0/`, so our own ATS reads structured data
instead of re-parsing the text layer.

Filenames: `POPA_Alex_CV.pdf`, `POPA_Alex_CoverLetter.pdf`. Surname uppercase,
transliterated to ASCII.

## Data flow and GDPR

**No personal data reaches our servers before consent is verified.** While the
user fills the form everything lives in `localStorage` under
`arbeidmatch:cv-draft:v1`. There is no autosave to the database and no analytics
event carrying form values.

1. The user clicks Download PDF. The consent modal opens with two required
   checkboxes (privacy policy and terms; work profile creation) and one optional
   one (job alerts by email).
2. The exact rendered text of the two required statements is hashed with SHA-256
   on both the client and the server and stored with the consent record next to a
   `policy_version` string.
3. `POST /api/cv/consent/start` creates a six digit code with `crypto.randomInt`,
   stores only `sha256(code + CV_OTP_PEPPER)` with a 10 minute TTL, and emails it.
   At this stage the email address exists only as a hash in `cv_otp.email_hash`.
4. `POST /api/cv/consent/verify` checks the code, then in one transaction upserts
   `cv_candidates`, inserts `cv_consents`, inserts `cv_documents`, marks the OTP
   consumed and issues a single use 15 minute download token.
5. `POST /api/cv/generate` exchanges that token for the PDF.
6. If the user declines or abandons, `POST /api/cv/consent/decline` records only a
   random session id, the client wipes `localStorage` and the preview tab, and the
   deletion modal appears. This is irreversible by design; there is no hidden backup.

Never collected: national identity number, date of birth, marital status,
nationality beyond work permit status, photo, health data. `looksLikeNationalId`
in `schema.ts` powers a non-blocking warning when something that looks like a
national ID is pasted into a free text field.

### OTP hardening

- 5 verification attempts per code, then the code is invalidated
- 60 second resend cooldown, 3 codes per email per hour, 10 per IP per hour
- constant time hash comparison
- generic error messages that never reveal whether an email exists

Rate limits live in the `cv_otp` table rather than in memory, because the existing
in-memory limiter in `lib/apiSecurity.ts` does not hold across Vercel lambdas.

## Retention

`public.cv_run_retention()` is called by a cron route and returns the storage paths
its caller must delete from the bucket:

| Data | Retention |
|---|---|
| `cv_otp` | 24 hours |
| `cv_access_tokens` | 7 days after expiry |
| `cv_consent_declines` | 12 months |
| `cv_documents` and their storage objects | 24 months |
| `cv_consents` | kept as proof of lawful basis, with `candidate_id` nulled on erasure |

`public.cv_erase_candidate(uuid)` anonymises the candidate row, deletes the
documents and tokens, keeps the consent rows with the candidate link removed, and
returns the storage paths to delete.

## Database

Target project: **`arbeidmatch-ats` (`navzhgscvzngzbfxayoh`)**, which serves both the
ATS and the website. That shared schema is why every table here is prefixed `cv_`.

Apply `supabase/migrations/20260731120000_cv_builder.sql` through the dashboard SQL
editor or an admin client pointed at that project.

RLS is enabled and forced on every table with **no policies at all**, so `anon` and
`authenticated` can read nothing. All access is service role, through our API routes.
`storage.buckets.cv-documents` is private; objects are served only through 15 minute
signed URLs.

Rollback: `supabase/migrations/20260731120000_cv_builder_rollback.sql`. It is
destructive and drops all CV data. Empty the storage bucket first.

## Rotating the OTP pepper

`CV_OTP_PEPPER` is mixed into every stored code hash. Rotating it invalidates every
code that has not been used yet, which is acceptable because codes live 10 minutes.

1. Generate a new value: `node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"`
2. Set it in Vercel for Production, Preview and Development.
3. Delete the unconsumed codes so nobody waits on a code that can no longer verify:
   `DELETE FROM public.cv_otp WHERE consumed_at IS NULL;`
4. Redeploy.

Do the same for `CV_DOWNLOAD_TOKEN_SECRET`; rotating it invalidates outstanding
download links, which expire after 15 minutes anyway.

## Commands

```
npm run cv:verify-pdf    parsability gate for all five templates
npm run cv:screenshots   guide screenshots, needs a dev server and `npx playwright install`
npm test                 the full vitest suite
```

`cv:screenshots` needs a dev server running and `npx playwright install chromium` done
once. It drives `/cv-gen?demo=1`, which is disabled in production, so no real person's
data can appear in a screenshot. It dismisses the cookie banner, hides the dev overlay,
captures nine steps at both viewports, and converts each shot to webp. `GuideShot` renders
only what the manifest lists, so a missing shot leaves a gap rather than a broken image.

## Open items

- ATS ingest endpoint is unknown. `lib/atsClient.ts` is an unactivated skeleton, so
  `ATS_INGEST_URL` has no confirmed target and `pushToOwnAts` skips itself.
- RecMan credentials are not available. `lib/cv/recman.ts` maps the fields in one place but
  has never run against a live account, so the endpoint paths need confirming before
  `CV_PUSH_TO_ATS` is switched on.
- The privacy policy section is drafted but not published. The policy lives in the
  `legal_documents` table, not in this repo.
- `TURNSTILE_SECRET_KEY` is not set. `lib/cv/captcha.ts` passes the check when the secret
  is missing, so the OTP endpoint is currently protected only by its own rate limits.
- Rate limits for the CV flow are enforced in the `cv_otp` table rather than the in-memory
  limiter in `lib/apiSecurity.ts`, which does not survive a lambda.
- No email has been delivered yet. Confirm one code arrives from a deployed environment
  before announcing the feature.

## Environment variables

`CV_OTP_PEPPER`, `CV_DOWNLOAD_TOKEN_SECRET`, `CV_INTERNAL_SHARED_SECRET` and
`ATS_EMAIL_SECRET` must be set in Vercel for Production, Preview and Development.

Without the pepper, `hashEmail` and `hashOtpCode` return null and the consent routes fail
closed with a generic error rather than storing anything unhashed. Without
`ATS_EMAIL_SECRET`, no mail is sent and `consent/start` returns 502 having deleted the
code it created.

`CV_POLICY_VERSION` defaults to `2026-07-31` in code; bump it in the environment whenever
the consent wording changes.

On the ATS side, set `WEBSITE_EMAIL_SECRET` to the same value as `ATS_EMAIL_SECRET`.
