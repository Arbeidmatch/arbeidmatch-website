/**
 * EU + EEA (IS, LI, NO) — dial prefixes and residence names for candidate registration.
 * Order: display is sorted by country name in UI.
 */
export const EEA_COUNTRY_DIALS = [
  { iso: "AT", dial: "+43", country: "Austria" },
  { iso: "BE", dial: "+32", country: "Belgium" },
  { iso: "BG", dial: "+359", country: "Bulgaria" },
  { iso: "HR", dial: "+385", country: "Croatia" },
  { iso: "CY", dial: "+357", country: "Cyprus" },
  { iso: "CZ", dial: "+420", country: "Czech Republic" },
  { iso: "DK", dial: "+45", country: "Denmark" },
  { iso: "EE", dial: "+372", country: "Estonia" },
  { iso: "FI", dial: "+358", country: "Finland" },
  { iso: "FR", dial: "+33", country: "France" },
  { iso: "DE", dial: "+49", country: "Germany" },
  { iso: "GR", dial: "+30", country: "Greece" },
  { iso: "HU", dial: "+36", country: "Hungary" },
  { iso: "IS", dial: "+354", country: "Iceland" },
  { iso: "IE", dial: "+353", country: "Ireland" },
  { iso: "IT", dial: "+39", country: "Italy" },
  { iso: "LV", dial: "+371", country: "Latvia" },
  { iso: "LI", dial: "+423", country: "Liechtenstein" },
  { iso: "LT", dial: "+370", country: "Lithuania" },
  { iso: "LU", dial: "+352", country: "Luxembourg" },
  { iso: "MT", dial: "+356", country: "Malta" },
  { iso: "NL", dial: "+31", country: "Netherlands" },
  { iso: "NO", dial: "+47", country: "Norway" },
  { iso: "PL", dial: "+48", country: "Poland" },
  { iso: "PT", dial: "+351", country: "Portugal" },
  { iso: "RO", dial: "+40", country: "Romania" },
  { iso: "SK", dial: "+421", country: "Slovakia" },
  { iso: "SI", dial: "+386", country: "Slovenia" },
  { iso: "ES", dial: "+34", country: "Spain" },
  { iso: "SE", dial: "+46", country: "Sweden" },
] as const;

export const DEFAULT_EEA_DIAL_PREFIX = "+47";

export const OUTSIDE_EEA_RESIDENCE_VALUE = "__outside_eea__" as const;

const DIALS_LONGEST_FIRST = [...EEA_COUNTRY_DIALS].sort((a, b) => b.dial.length - a.dial.length);

const RESIDENCE_NAMES = new Set<string>(EEA_COUNTRY_DIALS.map((r) => r.country));

export function eeaDialOptionsSortedByCountry(): readonly (typeof EEA_COUNTRY_DIALS)[number][] {
  return [...EEA_COUNTRY_DIALS].sort((a, b) => a.country.localeCompare(b.country, "en"));
}

export function isEeaResidenceCountryName(value: string): boolean {
  return RESIDENCE_NAMES.has(value.trim());
}

/** Normalise spaces/dashes; must start with + and one of the allowed EEA dial codes. */
export function isEeaCandidatePhone(phone: string): boolean {
  const t = phone.replace(/[\s-]/g, "");
  if (!t.startsWith("+")) return false;
  return DIALS_LONGEST_FIRST.some((p) => t.startsWith(p.dial) && t.length > p.dial.length);
}

export function splitEeaPhoneToParts(full: string): { dial: string; nationalDigits: string } {
  const t = full.replace(/[\s-]/g, "");
  if (!t.startsWith("+")) {
    return { dial: DEFAULT_EEA_DIAL_PREFIX, nationalDigits: t.replace(/\D/g, "") };
  }
  for (const p of DIALS_LONGEST_FIRST) {
    if (t.startsWith(p.dial)) {
      return { dial: p.dial, nationalDigits: t.slice(p.dial.length).replace(/\D/g, "") };
    }
  }
  return { dial: DEFAULT_EEA_DIAL_PREFIX, nationalDigits: "" };
}

export function buildEeaPhone(dial: string, nationalDigits: string): string {
  const d = DIALS_LONGEST_FIRST.some((p) => p.dial === dial) ? dial : DEFAULT_EEA_DIAL_PREFIX;
  const n = nationalDigits.replace(/\D/g, "");
  return `${d}${n}`;
}
