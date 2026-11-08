/**
 * THE PROPOSALS LETTER'S ANSWER PAGE (ORDER 210 part b): /min-side/forslag?t=<key>[&svar=much|some|not_yet].
 *
 * Every button in the letter opens this page with a signed key from the ATS
 * (one letter and one target, nothing about the person). Opening reads and
 * writes nothing (mail scanners open links); only the press on Bekreft, the
 * opinion or Send writes, through the ATS's api/public/forsprang-proposal.
 *
 * Pure: what the page and the route accept, nothing that reads a network.
 */

export type ProposalTarget = "neighbour_county" | "who_won" | "same_day" | "more_addresses" | "planning_phase" | "people_for_project" | "opinion" | "idea";
export type OpinionKey = "much" | "some" | "not_yet";

/** What the ATS answers for a key, before any press (ProposalPage in the ATS). */
export type ProposalPage = {
  company: string;
  target: ProposalTarget;
  title: string;
  line: string | null;
  button: string;
  options: { key: string; label: string }[] | null;
  same_day: { threshold_mnok: number; sms: boolean } | null;
  /** One more address (ORDER 210 part d): the label of the one e-mail field. */
  address_field: { label: string } | null;
  answered: null | { answer: string; message: string };
};

export const OPINION_KEYS: readonly OpinionKey[] = ["much", "some", "not_yet"];
/** The thresholds offered for the same-day alert, in MNOK; the ATS takes 0.5 to 500. */
export const SAME_DAY_THRESHOLDS: readonly number[] = [1, 2, 5, 10, 20];
export const IDEA_MAX = 2000;
export const MORE_MAX = 2000;
export const EMAIL_MAX = 254;

/** One address, the way the ATS takes it (cleanExtraAddress there): lower case, or null. */
export function extraAddressOf(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const email = v.trim().toLowerCase();
  if (email.length > EMAIL_MAX || !/^[^\s@,;<>"*]+@[^\s@,;<>"*]+\.[a-z]{2,}$/.test(email)) return null;
  return email;
}

/** The key as the ATS signs it: base64url payload, a dot, base64url signature. Nothing that could change a path. */
const KEY = /^[A-Za-z0-9_-]{16,600}\.[A-Za-z0-9_-]{16,100}$/;

export function isProposalKey(value: unknown): value is string {
  return typeof value === "string" && KEY.test(value);
}

export function isOpinionKey(value: unknown): value is OpinionKey {
  return typeof value === "string" && (OPINION_KEYS as readonly string[]).includes(value);
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/**
 * The one body passed on to the ATS for a press, with only its named fields,
 * bounded; null for anything else. Exactly one kind of press per body:
 * the opinion's follow-up text (`more`), the idea (`text`), the opinion's
 * choice (`answer`), the same-day threshold, one more address (`email`), or
 * a plain Bekreft.
 */
export function proposalRequest(raw: unknown): { t: string; more?: string; text?: string; answer?: OpinionKey; threshold_mnok?: number; email?: string } | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!isProposalKey(r.t)) return null;
  if (r.more !== undefined) {
    const more = text(r.more, MORE_MAX);
    return more ? { t: r.t, more } : null;
  }
  if (r.text !== undefined) {
    const idea = text(r.text, IDEA_MAX);
    return idea.length >= 3 ? { t: r.t, text: idea } : null;
  }
  if (r.answer !== undefined) return isOpinionKey(r.answer) ? { t: r.t, answer: r.answer } : null;
  if (r.threshold_mnok !== undefined) {
    const n = Number(r.threshold_mnok);
    return Number.isFinite(n) && n >= 0.5 && n <= 500 ? { t: r.t, threshold_mnok: n } : null;
  }
  if (r.email !== undefined) {
    const email = extraAddressOf(r.email);
    return email ? { t: r.t, email } : null;
  }
  return { t: r.t };
}

/** The page's state from the ATS's answer, or null for anything not shaped like one. */
export function proposalPageOf(body: unknown): ProposalPage | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.target !== "string" || typeof b.title !== "string" || typeof b.button !== "string") return null;
  const answered = b.answered && typeof b.answered === "object" ? (b.answered as Record<string, unknown>) : null;
  const sameDay = b.same_day && typeof b.same_day === "object" ? (b.same_day as Record<string, unknown>) : null;
  const addressField = b.address_field && typeof b.address_field === "object" ? (b.address_field as Record<string, unknown>) : null;
  return {
    company: typeof b.company === "string" ? b.company : "",
    target: b.target as ProposalTarget,
    title: b.title,
    line: typeof b.line === "string" && b.line ? b.line : null,
    button: b.button,
    options: Array.isArray(b.options)
      ? (b.options as unknown[]).filter((o): o is { key: string; label: string } => !!o && typeof (o as { key?: unknown }).key === "string" && typeof (o as { label?: unknown }).label === "string")
      : null,
    same_day: sameDay ? { threshold_mnok: Number(sameDay.threshold_mnok) || 2, sms: sameDay.sms === true } : null,
    address_field: addressField && typeof addressField.label === "string" ? { label: addressField.label } : null,
    answered: answered && typeof answered.message === "string" ? { answer: String(answered.answer ?? ""), message: answered.message } : null,
  };
}

/** The opinion pressed in the letter, pre-selected on the page; anything else selects nothing. */
export function preselectedOpinion(svar: unknown): OpinionKey | null {
  return isOpinionKey(svar) ? svar : null;
}

/** The closest offered threshold to the one the ATS suggests, so one chip is always chosen. */
export function nearestThreshold(mnok: number): number {
  return SAME_DAY_THRESHOLDS.reduce((best, t) => (Math.abs(t - mnok) < Math.abs(best - mnok) ? t : best), SAME_DAY_THRESHOLDS[0]);
}
