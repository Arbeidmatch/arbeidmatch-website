import type { AnswerMode, Benefit, TradeKey } from "@/lib/pay-conditions";

/**
 * What the popup offers, and the shape of the answers it keeps (ORDER 224).
 * Every word here is read by a Norwegian client, so it is bokmål with its own
 * letters.
 */

export const STORAGE_KEY = "rask-foresporsel-v1";
export const TOTAL_STEPS = 8;

export const TRADES: ReadonlyArray<{ key: TradeKey; label: string; category: string }> = [
  // category: the detailed wizard's industry for the same trade, which the ATS already reads.
  { key: "bygg", label: "Bygg og anlegg", category: "Construction" },
  { key: "elektro", label: "Elektro og teknikk", category: "Electrical" },
  { key: "industri", label: "Industri", category: "Industry and Production" },
  { key: "logistikk", label: "Logistikk", category: "Logistics" },
  { key: "helse", label: "Helse", category: "Healthcare" },
  { key: "horeca", label: "Horeca", category: "HoReCa" },
  { key: "renhold", label: "Renhold", category: "Cleaning" },
  { key: "annet", label: "Annet", category: "Other" },
];

/** The common roles per trade. "Annet" has none: only "Annen rolle". */
export const ROLES_BY_TRADE: Record<TradeKey, readonly string[]> = {
  bygg: [
    "Tømrer",
    "Betongarbeider",
    "Forskalingssnekker",
    "Murer",
    "Flislegger",
    "Maler",
    "Stillasbygger",
    "Rørlegger",
    "Anleggsarbeider",
    "Hjelpearbeider",
  ],
  elektro: [
    "Elektriker",
    "Industrielektriker",
    "Automatiker",
    "Elektromontør",
    "Ventilasjonsmontør",
    "Kuldetekniker",
    "Servicetekniker",
    "Solcellemontør",
  ],
  industri: [
    "Sveiser",
    "Platearbeider",
    "CNC-operatør",
    "Maskinoperatør",
    "Industrimekaniker",
    "Prosessoperatør",
    "Produksjonsmedarbeider",
    "Fiskeindustriarbeider",
  ],
  logistikk: ["Lastebilsjåfør", "Varebilsjåfør", "Bussjåfør", "Truckfører", "Kranfører", "Lagermedarbeider", "Terminalarbeider"],
  helse: ["Sykepleier", "Helsefagarbeider", "Vernepleier", "Pleieassistent", "Miljøarbeider"],
  horeca: ["Kokk", "Kjøkkenassistent", "Servitør", "Bartender", "Oppvasker", "Resepsjonist", "Romholder"],
  renhold: ["Renholder", "Byggrenholder", "Industrirenholder", "Vindusvasker", "Vaktmester"],
  annet: [],
};

export const OTHER_ROLE = "Annen rolle";

export const COUNTS = ["1", "2", "3", "5", "10"] as const;
export const MORE_COUNTS = ["15", "20", "30", "50"] as const;
export const MORE = "Flere";

export const WHEN_OPTIONS = ["Så snart som mulig", "Om 2 uker", "Neste måned"] as const;
export const PICK_DATE = "Velg dato";

/** The fifteen counties of 2024, and the larger towns of each. */
export const COUNTIES: ReadonlyArray<{ name: string; towns: readonly string[] }> = [
  { name: "Agder", towns: ["Kristiansand", "Arendal", "Grimstad", "Mandal", "Flekkefjord"] },
  { name: "Akershus", towns: ["Lillestrøm", "Sandvika", "Asker", "Jessheim", "Ski", "Lørenskog"] },
  { name: "Buskerud", towns: ["Drammen", "Kongsberg", "Hønefoss", "Hokksund"] },
  { name: "Finnmark", towns: ["Alta", "Hammerfest", "Vadsø", "Kirkenes"] },
  { name: "Innlandet", towns: ["Hamar", "Lillehammer", "Gjøvik", "Elverum", "Kongsvinger"] },
  { name: "Møre og Romsdal", towns: ["Ålesund", "Molde", "Kristiansund", "Ørsta", "Ulsteinvik"] },
  { name: "Nordland", towns: ["Bodø", "Mo i Rana", "Narvik", "Mosjøen", "Svolvær"] },
  { name: "Oslo", towns: ["Oslo"] },
  { name: "Rogaland", towns: ["Stavanger", "Sandnes", "Haugesund", "Bryne", "Egersund"] },
  { name: "Telemark", towns: ["Skien", "Porsgrunn", "Notodden", "Kragerø"] },
  { name: "Troms", towns: ["Tromsø", "Harstad", "Finnsnes"] },
  { name: "Trøndelag", towns: ["Trondheim", "Steinkjer", "Stjørdal", "Levanger", "Namsos", "Orkanger"] },
  { name: "Vestfold", towns: ["Tønsberg", "Sandefjord", "Larvik", "Horten", "Holmestrand"] },
  { name: "Vestland", towns: ["Bergen", "Førde", "Voss", "Stord", "Florø"] },
  { name: "Østfold", towns: ["Fredrikstad", "Sarpsborg", "Moss", "Halden", "Askim"] },
];

