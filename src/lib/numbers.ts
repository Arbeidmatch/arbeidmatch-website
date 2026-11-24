/**
 * The numbers this site prints, read from the RecOS numbers registry (ORDER 302).
 *
 * HIS WORDS, 17 November 2026: "asa cum era pe wordpress, schimbam intr o parte
 * se modifica peste tot imediat automat fara build". A price, date, deadline or
 * reply promise is set once on Settings, Numbers in RecOS and every page here
 * shows it within a minute, with no build of this site.
 *
 * One request for every key, cached 60 seconds under the tag "numbers". RecOS
 * calls /api/revalidate with that tag when a number is saved, so the next view
 * is the new value at once; the 60 seconds cover a call that never arrives.
 *
 * NO TYPED FALLBACK (step 5). If RecOS cannot be reached, the last answer this
 * server read is used. With no answer at all, a helper returns null and the
 * caller shows its sentence without the number where it still reads correctly,
 * or leaves the block out. A number typed here as a fallback would be exactly
 * the second copy this order removes.
 *
 * The phrase helpers are pure and run on the server and in the browser; client
 * components get the values from NumbersProvider (components/NumbersProvider).
 */

export const NUMBERS_TAG = "numbers";
export const NUMBERS_CACHE_SECONDS = 60;

export const SITE_NUMBER_KEYS = [
  "reply_promise_contact",
  "reply_hours_helper",
  "reply_days_employer_request_min",
  "reply_days_employer_request_max",
  "reply_hours_partner",
  "reply_days_invite",
  "first_profiles_weeks",
  "wage_electrician_min",
  "wage_electrician_certified_min",
  "wage_electrician_max",
  "wage_welder_min",
  "wage_welder_max",
  "early_bird_profiles_nok",
  "early_bird_hire_nok",
  "recommend_limit_firms",
  "premium_trial_hours",
  "vat_pct_shown",
  "company_org_number",
  "company_street_address",
  "company_opening_hours",
  "ad_max_days",
  "ad_extend_days",
  "payment_term_days_default",
  "project_alerts_trial_until",
  "hiring_plans_from",
  "alerts_trial_max_users",
] as const;

export type SiteNumberKey = (typeof SITE_NUMBER_KEYS)[number];
export type SiteNumbers = Partial<Record<SiteNumberKey, number | string>>;
export type Lang = "no" | "en";

function atsBase(): string {
  return (
    process.env.ATS_PUBLIC_BASE_URL?.trim() ||
    process.env.ATS_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ATS_URL?.trim() ||
    "https://ats.arbeidmatch.no"
  ).replace(/\/$/, "");
}

/** The last good answer this server instance read: what is shown when RecOS is down. */
let lastGood: SiteNumbers | null = null;

/** Test hook: forget the last good answer. */
export function forgetNumbersForTests(): void {
  lastGood = null;
}

function cleanAnswer(raw: unknown): SiteNumbers {
  const out: SiteNumbers = {};
  const numbers = raw && typeof raw === "object" ? (raw as { numbers?: unknown }).numbers : null;
  if (!numbers || typeof numbers !== "object") return out;
  for (const key of SITE_NUMBER_KEYS) {
    const v = (numbers as Record<string, unknown>)[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "string" && v.trim()) out[key] = v.trim();
  }
  return out;
}

/**
 * Every site number, in one request. Never throws: a failed read gives the last
 * good answer, or an empty one when there has never been one.
 */
