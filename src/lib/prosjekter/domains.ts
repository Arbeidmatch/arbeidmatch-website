/**
 * What kind of work a project is, from its CPV codes.
 *
 * A copy of the ATS's own table (src/lib/future-projects/domains.ts there),
 * kept identical in behaviour so the domain filter on this site and the one in
 * the ATS agree. The construction codes (45...) name the trade by their first
 * digits; a project can be in several domains.
 */

export type DomainKey =
  | "buildings"
  | "roads"
  | "civil"
  | "water"
  | "groundworks"
  | "structure"
  | "electrical"
  | "plumbing"
  | "installations"
  | "finishing"
  | "equipment"
  | "general";

export type Domain = { key: DomainKey; en: string; no: string; prefixes: string[] };

export const DOMAINS: Domain[] = [
  { key: "buildings", en: "Buildings", no: "Bygg", prefixes: ["4521"] },
  { key: "roads", en: "Roads, rail and pipelines", no: "Vei, bane og ledningsnett", prefixes: ["4523"] },
  { key: "civil", en: "Bridges, tunnels and plants", no: "Bruer, tunneler og anlegg", prefixes: ["4522", "4525"] },
  { key: "water", en: "Harbours and waterworks", no: "Havn, kai og vannbygg", prefixes: ["4524"] },
  { key: "groundworks", en: "Groundworks and demolition", no: "Grunnarbeid og riving", prefixes: ["451"] },
  { key: "structure", en: "Concrete, roofing and scaffolding", no: "Betong, tak og stillas", prefixes: ["4526"] },
  { key: "electrical", en: "Electrical", no: "Elektro", prefixes: ["4531"] },
  { key: "plumbing", en: "Plumbing, heating and ventilation", no: "Rør og ventilasjon", prefixes: ["4533"] },
  { key: "installations", en: "Insulation and other installations", no: "Isolasjon og andre installasjoner", prefixes: ["4532", "4534", "4535"] },
  { key: "finishing", en: "Carpentry, flooring and painting", no: "Tømrer, gulv og maling", prefixes: ["454"] },
  { key: "equipment", en: "Machine hire with operator", no: "Maskinutleie med fører", prefixes: ["455"] },
  // Nothing more specific than "construction" in the notice.
  { key: "general", en: "General construction", no: "Bygg og anlegg generelt", prefixes: [] },
];

const BY_KEY = new Map(DOMAINS.map((d) => [d.key, d]));

export function isDomainKey(value: unknown): value is DomainKey {
  return typeof value === "string" && BY_KEY.has(value as DomainKey);
}

export function domainLabel(key: DomainKey, language: "en" | "no" = "en"): string {
  const d = BY_KEY.get(key);
  return d ? d[language] : key;
}

/**
 * The domains a project's codes fall in, in the order of DOMAINS. Codes that
 * say only "construction" with nothing more specific are General construction;
 * codes outside 45 are ignored.
 */
export function domainsOf(cpvCodes: readonly string[] | null | undefined): DomainKey[] {
  const codes = (cpvCodes ?? []).map((c) => String(c).replace(/\D/g, "")).filter((c) => c.startsWith("45"));
  const found = new Set<DomainKey>();
  for (const code of codes) {
    for (const d of DOMAINS) {
      if (d.prefixes.some((p) => code.startsWith(p))) found.add(d.key);
    }
  }
  if (found.size === 0 && codes.length > 0) found.add("general");
  return DOMAINS.map((d) => d.key).filter((k) => found.has(k));
}
