/** EU member states (27) + EEA-only: Iceland, Liechtenstein, Norway. */
const EU_MEMBER_STATES = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
] as const;

const EEA_NON_EU = ["Iceland", "Liechtenstein", "Norway"] as const;

const PRIORITY_COUNTRIES = ["Norway", "Denmark", "Sweden"] as const;

/** All EU/EEA country names; Norway, Denmark, Sweden listed first. */
export const RECRUITER_EEA_COUNTRIES: string[] = (() => {
  const set = new Set<string>([...EU_MEMBER_STATES, ...EEA_NON_EU]);
  const prioritySet = new Set<string>(PRIORITY_COUNTRIES);
  const rest = [...set].filter((c) => !prioritySet.has(c));
  rest.sort((a, b) => a.localeCompare(b, "en"));
  return [...PRIORITY_COUNTRIES, ...rest];
})();

export function filterCountriesByPrefix(query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return RECRUITER_EEA_COUNTRIES;
  return RECRUITER_EEA_COUNTRIES.filter((name) => name.toLowerCase().startsWith(q));
}

/** Norwegian counties (fylker) — current structure. */
export const NORWAY_REGIONS = [
  "Agder",
  "Innlandet",
  "Møre og Romsdal",
  "Nordland",
  "Oslo",
  "Rogaland",
  "Troms og Finnmark",
  "Trøndelag",
  "Vestfold og Telemark",
  "Vestland",
  "Viken",
] as const;

/** Danish regions (English names). */
export const DENMARK_REGIONS = [
  "Capital Region (Hovedstaden)",
  "Central Denmark (Midtjylland)",
  "North Denmark (Nordjylland)",
  "Zealand (Sjælland)",
  "Southern Denmark (Syddanmark)",
] as const;

/** Swedish counties / län (English). */
export const SWEDEN_REGIONS = [
  "Blekinge",
  "Dalarna",
  "Gävleborg",
  "Gotland",
  "Halland",
  "Jämtland",
  "Jönköping",
  "Kalmar",
  "Kronoberg",
  "Norrbotten",
  "Örebro",
  "Östergötland",
  "Skåne",
  "Stockholm",
  "Södermanland",
  "Uppsala",
  "Värmland",
  "Västerbotten",
  "Västernorrland",
  "Västmanland",
  "Västra Götaland",
] as const;

export function regionsForCountry(country: string): readonly string[] | null {
  if (country === "Norway") return NORWAY_REGIONS;
  if (country === "Denmark") return DENMARK_REGIONS;
  if (country === "Sweden") return SWEDEN_REGIONS;
  return null;
}

export function filterRegionsByPrefix(regions: readonly string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...regions];
  return regions.filter((r) => r.toLowerCase().startsWith(q));
}
