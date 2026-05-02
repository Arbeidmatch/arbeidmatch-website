# BETA Alignment Audit — 2 May 2026

# AM-WEB-085 audit raport

# Status: AUDIT ONLY — no code modified (except this file)

**BETA model (target):** invite-only recruiters, negotiated pricing per contract, **no Stripe on placements**, **no guarantees**, all candidates redirected to **jobs.arbeidmatch.no**.

**Scope:** `src/` (there is no separate top-level `app/`; routes live under `src/app/`).

**Note on “every hit + 2 lines context”:** For high-volume patterns (Stripe, subscription, checkout) this document lists **file:line** and a **single excerpt** per cluster, or a **file index**, to keep the audit maintainable. Low-volume patterns include fuller context blocks.

---

## 1. Garantii / Promisiuni gasite

### 1.1 `guarantee` / `guaranteed` (case-insensitive)

| Path | Line | Context (±2 lines) |
|------|------|-------------------|
| `src/lib/premium/articles.ts` | 115 | (Article excerpt about Norwegian labor law) *“what Norwegian labor law **guarantees** you as a foreign worker”* — legal meaning, not ArbeidMatch placement guarantee. |
| `src/components/candidates/TradeSpecialistCards.tsx` | 646 | `successMessage="...We **cannot guarantee** a publication date."` — soft disclaimer. |
| `src/lib/legal-seed-documents-data.ts` | 119 | *“We do not **guarantee** placement, hiring, or any specific outcome”* — aligns with BETA. |
| `src/components/candidates/ElectriciansNorwayPage.tsx` | 255 | *“**cannot guarantee** timelines”* — disclaimer. |

### 1.2 `warranty` / `money-back` / `money back` / `refund` / `no risk`

**No matches** in `src/` for: `warranty`, `money-back`, `money back`, `refund`, `no risk` (case-insensitive scan on `.ts`/`.tsx`).

---

## 2. Pricing fix gasit

### 2.1 “Starting from”, “free trial”, “no credit card”, “per month”, “per year”

| Path | Line | Notes |
|------|------|------|
| `src/components/recruiter-network/RecruiterNetworkClient.tsx` | 169 | Badge copy: **“Starting from zero”** (metaphorical, not currency). |
| `src/app/request/page.tsx` | 1292–1317 | **1,499 NOK/month**, **3,999 NOK/month**, “Presentations: **5/month**”, “Quick Match: **3x/month**”. |
| `src/app/request/[token]/page.tsx` | 56, 1064, 2189+ | `salaryPeriod`: **per month** / per hour (employer form, not product pricing). |
| `src/components/premium/PremiumLandingPage.tsx` | 376, 404, 438 | **“24-hour free trial”**, **“No credit card required to start trial”**. |
| `src/components/premium/PaywallOverlay.tsx` | 143 | **“Your free trial has ended.”** |
| `src/app/api/premium/start-trial/route.ts` | 94 | Message: free trial ended. |

### 2.2 “from €” / “from $” / “from NOK” (marketing)

**No clean marketing matches** for literal `from €` / `from $` / `from NOK` in `src/` (earlier grep picked email subjects with “from {name}”).

### 2.3 Currency amounts `[0-9]+ (EUR|NOK|USD|$|€|kr)` (representative)

| Path | Line | Example |
|------|------|---------|
| `src/components/dsb/DsbEmployerGuide.tsx` | 194 | **3,200 NOK** fee |
| `src/components/dsb/DsbTypeSelector.tsx` | 132, 153 | **15 EUR**, **39 EUR** |
| `src/app/dsb-support/eu/page.tsx` | 6 | metadata: **15 EUR** |
| `src/app/dsb-support/non-eu/page.tsx` | 6 | metadata: **39 EUR** |
| `src/app/outside-eu-eea/OutsideEuEeaClient.tsx` | 442 | **39 EUR** |
| `src/app/request/[token]/page.tsx` | 1693+ | **100 NOK** early bird, **1.000 NOK**, placeholders NOK/hour |
| `src/app/request/page.tsx` | 1292+ | **1,499 NOK/month**, **3,999 NOK/month** |
| `src/components/candidates/ElectriciansNorwayPage.tsx` | 173, 195, 200 | **260 to 330 NOK per hour** ranges |
| `src/components/candidates/TradeSpecialistCards.tsx` | 571 | **280 to 330 NOK per hour** |
| `src/components/welding/WeldingSpecialistsPage.tsx` | 317 | **280 to 330 NOK per hour** |

