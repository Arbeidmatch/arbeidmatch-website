/**
 * Who may write as a company from outside Norway (ORDER 44, 5 October 2026).
 *
 * His rule: we work business to business within the EU/EEA only and sponsor no
 * visa or work permit. A foreign firm writes with its EU VAT number, checked in
 * VIES, a company e-mail address and a phone number in the EU/EEA. The United
 * Kingdom and Switzerland count as outside. A refusal is a popup on the page,
 * never a mail, and nothing is submitted.
 *
 * Pure, so the rules are tested without the network.
 */

/** EU/EEA countries a foreign firm may write from (Norway uses the Brreg form). */
export const EEA_COUNTRIES: ReadonlyArray<{ code: string; name: string; dial: string; vies: string | null }> = [
  { code: "AT", name: "Austria", dial: "43", vies: "AT" },
  { code: "BE", name: "Belgium", dial: "32", vies: "BE" },
  { code: "BG", name: "Bulgaria", dial: "359", vies: "BG" },
  { code: "HR", name: "Croatia", dial: "385", vies: "HR" },
  { code: "CY", name: "Cyprus", dial: "357", vies: "CY" },
  { code: "CZ", name: "Czechia", dial: "420", vies: "CZ" },
  { code: "DK", name: "Denmark", dial: "45", vies: "DK" },
  { code: "EE", name: "Estonia", dial: "372", vies: "EE" },
  { code: "FI", name: "Finland", dial: "358", vies: "FI" },
  { code: "FR", name: "France", dial: "33", vies: "FR" },
  { code: "DE", name: "Germany", dial: "49", vies: "DE" },
  { code: "GR", name: "Greece", dial: "30", vies: "EL" },
  { code: "HU", name: "Hungary", dial: "36", vies: "HU" },
  { code: "IE", name: "Ireland", dial: "353", vies: "IE" },
  { code: "IT", name: "Italy", dial: "39", vies: "IT" },
  { code: "LV", name: "Latvia", dial: "371", vies: "LV" },
  { code: "LT", name: "Lithuania", dial: "370", vies: "LT" },
  { code: "LU", name: "Luxembourg", dial: "352", vies: "LU" },
  { code: "MT", name: "Malta", dial: "356", vies: "MT" },
  { code: "NL", name: "Netherlands", dial: "31", vies: "NL" },
  { code: "PL", name: "Poland", dial: "48", vies: "PL" },
  { code: "PT", name: "Portugal", dial: "351", vies: "PT" },
  { code: "RO", name: "Romania", dial: "40", vies: "RO" },
  { code: "SK", name: "Slovakia", dial: "421", vies: "SK" },
  { code: "SI", name: "Slovenia", dial: "386", vies: "SI" },
  { code: "ES", name: "Spain", dial: "34", vies: "ES" },
  { code: "SE", name: "Sweden", dial: "46", vies: "SE" },
  // EEA, outside the EU: no VAT register in VIES.
  { code: "IS", name: "Iceland", dial: "354", vies: null },
  { code: "LI", name: "Liechtenstein", dial: "423", vies: null },
];

/** Norway's own prefix: a Norwegian number is inside the EEA too. */
const ALL_EEA_DIALS = [...EEA_COUNTRIES.map((c) => c.dial), "47"];

/**
 * Whether a phone number is in the EU/EEA, by its international prefix.
 * A number without one ("+" or "00") cannot be judged and returns null.
 */
export function phoneInEea(phone: string): boolean | null {
  const compact = phone.replace(/[\s().-]/g, "");
  const digits = compact.startsWith("+") ? compact.slice(1) : compact.startsWith("00") ? compact.slice(2) : null;
  if (!digits || !/^\d{6,15}$/.test(digits)) return null;
  return ALL_EEA_DIALS.some((dial) => digits.startsWith(dial));
}

/** Free and personal mail services: not a company address. */
const FREE_MAIL = [
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com", "ymail.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.net", "gmx.de",
  "mail.com", "yandex.com", "yandex.ru", "zoho.com", "web.de", "t-online.de", "freenet.de", "wp.pl", "o2.pl", "onet.pl",
  "interia.pl", "seznam.cz", "centrum.cz", "libero.it", "virgilio.it", "orange.fr", "laposte.net", "free.fr", "sfr.fr",
  "wanadoo.fr", "abv.bg", "mail.ru", "inbox.lv", "inbox.lt", "hotmail.co.uk", "yahoo.co.uk", "online.no", "tutanota.com",
];

export function isFreeMail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain) return true;
  if (FREE_MAIL.includes(domain)) return true;
  // hotmail.de, outlook.fr, yahoo.es and the like.
  return /^(hotmail|outlook|live|yahoo|gmx)\.[a-z.]+$/.test(domain);
}

/** The VAT number as VIES wants it: no country prefix, no spaces or dots. */
export function cleanVatNumber(vies: string, raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return compact.startsWith(vies) ? compact.slice(vies.length) : compact;
}

export type ForeignVerdict =
  | { ok: true; viesCountry: string | null; vat: string }
  | { ok: false; reason: "outside_eea" | "free_mail" | "phone_unreadable" | "unknown_country" };

/** Everything that can be decided without the network. */
export function judgeForeignCompany(input: { country: string; email: string; phone: string; vatNumber: string }): ForeignVerdict {
  const country = EEA_COUNTRIES.find((c) => c.code === input.country.trim().toUpperCase());
  if (!country) return { ok: false, reason: "unknown_country" };
  const inEea = phoneInEea(input.phone);
  if (inEea === null) return { ok: false, reason: "phone_unreadable" };
  if (!inEea) return { ok: false, reason: "outside_eea" };
  if (isFreeMail(input.email)) return { ok: false, reason: "free_mail" };
  return { ok: true, viesCountry: country.vies, vat: country.vies ? cleanVatNumber(country.vies, input.vatNumber) : input.vatNumber.trim() };
}

export const RECRUITER_NETWORK_URL = "https://arbeidmatch.no/recruiter-network";

/** His words, in English and in the form's language (Norwegian). */
export const POLICY_REFUSAL = {
  en: "We work business-to-business within the EU/EEA only, and we do not offer visa or work permit sponsorship. For this reason we cannot take on orders or collaborations with companies outside the EU/EEA, or requests without a company e-mail address. If you are a recruitment or staffing company within the EU/EEA and want to work with us, please use our Recruiter network form:",
  nb: "Vi jobber kun bedrift-til-bedrift innenfor EU/EØS, og vi tilbyr ikke sponsing av visum eller arbeidstillatelse. Derfor kan vi ikke ta imot oppdrag eller samarbeid med bedrifter utenfor EU/EØS, eller henvendelser uten en bedrifts-e-postadresse. Er du et rekrutterings- eller bemanningsbyrå innenfor EU/EØS og ønsker å samarbeide med oss, bruk skjemaet for vårt rekrutterernettverk:",
} as const;
