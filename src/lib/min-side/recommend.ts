/**
 * "ANBEFAL PROSJEKTVARSLER" (ORDER 274, 12 November 2026). His words: a client
 * may recommend the service to other firms, "facem 5 firme care pot adauga pana
 * la 3 sloturi de fiecare", and each recommended firm gets one mail from us
 * naming the person and firm who recommended it, sent only after his Send.
 *
 * The ATS decides everything (the five firms, company addresses only, who is
 * already a client or already recommended, whether the popup is due this
 * visit). This file reads what it answers, strictly, and builds the bodies the
 * website passes on, with only their named fields and bounded.
 */

import { isFreeMail } from "@/lib/foreignCompany";
import { visitPopupFree } from "@/lib/min-side/app-prompt";

export const RECOMMEND_LIMIT = 5;
export const RECOMMEND_NOTE_MAX = 200;
const EMAIL_MAX = 254;

/** The texts of the popup, exactly as the mockup has them. */
export const RECOMMEND_NO = {
  tag: "Under utvikling · gratis å prøve",
  title: "Kjenner dere firmaer som også burde se disse prosjektene?",
  text: "Anbefal Prosjektvarsler til opptil 5 firmaer. De får prøve gratis mens tjenesten er under utvikling. Hvert firma kan ha opptil 3 brukere. Vi sender anbefalingen i deres navn.",
  addMore: "+ Legg til en til",
  later: "Senere",
  send: "Send anbefalingene",
  thanks: "Takk. Vi sender anbefalingen innen én arbeidsdag.",
  row: "Anbefal til andre",
  companyOnly: "Bruk e-postadressen i firmaet deres, ikke en privat adresse.",
  invalid: "Skriv en gyldig e-postadresse.",
  none: "Skriv minst én e-postadresse.",
  noteTooLong: `Hilsenen kan være opptil ${RECOMMEND_NOTE_MAX} tegn.`,
} as const;

export function counterWords(used: number, limit: number = RECOMMEND_LIMIT): string {
  return `${Math.min(used, limit)} av ${limit} firmaer anbefalt`;
}

export type RecommendRow = { id: string; email: string | null; company_name: string | null; status: string; status_no: string; created_at: string };
export type RecommendState = { limit: number; used: number; due: boolean; rows: RecommendRow[] };

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const text = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

/** The page's recommend block; null from an older ATS or anything unreadable, and the row is then left out. */
export function recommendFrom(raw: unknown): RecommendState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const limit = typeof r.limit === "number" && Number.isInteger(r.limit) && r.limit > 0 && r.limit <= 20 ? r.limit : null;
  const used = typeof r.used === "number" && Number.isInteger(r.used) && r.used >= 0 ? r.used : null;
  if (limit === null || used === null) return null;
  const rows = (Array.isArray(r.rows) ? r.rows : [])
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object" && ID.test(String((x as Record<string, unknown>).id ?? "")))
    .map((x) => ({
      id: String(x.id),
      email: text(x.email, EMAIL_MAX),
      company_name: text(x.company_name, 160),
      status: text(x.status, 40) ?? "",
      status_no: text(x.status_no, 60) ?? "",
      created_at: typeof x.created_at === "string" ? x.created_at.slice(0, 40) : "",
    }))
    .slice(0, 20);
  return { limit, used: Math.min(used, limit), due: r.due === true, rows };
}

/** One address as the popup checks it before asking the ATS. */
export function addressProblem(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.length > EMAIL_MAX || !/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(v)) return RECOMMEND_NO.invalid;
  if (isFreeMail(v)) return RECOMMEND_NO.companyOnly;
  return null;
}

