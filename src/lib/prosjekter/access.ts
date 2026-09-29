import { DOMAINS } from "@/lib/prosjekter/domains";
import { regionChoices } from "@/lib/prosjekter/format";
import { isValidOrgNumber, normalizeOrgNumber } from "@/lib/orgNumber";

/**
 * The "Be om tilgang" form and the login form, checked the same way in the
 * browser and in the website's routes before anything goes to the ATS.
 * Messages are Norwegian and name the field, so the form can show them there.
 *
 * The owner's rules for the access form, 29 September 2026: the company is
 * picked from the register (so it always has its organisation number), the
 * person gives their name and their role in the company, and confirms that
 * their contact details are on the company's own website, which we check. An
 * address we do not already hold confirms itself with a code (checkAccessCode).
 */

export type AccessRequest = {
  company: string;
  orgnr: string;
  email: string;
  phone: string;
  regions: string[];
  domains: string[];
  contact_name: string;
  contact_role: string;
  website_confirmed: true;
};

export type AccessField =
  | "company"
  | "contact_name"
  | "contact_role"
  | "email"
  | "phone"
  | "regions"
  | "domains"
  | "website_confirmed";

export type Checked<T> = { ok: true; value: T } | { ok: false; field: AccessField; error: string };

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^[+0-9 ()-]{5,24}$/;

/** Today's 15 counties, in the order the form lists them (south to north, the capital first). */
export const ACCESS_REGION_CODES: string[] = regionChoices().map((r) => r.code);
export const ACCESS_DOMAIN_KEYS: string[] = DOMAINS.map((d) => d.key);

export function isEmailShape(value: string): boolean {
  return value.length <= 254 && EMAIL.test(value);
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

function knownList(v: unknown, known: readonly string[]): string[] | null {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string" || !known.includes(item)) return null;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

export function checkAccessRequest(raw: unknown): Checked<AccessRequest> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const company = text(r.company, 160);
  const orgnr = normalizeOrgNumber(text(r.orgnr, 20));
  if (company.length < 2 || !orgnr || !isValidOrgNumber(orgnr)) {
    return { ok: false, field: "company", error: "Søk opp firmaet og velg det fra listen." };
  }

  const contact_name = text(r.contact_name, 120);
  if (contact_name.length < 2) return { ok: false, field: "contact_name", error: "Skriv inn navnet ditt." };
  const contact_role = text(r.contact_role, 80);
  if (contact_role.length < 2) return { ok: false, field: "contact_role", error: "Skriv inn rollen din i firmaet." };

  const email = text(r.email, 254).toLowerCase();
  if (!isEmailShape(email)) return { ok: false, field: "email", error: "Skriv inn en gyldig e-postadresse." };

  const phone = text(r.phone, 24);
  if (phone && !PHONE.test(phone)) return { ok: false, field: "phone", error: "Skriv telefonnummeret med siffer." };

  const regions = knownList(r.regions, ACCESS_REGION_CODES);
  if (!regions) return { ok: false, field: "regions", error: "Velg fylker fra listen." };
  const domains = knownList(r.domains, ACCESS_DOMAIN_KEYS);
  if (!domains) return { ok: false, field: "domains", error: "Velg fag fra listen." };

  if (r.website_confirmed !== true) {
    return { ok: false, field: "website_confirmed", error: "Bekreft at kontaktinformasjonen din står på firmaets nettside." };
  }

  return {
    ok: true,
    value: { company, orgnr, email, phone, regions, domains, contact_name, contact_role, website_confirmed: true },
  };
}

const REQUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The request the code belongs to, as the ATS handed it out. */
export function isAccessRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_ID.test(value);
}

/** The six digits from the e-mail, spaces allowed while typing. */
export function checkAccessCode(raw: unknown): { ok: true; code: string } | { ok: false; error: string } {
  const code = typeof raw === "string" ? raw.replace(/\s+/g, "") : "";
  return /^\d{6}$/.test(code) ? { ok: true, code } : { ok: false, error: "Koden har 6 siffer." };
}

export function checkLoginEmail(raw: unknown): { ok: true; email: string } | { ok: false; error: string } {
  const email = text(raw, 254).toLowerCase();
  return isEmailShape(email) ? { ok: true, email } : { ok: false, error: "Skriv inn en gyldig e-postadresse." };
}

/** A login link's token: what the ATS hands out, without anything that could change the path. */
export function isLoginToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

/** A site path the ATS may link a sent project to; anything else is not shown as a link. */
export function isSentProjectPath(value: unknown): value is string {
  return typeof value === "string" && /^\/prosjekt(er)?\/[A-Za-z0-9-]{6,80}$/.test(value);
}
