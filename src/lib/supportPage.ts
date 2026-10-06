/**
 * Where questions go. The owner's standing rule, 6 October 2026: no public e-mail
 * address or phone number is given for questions; a reader with a question is sent
 * to the support page. The ATS platform terms (version 10) use the same wording,
 * "our support" / "vår support", linked to this page.
 *
 * Kept elsewhere on purpose: the privacy and legal contact (post@) as data
 * controller, cv@ for sending CVs, the company identity line, and the addresses
 * mail is sent from or replied to.
 */

/** On the site itself: a relative link opens the support request on /contact. */
export const SUPPORT_PAGE_PATH = "/contact?support=1";

/** In mail and anywhere off the site. */
export const SUPPORT_PAGE_URL = "https://arbeidmatch.no/contact?support=1";

export const SUPPORT_LABEL = {
  en: "our support",
  nb: "vår support",
  ro: "suportul nostru",
} as const;
