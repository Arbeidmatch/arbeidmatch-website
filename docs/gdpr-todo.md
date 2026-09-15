# GDPR remediation checklist

Index for `docs/gdpr-audit.md` (audit 15 September 2026). Every **critical** and **high** finding has
a GitHub issue. Medium and low findings are tracked here only — open issues for them as they are
scheduled.

**Nothing has been fixed yet.** The audit was read-only: no code, migration, policy row or production
data was modified.

## P0 — this week

- [ ] **F-02** Admin password in the public JS bundle → [#15](https://github.com/Arbeidmatch/arbeidmatch-website/issues/15) — **check the Vercel env values first**
- [ ] **F-01** Pre-ticked marketing consent → [#14](https://github.com/Arbeidmatch/arbeidmatch-website/issues/14) — one-word fix
- [ ] **F-03** Hardcoded `gdpr_processing_consent: true` → [#19](https://github.com/Arbeidmatch/arbeidmatch-website/issues/19)
- [ ] **F-05 / F-06** `/cookies` 404 + banner with no choice → [#20](https://github.com/Arbeidmatch/arbeidmatch-website/issues/20)
- [ ] **F-09** Notice contradicts the code in 9 places → [#16](https://github.com/Arbeidmatch/arbeidmatch-website/issues/16)
- [ ] **F-10** CV generator undisclosed → [#17](https://github.com/Arbeidmatch/arbeidmatch-website/issues/17)

## P1 — this month

- [ ] **F-15** No retention mechanism on 15 tables → [#18](https://github.com/Arbeidmatch/arbeidmatch-website/issues/18) ⚠️ *migration, needs sign-off*
- [ ] **F-16** `cv_candidates` never deleted → [#26](https://github.com/Arbeidmatch/arbeidmatch-website/issues/26) ⚠️ *migration, needs sign-off*
- [ ] **F-08** Four undisclosed non-EEA processors → [#21](https://github.com/Arbeidmatch/arbeidmatch-website/issues/21)
- [ ] **F-19** Nationality + salary + score to partners; reusable URL token → [#23](https://github.com/Arbeidmatch/arbeidmatch-website/issues/23)
- [ ] **F-12** No export or erasure outside the CV module → [#22](https://github.com/Arbeidmatch/arbeidmatch-website/issues/22)
- [ ] **F-22** No 2FA on admin surfaces → [#25](https://github.com/Arbeidmatch/arbeidmatch-website/issues/25)
- [ ] **F-04 / F-07 / F-11** Consent metadata, informed consent, version alignment → [#27](https://github.com/Arbeidmatch/arbeidmatch-website/issues/27)
- [ ] **F-20** RecMan: gate `CV_PUSH_TO_ATS` on a signed DPA → [#28](https://github.com/Arbeidmatch/arbeidmatch-website/issues/28)
- [ ] **F-25** In-memory rate limiting is ineffective on serverless — `src/lib/apiSecurity.ts:9`
- [ ] **F-13** DSR intake: no rate limit, no identity check, no 30-day alerting — `src/app/api/legal-request/route.ts`

## P2 — this quarter

- [ ] **F-21** Write the DPIA → [#24](https://github.com/Arbeidmatch/arbeidmatch-website/issues/24)
- [ ] **F-14** No Art. 18 restriction or Art. 21 objection path
- [ ] **F-17** Retention periods exceed Datatilsynet practice for unsuccessful candidates
- [ ] **F-18** Plaintext e-mail + IP retained in `request_access_otps` (22 rows from 23 July still present)
- [ ] **F-23** Notice claims field-level encryption at rest; none exists
- [ ] **F-24** No audit log of access to candidate data
- [ ] **F-26** RLS correct in the live DB but missing from 6 checked-in SQL scripts — add a CI check
- [ ] **F-27** `/api/token-data/[token]` ignores `expires_at` — `src/app/api/token-data/[token]/route.ts:23-27`
- [ ] **F-28** Stack traces + arbitrary `context` sent to GitHub — `src/lib/errorNotifier.ts:210-222`

## P3 — backlog

- [ ] **F-29** `form_answers` duplicates the raw payload — make sure erasure covers it
- [ ] **F-30** `vercel.json:12-15` schedules a cron for a route that does not exist
- [ ] **F-31** Server-side Turnstile verification disabled — `src/app/api/contact/route.ts:19-23`

## Out of scope here — but required

- [ ] **Audit `ats-recruitment`.** Job applications, CV files, candidate records, mail relay and the
      claimed file gate, retention clock and 2FA all live there. This repo forwards to it and cannot
      vouch for it. Compliance cannot be claimed end to end without that audit.
- [ ] **Fix `jobs.arbeidmatch.no` implied cookie consent.** Separate deployment, not audited.
- [ ] **Confirm a DPA exists** with Supabase, Vercel, one.com, Slack, GitHub, Stripe and Cloudflare.
      This is a commercial fact, not a code fact — the audit could only list what the code uses.
- [ ] **Document backup retention and deletion** at Supabase (PITR window) and one.com.