/** The filled addresses, trimmed, lowercased and without repeats, in the order typed. */
export function filledAddresses(fields: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of fields) {
    const v = f.trim().toLowerCase();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/** How many address fields the popup may show: the firms still free, at least one, at most five. */
export function fieldsAllowed(used: number, limit: number = RECOMMEND_LIMIT): number {
  return Math.max(0, Math.min(RECOMMEND_LIMIT, limit - used));
}

/** What the ATS answers for one checked address. */
export type CheckedAddress = { email: string; company_name: string | null; mark_no: string | null };

export function checkedFrom(raw: unknown): { rows: CheckedAddress[]; used: number | null } {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const rows = (Array.isArray(r.rows) ? r.rows : [])
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object" && typeof (x as Record<string, unknown>).email === "string")
    .map((x) => ({ email: String(x.email).slice(0, EMAIL_MAX).toLowerCase(), company_name: text(x.company_name, 160), mark_no: text(x.mark_no, 60) }))
    .slice(0, RECOMMEND_LIMIT);
  const used = typeof r.used === "number" && Number.isInteger(r.used) && r.used >= 0 ? r.used : null;
  return { rows, used };
}

/**
 * The body passed on to the ATS for a recommend action, or null for anything
 * else: the action word, at most five plain addresses, and a greeting of at
 * most 200 characters for the send.
 */
export function recommendRequest(raw: Record<string, unknown>): Record<string, unknown> | null {
  const action = raw.action;
  if (action === "recommend_prompt_seen" || action === "recommend_prompt_later") return { action };
  if (action !== "recommend_check" && action !== "recommend_send") return null;
  if (!Array.isArray(raw.emails) || raw.emails.length === 0 || raw.emails.length > RECOMMEND_LIMIT) return null;
  if (!raw.emails.every((e) => typeof e === "string" && e.length > 0 && e.length <= EMAIL_MAX)) return null;
  const emails = raw.emails as string[];
  if (action === "recommend_check") return { action, emails };
  if (raw.note !== undefined && raw.note !== null && typeof raw.note !== "string") return null;
  const note = typeof raw.note === "string" ? raw.note : "";
  if (note.length > RECOMMEND_NOTE_MAX) return null;
  return { action, emails, note };
}

export function isRecommendAction(action: unknown): boolean {
  return action === "recommend_check" || action === "recommend_send" || action === "recommend_prompt_seen" || action === "recommend_prompt_later";
}

/** The popup opens by itself only when the ATS says it is due, the key is not read-only, and no other window had this visit. */
export function decideRecommendPopup(f: { state: RecommendState | null; readOnly: boolean; keyDialogThisVisit: boolean; shownThisVisit: string | null }): boolean {
  if (!f.state || !f.state.due || f.readOnly || f.keyDialogThisVisit) return false;
  if (f.state.used >= f.state.limit) return false;
  return visitPopupFree(f.shownThisVisit);
}

// ---------------------------------------------------------------------------
// The link in the mail: /prosjektvarsler/anbefalt/<token> and its /stopp.
// ---------------------------------------------------------------------------

export function isRecommendationToken(value: unknown): value is string {
  return typeof value === "string" && ID.test(value);
}

export const LANDING_NO = {
  invalid: "Lenken er ikke gyldig lenger.",
  pending: "Vi aktiverer prøveperioden når den er godkjent, vanligvis innen én arbeidsdag.",
  stopTitle: "Ikke send meg anbefalinger",
  stopped: "Vi sender ikke flere anbefalinger til denne adressen.",
} as const;

/** Who recommended, as the ATS answers it; null for anything else. */
export function landingFrom(raw: unknown): { name: string | null; firm: string; optedOut: boolean } | null {
  const r = (raw && typeof raw === "object" ? raw : null) as Record<string, unknown> | null;
  const by = (r?.recommended_by && typeof r.recommended_by === "object" ? r.recommended_by : null) as Record<string, unknown> | null;
  if (!r || !by) return null;
  return { name: text(by.name, 120), firm: text(by.firm, 160) ?? "", optedOut: r.opted_out === true };
}

/** "Kari Nord fra Nord Bygg AS", the firm alone without a name, the name alone without a firm. */
export function recommenderWords(by: { name: string | null; firm: string }): string {
  if (by.name && by.firm) return `${by.name} fra ${by.firm}`;
  return by.name ?? by.firm ?? "";
}

/** The trial request passed on: the five named fields as short plain text; null for anything else. */
export function trialRequestBody(raw: Record<string, unknown>): Record<string, string> | null {
  if (raw.action === "optout") return { action: "optout" };
  if (raw.action !== "trial_request") return null;
  const field = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  return {
    action: "trial_request",
    name: field(raw.name, 120),
    email: field(raw.email, EMAIL_MAX),
    phone: field(raw.phone, 40),
    org_number: field(raw.org_number, 20),
    company_name: field(raw.company_name, 160),
  };
}
