/**
 * PAY AND CONDITIONS ON A REQUEST FOR PEOPLE (ORDER 224, the owner, 5 November
 * 2026): the client confirms equal treatment, gives an hourly range that
 * respects the minimum rate Arbeidstilsynet publishes for the trade, and may
 * tick the benefits the candidate gets.
 *
 * One module for the popup ("Rask forespørsel"), the detailed wizard and the
 * save route, so the browser and the server refuse the same things in the same
 * words.
 *
 * The floor is never invented (his rule): it comes from the table the owner
 * keeps in RecOS, read through one public route. A trade with no row, or a
 * route that does not answer, means no floor: the link alone, and any amount
 * at or above zero.
 */

/** Arbeidstilsynet's page on the minimum rates (allmenngjorte tariffavtaler). */
export const ARBEIDSTILSYNET_MINSTELONN_URL = "https://www.arbeidstilsynet.no/arbeidsforhold/lonn/minstelonn/";

/** The equal-treatment confirmation, word for word (arbeidsmiljøloven § 14-12 a). */
export const EQUAL_TREATMENT_TEXT =
  "Vi bekrefter at lønn og arbeidsvilkår for innleide er minst like gode som om de var ansatt direkte hos oss for samme arbeid (likebehandlingsprinsippet, arbeidsmiljøloven § 14-12 a).";

export const ANSWER_MODES = ["rolle", "detaljer"] as const;
export type AnswerMode = (typeof ANSWER_MODES)[number];

export function isAnswerMode(value: unknown): value is AnswerMode {
  return value === "rolle" || value === "detaljer";
}

/** Where the client's choice of answer mode travels from /request to the wizard. */
export const ANSWER_MODE_STORAGE_KEY = "rask-foresporsel-svar";

/** The eight trades of the popup, by key. */
export const TRADE_KEYS = ["bygg", "elektro", "industri", "logistikk", "helse", "horeca", "renhold", "annet"] as const;
export type TradeKey = (typeof TRADE_KEYS)[number];

export function isTradeKey(value: unknown): value is TradeKey {
  return typeof value === "string" && (TRADE_KEYS as readonly string[]).includes(value);
}

/** The optional benefits, as the client reads them and as they are stored. */
export const BENEFITS = [
  "Bolig uten trekk",
  "Bolig med trekk i lønn",
  "Transport til arbeidsstedet",
  "Kost",
  "Arbeidstøy og verneutstyr",
  "Verktøy",
  "Reise hjem betalt",
  "Ingen tillegg",
] as const;
export type Benefit = (typeof BENEFITS)[number];

export const NO_BENEFITS: Benefit = "Ingen tillegg";
const HOUSING_PAIR: readonly Benefit[] = ["Bolig uten trekk", "Bolig med trekk i lønn"];

/**
 * The benefits after a tap on one of them. "Ingen tillegg" stands alone, and
 * the two housing answers exclude each other.
 */
export function toggleBenefit(current: readonly string[], benefit: Benefit): Benefit[] {
  const list = current.filter((b): b is Benefit => (BENEFITS as readonly string[]).includes(b));
  if (list.includes(benefit)) return list.filter((b) => b !== benefit);
  if (benefit === NO_BENEFITS) return [NO_BENEFITS];
  let next = list.filter((b) => b !== NO_BENEFITS);
  if (HOUSING_PAIR.includes(benefit)) next = next.filter((b) => !HOUSING_PAIR.includes(b));
  return [...next, benefit];
}

export type PayFloorRow = {
  role: string | null;
  rate_per_hour: number;
  valid_from?: string;
  source_url?: string | null;
};

const roleKey = (value: string) => value.trim().toLowerCase();

/**
 * The floor for the chosen roles: the highest rate among the trade-wide rows
 * (role null) and the rows for one of the chosen roles. Null when no row
 * applies. A rate that is not a positive number is ignored, never guessed.
 */
export function selectPayFloor(floors: readonly PayFloorRow[] | null | undefined, roles: readonly string[]): number | null {
  if (!Array.isArray(floors)) return null;
  const wanted = new Set(roles.map(roleKey).filter(Boolean));
  let best: number | null = null;
  for (const row of floors) {
    if (!row || typeof row !== "object") continue;
    const rate = Number(row.rate_per_hour);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const applies = row.role === null || row.role === undefined || (typeof row.role === "string" && wanted.has(roleKey(row.role)));
    if (!applies) continue;
    if (best === null || rate > best) best = rate;
  }
  return best;
}

