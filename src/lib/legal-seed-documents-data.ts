/**
 * What a legal page shows when the published document could not be fetched from
 * the platform while the site was being built, and there is no earlier page.
 *
 * Legal review, 25 September 2026, approved by the owner: this text used to be a
 * full, months-old privacy policy and set of terms, with provider names and
 * retention periods that were no longer true, and it went live whenever the
 * platform did not answer. It is now deliberately empty of policy: who we are,
 * that the document is temporarily unavailable, and where to write. At request
 * or revalidation time it is never used at all; the page throws instead, so the
 * last good version stays up (see resolveLegalDocument).
 */

import { cachedSiteNumbers, text, type SiteNumbers } from "@/lib/numbers";

export const LEGAL_CONTACT_EMAIL = "post@arbeidmatch.no";

/**
 * Who we are, with the org number and the street from RecOS (ORDER 302). The
 * stand-in is built synchronously, so it reads the numbers the server last
 * fetched; a missing one leaves its piece of the sentence out.
 */
export function legalCompanyIdentity(numbers: SiteNumbers = cachedSiteNumbers()): string {
  const org = text(numbers, "company_org_number");
  const street = text(numbers, "company_street_address");
  return `ArbeidMatch Norge AS${org ? `, organisation number ${org} MVA` : ""}${street ? `, ${street}, 7056 Ranheim` : ""}, Trondheim, Norway.`;
}

/** The neutral stand-in for any legal document, under its own title. */
export function legalSeedMarkdown(title: string, numbers?: SiteNumbers): string {
  return `# ${title}

${legalCompanyIdentity(numbers)}

This document is temporarily unavailable. Please contact ${LEGAL_CONTACT_EMAIL} and we will send it to you.
`;
}

export const SEED_PRIVACY_MD = legalSeedMarkdown("Privacy Notice");

export const SEED_TERMS_MD = legalSeedMarkdown("Terms of Service");