export const ELSEWHERE_IN_COUNTY = "Annet sted i fylket";

export type RaskAnswers = {
  answerMode: AnswerMode | "";
  trade: TradeKey | "";
  roles: string[];
  otherRoleChosen: boolean;
  otherRole: string;
  count: string;
  showMoreCounts: boolean;
  when: string;
  date: string;
  county: string;
  town: string;
  equalTreatment: boolean;
  payFrom: string;
  payTo: string;
  /** True once the client changed Fra himself; until then it follows the floor. */
  payFromTouched: boolean;
  benefits: Benefit[];
  companyQuery: string;
  company: { name: string; orgNumber: string; city?: string } | null;
  email: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
};

export type RaskState = {
  step: number;
  answers: RaskAnswers;
};

export const EMPTY_ANSWERS: RaskAnswers = {
  answerMode: "",
  trade: "",
  roles: [],
  otherRoleChosen: false,
  otherRole: "",
  count: "",
  showMoreCounts: false,
  when: "",
  date: "",
  county: "",
  town: "",
  equalTreatment: false,
  payFrom: "",
  payTo: "",
  payFromTouched: false,
  benefits: [],
  companyQuery: "",
  company: null,
  email: "",
  privacyAccepted: false,
  termsAccepted: false,
};

export const INITIAL_STATE: RaskState = { step: 1, answers: EMPTY_ANSWERS };

export function tradeOf(key: string) {
  return TRADES.find((t) => t.key === key) ?? null;
}

export function countyOf(name: string) {
  return COUNTIES.find((c) => c.name === name) ?? null;
}

/** The roles as asked for: the chosen tiles, then the one typed under "Annen rolle". */
export function chosenRoles(a: RaskAnswers): string[] {
  const typed = a.otherRoleChosen ? a.otherRole.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  return [...a.roles, ...(typed ? [typed] : [])];
}

/** "Utenfor våre fag": a role we do not list, or the trade "Annet". The recruiter decides. */
export function isOutsideOurTrades(a: RaskAnswers): boolean {
  return a.trade === "annet" || (a.otherRoleChosen && a.otherRole.trim() !== "");
}

/** The place as one line: the town, or the county when the client chose somewhere else in it. */
export function placeLine(a: RaskAnswers): string {
  if (!a.county) return "";
  if (!a.town || a.town === ELSEWHERE_IN_COUNTY) return `${a.county} (annet sted i fylket)`;
  return a.town === a.county ? a.town : `${a.town}, ${a.county}`;
}

/** The start as one line: the chosen answer, or the date as dd.mm.yyyy. */
export function whenLine(a: RaskAnswers): string {
  if (a.when === PICK_DATE) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a.date);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  }
  return a.when;
}

/** A title inside a sentence starts small ("tømrer"); "CNC-operatør" keeps its capitals. */
const inSentence = (role: string) => (/^\p{Lu}\p{Ll}/u.test(role) ? role.charAt(0).toLowerCase() + role.slice(1) : role);

/** The pay as "260-300 kr/t", "260 kr/t", or "" when none was given. */
export function payLine(a: RaskAnswers): string {
  const from = a.payFrom.trim();
  const to = a.payTo.trim();
  if (!from) return "";
  return to && to !== from ? `${from}-${to} kr/t` : `${from} kr/t`;
}

/** The request in one line, e.g. "3 personer: betongarbeider, Trondheim, Trøndelag, så snart som mulig, 260-300 kr/t". */
export function summaryLine(a: RaskAnswers): string {
  const roles = chosenRoles(a).map(inSentence);
  const who = a.count ? `${a.count} ${a.count === "1" ? "person" : "personer"}${roles.length ? `: ${roles.join(", ")}` : ""}` : roles.join(", ");
  const when = whenLine(a);
  return [who, placeLine(a), when ? inSentence(when) : "", payLine(a)].filter(Boolean).join(", ");
}

/** The step a set of answers may be shown at: never past the first one still missing. */
export function firstOpenStep(a: RaskAnswers): number {
  if (a.answerMode !== "rolle") return 1;
  if (!a.trade) return 2;
  if (chosenRoles(a).length === 0) return 3;
  if (!a.count) return 4;
  if (!whenLine(a)) return 5;
  if (!a.county || !a.town) return 6;
  return 7;
}