/** The base address of RecOS for a browser. */
export function atsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_ATS_URL?.trim() || "https://ats.arbeidmatch.no").replace(/\/$/, "");
}

/**
 * The floors RecOS holds for a trade. Any failure (no route yet, a 404, a
 * timeout, a body of another shape) is an empty list: no floor.
 */
export async function fetchPayFloors(trade: string, fetcher: typeof fetch = fetch): Promise<PayFloorRow[]> {
  if (!isTradeKey(trade) || trade === "annet") return [];
  try {
    const response = await fetcher(`${atsBaseUrl()}/api/public/pay-floor?trade=${encodeURIComponent(trade)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const body = (await response.json().catch(() => null)) as { ok?: boolean; floors?: unknown } | null;
    if (!body || body.ok !== true || !Array.isArray(body.floors)) return [];
    return body.floors as PayFloorRow[];
  } catch {
    return [];
  }
}

/** An amount typed or sent: a number of kroner, or null when nothing usable was given. */
export function parseKroner(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!text) return null;
  if (!/^\d+(\.\d+)?$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

/** "250" or "250,5", as a person writes an amount. */
export function formatKroner(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(".", ",");
}

export const PAY_MESSAGES = {
  confirm: "Bekreft likebehandling for å gå videre.",
  range: "Oppgi lønn fra og til i kr per time.",
  order: "Til kan ikke være lavere enn Fra.",
  invalid: "Skriv beløpet som et tall.",
  belowFloor: (floor: number) => `Under minstelønn (${formatKroner(floor)} kr per time).`,
} as const;

export type PayFieldErrors = { from?: string; to?: string };

/**
 * The inline refusal of each amount field. An empty field is never refused
 * here; whether it may stay empty is checkPayConditions' question.
 */
export function payFieldErrors(input: { from: string; to: string; floor: number | null }): PayFieldErrors {
  const out: PayFieldErrors = {};
  const from = parseKroner(input.from);
  const to = parseKroner(input.to);
  if (input.from.trim() && from === null) out.from = PAY_MESSAGES.invalid;
  else if (from !== null && input.floor !== null && from < input.floor) out.from = PAY_MESSAGES.belowFloor(input.floor);
  if (input.to.trim() && to === null) out.to = PAY_MESSAGES.invalid;
  else if (to !== null && input.floor !== null && to < input.floor) out.to = PAY_MESSAGES.belowFloor(input.floor);
  else if (to !== null && from !== null && to < from) out.to = PAY_MESSAGES.order;
  return out;
}

export type PayConditionsInput = {
  answerMode: AnswerMode | null | undefined;
  equalTreatmentConfirmed: boolean | null | undefined;
  payFrom: unknown;
  payTo: unknown;
  payFloorAtSubmit: unknown;
};

/**
 * The one check, in the browser before sending and in the save route before
 * storing. Null when the request may go; else the reason, in Norwegian.
 */
export function checkPayConditions(input: PayConditionsInput): string | null {
  if (input.equalTreatmentConfirmed !== true) return PAY_MESSAGES.confirm;
  const from = parseKroner(input.payFrom);
  const to = parseKroner(input.payTo);
  const floor = parseKroner(input.payFloorAtSubmit);
  const given = (v: unknown) => v !== null && v !== undefined && !(typeof v === "string" && v.trim() === "");
  if ((given(input.payFrom) && from === null) || (given(input.payTo) && to === null)) return PAY_MESSAGES.invalid;
  if (input.answerMode === "detaljer" && (from === null || to === null)) return PAY_MESSAGES.range;
  if (floor !== null && floor > 0) {
    if (from !== null && from < floor) return PAY_MESSAGES.belowFloor(floor);
    if (to !== null && to < floor) return PAY_MESSAGES.belowFloor(floor);
  }
  if (from !== null && to !== null && to < from) return PAY_MESSAGES.order;
  if (from === null && to !== null) return PAY_MESSAGES.range;
  return null;
}

/**
 * The trade key of the detailed wizard's category, for the floor. Best effort:
 * a category with no clear trade has no floor rather than a wrong one.
 */
export function tradeKeyForWizardIndustry(industry: string | null | undefined): TradeKey | null {
  switch (String(industry ?? "").trim()) {
    case "Construction":
      return "bygg";
    case "Electrical":
      return "elektro";
    case "Welding and Metal":
    case "Industry and Production":
      return "industri";
    case "Logistics":
      return "logistikk";
    case "Healthcare":
      return "helse";
    case "HoReCa":
      return "horeca";
    case "Cleaning":
      return "renhold";
    default:
      return null;
  }
}