---

## 3. Promisiuni delivery

| Path | Line | Snippet / note |
|------|------|------------------|
| `src/components/ContextualHelper.tsx` | 37 | “First candidate profiles are often ready **within approximately two weeks**…” |
| `src/components/ContextualHelper.tsx` | 67, 73 | “**within 24 hours**” response SLAs |
| `src/components/dsb/DsbRequestPopup.tsx` | 143 | “contact you **within 24 hours**” |
| `src/app/api/send-request-email/route.ts` | 231 | Email preheader: **within 24 hours** |
| `src/app/for-employers/page.tsx` | 69 | “start sourcing **immediately**” |
| `src/components/dsb/DsbEmployerGuide.tsx` | 340, 344 | DSB context: “**immediately**” start work |
| `src/components/dsb/DsbCompleteGuide.tsx` | 483, 739 | Regulatory / DSB “**immediately**” |
| `src/app/request/[token]/page.tsx` | 751, 1593–1612 | `showInstantPanel`, **“Get instant results”**, “**Instant** candidate search” upsell |
| `src/components/dsb/DsbGuideCheckoutMobilePremium.tsx` | 53, 78, 283–351 | **“Instant delivery”**, “**Instant access**” |
| `src/app/dsb-checklist/DsbChecklistClient.tsx` | 70 | “**Instant** Access” |
| `src/components/monetization/ExitIntentPopup.tsx` | 98 | “**instant** email delivery” |
| `src/components/welding/WeldingSpecialistsPage.tsx` | 128, 159, 361 | **24 hours** assessment; **two weeks** profiles |
| `src/components/welding/WeldingSpecialistsCard.tsx` | 110 | **two weeks** |
| `src/components/pages/HomePageClient.tsx` | 428 | “**within about two weeks**” |
| `src/app/api/recruiter-network/apply/route.ts` | 126 | Email: contact **within 48 hours** |
| `src/lib/legal-seed-documents-data.ts` | 200 | GDPR breach **48 hours** (legal text, not marketing SLA) |
| `src/components/premium/PaywallOverlay.tsx` | 192 | “**Immediately**” subscribe CTA |
| `src/app/request/page.tsx` | 914 | “**instant** access” (partner upsell) |
| `src/app/api/legal-request/route.ts` | 130 | “reply … **immediately**” (security email; low risk) |

---

## 4. Stripe / payment references

**Stripe package / runtime:** `src/app/api/premium/create-checkout/route.ts`, `src/app/api/premium/webhook/route.ts`, `src/lib/dsbGuideCheckout.ts`, `src/app/api/dsb-guide/checkout/route.ts`, `src/app/api/dsb-guide/webhook/route.ts`, `src/lib/stripeCoupons.ts`, `src/lib/premium/stripeEnv.ts`, `src/lib/premium/subscribers.ts`, `src/app/premium/success/actions.ts`, `src/components/premium/PaywallOverlay.tsx`, DSB checkout components under `src/components/dsb/DsbGuideCheckout*.tsx`, `src/app/dsb-support/verify/page.tsx`, discount routes `src/app/api/dsb-guide/discount-offer/route.ts`, `src/lib/dsbDiscount*.ts`, `src/lib/sendDiscountReminder.ts`.

**Comment-only:** `src/lib/animationConstants.ts` line 1 — “Linear / **Stripe** style” (design comment, not payment).

**Other “checkout / subscription / purchase” (non-Stripe):** Many uses of `subscription` in `email_subscriptions` helpers (`getOrCreateSubscription`), “purchase” in DSB copy, `RequestPageClient` “Premium **Subscription**”, etc. Treat as **separate** from Stripe but still **BETA-relevant** if any copy promises self-serve product purchase for placements.

---

## 5. Talent network form

