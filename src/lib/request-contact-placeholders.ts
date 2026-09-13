/**
 * The placeholder values older request tokens were created with.
 *
 * request_tokens.company, full_name and phone are NOT NULL, and until
 * 13 September 2026 a token was created before anyone had typed them, filled
 * with these strings. The wizard read them back as if they were answers: the
 * client was greeted "Thank you, To be completed" and the page said "Thank you,
 * Employer Request!". Tokens live for up to 14 days, so rows written before the
 * fix still carry them; everything that reads a token passes its values
 * through here and treats a placeholder as "not known yet".
 */
const PLACEHOLDERS = new Set(
  [
    "to be completed",
    "employer request",
    "partner contact",
    "partner company",
    "unknown company",
    "n/a",
    "na",
    "-",
    "000000",
  ].map((s) => s.toLowerCase()),
);

/** The value as typed, or "" when it is empty or one of the old placeholders. */
export function realContactValue(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (PLACEHOLDERS.has(trimmed.toLowerCase())) return "";
  // A phone made only of zeros is the old "000000", whatever its length, and
  // also after the country prefix the wizard puts in front ("+47 000000").
  const local = trimmed.replace(/^\+\d{1,3}\s+/, "");
  if (/^[\s0-]+$/.test(local) && /0/.test(local)) return "";
  return trimmed;
}

export type KnownContact = {
  companyName: string;
  firstName: string;
  lastName: string;
  phoneDigits: string;
};

/** What a token row actually tells us about the client, placeholders removed. */
export function knownContactFromToken(row: {
  company?: string | null;
  full_name?: string | null;
  phone?: string | null;
  partnerCompanyName?: string | null;
}): KnownContact {
  const companyName = realContactValue(row.partnerCompanyName) || realContactValue(row.company);
  const fullName = realContactValue(row.full_name);
  const [firstName = "", ...rest] = fullName.split(/\s+/).filter(Boolean);
  const phoneDigits = realContactValue(row.phone).replace(/\D/g, "");
  return { companyName, firstName, lastName: rest.join(" "), phoneDigits };
}

/**
 * True when the wizard may skip the step that asks for company, contact name
 * and phone. It may only skip what it already knows: a partner or owner token
 * without a name or a phone is asked like anyone else.
 */
export function contactIsComplete(contact: KnownContact): boolean {
  return (
    contact.companyName.length >= 2 &&
    contact.firstName.length >= 1 &&
    contact.lastName.length >= 1 &&
    contact.phoneDigits.length >= 6
  );
}