export async function getSiteNumbers(): Promise<SiteNumbers> {
  try {
    const res = await fetch(`${atsBase()}/api/public/numbers?keys=${SITE_NUMBER_KEYS.join(",")}`, {
      next: { revalidate: NUMBERS_CACHE_SECONDS, tags: [NUMBERS_TAG] },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`numbers ${res.status}`);
    const answer = cleanAnswer(await res.json());
    if (Object.keys(answer).length) lastGood = answer;
    return lastGood ?? answer;
  } catch (err) {
    console.error("[numbers]", err instanceof Error ? err.message : err);
    return lastGood ?? {};
  }
}

export function num(n: SiteNumbers, key: SiteNumberKey): number | null {
  const v = n[key];
  return typeof v === "number" ? v : null;
}

export function text(n: SiteNumbers, key: SiteNumberKey): string | null {
  const v = n[key];
  return typeof v === "string" && v ? v : null;
}

const WORDS_EN = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const WORDS_NO = ["null", "én", "to", "tre", "fire", "fem", "seks", "sju", "åtte", "ni", "ti"];

/** "one working day" / "én virkedag", "2 working days" / "2 virkedager". */
export function workingDays(days: number | null, lang: Lang): string | null {
  if (days == null) return null;
  if (lang === "no") return days === 1 ? "én virkedag" : `${days} virkedager`;
  return days === 1 ? "one working day" : `${days} working days`;
}

/** "two weeks" / "to uker": the word up to ten, the digits above. */
export function weeksInWords(weeks: number | null, lang: Lang): string | null {
  if (weeks == null) return null;
  const words = lang === "no" ? WORDS_NO : WORDS_EN;
  const w = Number.isInteger(weeks) && weeks >= 0 && weeks <= 10 ? words[weeks] : String(weeks);
  if (lang === "no") return weeks === 1 ? `${w} uke` : `${w} uker`;
  return weeks === 1 ? `${w} week` : `${w} weeks`;
}

/** "1-2" (or "1 to 2" with a word joiner); one number when both ends are equal; null when either is missing. */
export function numberSpan(min: number | null, max: number | null, joiner = "-"): string | null {
  if (min == null || max == null) return null;
  return min === max ? `${min}` : `${min}${joiner}${max}`;
}

/** 1000 -> "1.000" (the site's Norwegian thousands mark), 100 -> "100". */
export function nok(n: number | null): string | null {
  if (n == null) return null;
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

const MONTHS_NO = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

function dateParts(iso: string | null): { y: number; m: number; d: number } | null {
  const hit = iso ? /^(\d{4})-(\d{2})-(\d{2})/.exec(iso) : null;
  return hit ? { y: Number(hit[1]), m: Number(hit[2]), d: Number(hit[3]) } : null;
}

/** "2026-12-31" -> "desember": the month a trial runs out ("Prøv gratis ut desember"). */
export function monthNo(iso: string | null): string | null {
  const p = dateParts(iso);
  return p ? MONTHS_NO[p.m - 1] : null;
}

/** "2027-01-01" -> "1. januar". */
export function dayMonthNo(iso: string | null): string | null {
  const p = dateParts(iso);
  return p ? `${p.d}. ${MONTHS_NO[p.m - 1]}` : null;
}

/** "935 667 089" -> "935667089", for search-engine data. */
export function orgDigits(org: string | null): string | null {
  const d = org ? org.replace(/\D/g, "") : "";
  return d.length === 9 ? d : null;
}

const DAY_NAMES: Record<string, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" };
const DAY_ORDER = Object.keys(DAY_NAMES);

/** "Mo-Fr 08:00-16:00" -> the schema.org opening hours; null when it does not read. */
export function openingHoursSpec(raw: string | null): { "@type": "OpeningHoursSpecification"; dayOfWeek: string[]; opens: string; closes: string } | null {
  const hit = raw ? /^(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(raw.trim()) : null;
  if (!hit) return null;
  const from = DAY_ORDER.indexOf(hit[1]);
  const to = hit[2] ? DAY_ORDER.indexOf(hit[2]) : from;
  if (to < from) return null;
  return { "@type": "OpeningHoursSpecification", dayOfWeek: DAY_ORDER.slice(from, to + 1).map((d) => DAY_NAMES[d]), opens: hit[3], closes: hit[4] };
}

/** "Vi svarer innen én virkedag." / "We reply within one working day."; null with no value. */
export function replySentence(n: SiteNumbers, lang: Lang): string | null {
  const days = workingDays(num(n, "reply_promise_contact"), lang);
  if (!days) return null;
  return lang === "no" ? `Vi svarer innen ${days}.` : `We reply within ${days}.`;
}

/** "én arbeidsdag" / "2 arbeidsdager": Min side's word for the same promise as workingDays. */
export function arbeidsdager(days: number | null): string | null {
  if (days == null) return null;
  return days === 1 ? "én arbeidsdag" : `${days} arbeidsdager`;
}