| Path | Line | Detail |
|------|------|--------|
| `src/lib/legal-seed-documents-data.ts` | 17, 29 | Privacy seed mentions **talent network registration**. |
| `src/app/for-candidates/page.tsx` | 8, 13, 160–163, 301+ | Imports `TalentNetworkJoinForm`, metadata “**Join our talent network**”, CTA `href="#join-talent"`, section `id="join-talent"`. |
| `src/app/for-candidates/TalentNetworkJoinForm.tsx` | 27–31, 112 | `POST` **`/api/candidate-join-network`**, button “**Join our talent network**”. |
| `src/app/api/candidate-join-network/route.ts` | 1–66 | Sends email to **cv@arbeidmatch.no** + auto-reply; **no DB insert**. |

**No** `join-talent` API path other than above. Footer uses **`/for-candidates`** and external **Apply** to jobs site (see §7).

---

## 6. Pagini key — status

### `/pricing`

- **Does not exist:** no `src/app/pricing/page.tsx`.

### `/premium`

- **Exists:** `src/app/premium/page.tsx` renders `PremiumLandingPage` inside `Suspense`.
- **Stripe:** Yes (client paywall + `/api/premium/create-checkout`, webhook, trial flow). **BETA conflict:** self-serve subscription product vs “ZERO Stripe on placements” (clarify if Premium guides stay as paid digital product during BETA).

### `/recruiter-network`

- **Exists:** `src/app/recruiter-network/page.tsx` → `RecruiterNetworkClient`.
- **Public signup:** **Yes** — large client form posts to **`/api/recruiter-network/apply`** (inserts `recruiter_applications`). **BETA conflict** if model is **invite-only** recruiters.

### `/for-candidates`

- **CTAs:** Hero CTA scrolls to **`#join-talent`**; bottom link to **`https://jobs.arbeidmatch.no`** (see file ~318); **TalentNetworkJoinForm** → `/api/candidate-join-network`.
- **BETA:** Talent network + email flow may duplicate **jobs.arbeidmatch.no** onboarding.

### `/` (homepage)

- **`src/app/page.tsx`:** Only wraps `HomePageClient` + `Testimonials` (no live stats).
- **`HomePageClient`:** Primary hire/work CTAs go to **`/for-employers`** / **`/for-candidates`**; role banners link **`https://jobs.arbeidmatch.no`**; bottom CTA **`/request`**; “**within about two weeks**” copy; **Electricians** strip **`/electricians-norway`**; no talent form on homepage.

---

## 7. Navbar + Footer + Welcome modal CTAs candidati

### Navbar (`src/components/Navbar.tsx`)

| Link / action | `href` |
|---------------|--------|
| Logo | `/` |
| For Employers (dropdown) | `/request`, `/for-staffing-agencies` |
| More (filtered, max 6) | `/bemanning-bygg-anlegg`, `/bemanning-industri`, `/dsb-support`, `/premium`, `/blog`, `/about` (DSB/Premium hidden for `employer` audience) |
| For Candidates | `/for-candidates` |
| About | `/about` |
| Contact | `/contact` |
| Desktop CTA | `/request` |

**No** explicit “Apply” in Navbar (candidates use page content / footer / jobs).

### Mobile drawer (`src/components/MobileDrawerContent.tsx`)

Same employer links + main links + **More** list as above; bottom CTA **`/request`**.

### Footer (`src/components/Footer.tsx`)

| Column | Labels → `href` |
|--------|-----------------|
| For Employers | `/request`, `/#how-it-works`, `/for-candidates`, **Apply** → `https://jobs.arbeidmatch.no` |
| Industries | 8 internal industry/trade URLs |
| Locations | 4 `bemanningsbyrå-*` URLs |
| Resources & Partners | `/for-staffing-agencies`, `/partners`, `/recruiter-network`, `/outside-eu-eea`, `/contact` |
| Legal | `/privacy`, `/terms`, `/dpa`, `/legal-request` |

### Welcome modal (`src/components/home/HomeWelcomeUserTypeSlideup.tsx`)

| Action | Navigation |
|--------|--------------|
| I’m an Employer | `router.push("/for-employers")` |
| I’m a Candidate | `router.push("/for-candidates")` |
| Just browsing | closes modal only (stays on homepage) |

**BETA note:** Candidate path goes to **`/for-candidates`** (talent form) **not** directly to **jobs.arbeidmatch.no**.

---

## 8. API routes candidati (and closely related)

| Path | Accepts candidate-ish input? | DB / side effects | BETA: disable or redirect? |
|------|------------------------------|-------------------|----------------------------|
| `POST /api/candidate-join-network` | Yes (email + consent) | **Email only** (no insert) | **Review:** replace UX with **jobs.arbeidmatch.no** if single funnel required |
| `GET /api/candidate-count` | No (server) | Reads **`ats_candidates`** | **Review:** counts may conflict with “no big validated numbers” messaging if re-exposed |
| `POST /api/candidate-interest` | Yes (partner session + candidateId) | Reads **`partner_sessions`**, emails/Slack | **Partner flow**, not jobs funnel; **review** if BETA freezes partner tools |
| `GET /api/candidates` | Session header | Reads **`Candidate`** (ATS) | Same |
| `POST /api/confirmation-feedback` | Score/note/email | Inserts **`candidate_feedback_submissions`** | **Review** vs jobs site feedback |
| `POST /api/guide-interest-signup` | Email | **`guide_interest_signups`** | Candidate marketing list |
| `POST /api/feature-waitlist` | Email | **`guide_interest_signups`** | Same pattern |
| `POST /api/non-eu-lead` | Lead fields | **`non_eu_leads`** | Candidate-side lead |
| `POST /api/send-eligibility-assistance` | Email | **`guide_interest_signups`** + email | Candidate assistance funnel |
| `POST /api/app-waitlist` | Email | **`app_waitlist`** | Generic waitlist |

**Employer-only but listed for completeness:** `save-employer-request`, `send-request-email`, `simple-request`, `request` token APIs, etc.

---

## 9. Recomandari de prioritizare pentru AM-WEB-086 (next task)

1. **Single candidate funnel:** Decide official rule: **all** candidate acquisition via **jobs.arbeidmatch.no** → then remove or redirect **`/for-candidates#join-talent`**, **`/api/candidate-join-network`**, and align **Welcome modal** “I’m a Candidate” to jobs URL (or intermediate explainer page).
2. **Recruiter network:** If **invite-only**, hide or gate **`/recruiter-network`** public form and **`POST /api/recruiter-network/apply`**, or replace with “request invitation”.
3. **Stripe scope decision:** Keep **DSB guide** and **Premium article** purchases if allowed as non-placement digital goods; otherwise freeze routes **`/api/dsb-guide/checkout`**, **`/api/premium/create-checkout`**, and related UI.
4. **Delivery SLAs:** Replace or soften **24h / 48h / instant / two weeks** marketing language sitewide where it implies contractual SLA (ContextualHelper, request flow, welding copy, email preheaders).
5. **Request flow pricing (`/request`, token page):** Reconcile **NOK/month** partner plans with “negotiated per contract” BETA (hide tiers, replace with “contact sales”, or move behind auth).
6. **Footer / cross-links:** Audit **Apply** vs **For Candidates** to avoid contradicting “everyone to jobs” policy.
7. **Premium metadata vs reality:** Metadata still says “coming soon” while app implements checkout; align copy and product state.
8. **Re-enable live stats later:** `LiveStatsSection.tsx` kept unused; ensure marketing never reintroduces unvalidated counts during BETA.

---

## Appendix A — Files touched by grep summaries (quick index)

- **Guarantee / warranty-style:** `TradeSpecialistCards.tsx`, `ElectriciansNorwayPage.tsx`, `premium/articles.ts`, `legal-seed-documents-data.ts`
- **Jobs portal:** `Footer.tsx`, `HomePageClient.tsx`, `for-candidates/page.tsx`, `TradeSpecialistCards.tsx`, `ElectriciansNorwayPage.tsx`, `WeldingSpecialistsPage.tsx`, `ContextualHelper.tsx`, `PreFooterCrossLinks.tsx`, `ScrollProgressCTA.tsx`, `DsbRequestPopup.tsx`, `about/page.tsx`
- **Stripe implementation:** under `src/app/api/premium/*`, `src/app/api/dsb-guide/*`, `src/lib/dsbGuideCheckout.ts`, `src/lib/premium/*`, `src/components/premium/*`, `src/components/dsb/DsbGuideCheckout*.tsx`

---

_End of audit document._
