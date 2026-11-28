import type { MarketEventKind, MarketSiteCard, PassReason, ReportReason } from "./types";

/**
 * The parts of the market jobs (ORDER 514) that decide something without
 * touching the network or a cookie, so they can be tested on their own.
 */

/** The preview cookie RecOS hands a signed-in staff member, forwarded to the ATS as x-market-preview. */
export const PREVIEW_COOKIE = "am_market_preview";
export const PREVIEW_HEADER = "x-market-preview";
export const PREVIEW_MAX_AGE_SECONDS = 12 * 60 * 60;

/** The anonymous visitor id the events are counted by. Random, first party, never tied to a person. */
export const VISITOR_COOKIE = "am_vid";
export const VISITOR_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

const MARKET_ID = /^M-\d{1,12}$/;

export function isMarketId(value: unknown): value is string {
  return typeof value === "string" && MARKET_ID.test(value);
}

/** Where a market job opens on this site. */
export function marketJobPath(id: string): string {
  return `/jobs/m/${encodeURIComponent(id)}`;
}

/**
 * Where the preview route may send the browser on: the list or one market
 * job, nothing else. Anything else (another path, another host, a protocol
 * relative address) falls back to the list, so the route can never be used to
 * bounce a visitor somewhere we did not choose.
 */
export function safePreviewNext(next: unknown): string {
  if (typeof next !== "string") return "/jobs";
  if (next === "/jobs") return next;
  const match = /^\/jobs\/m\/(M-\d{1,12})$/.exec(next);
  return match ? `/jobs/m/${match[1]}` : "/jobs";
}

/** A preview token is passed through to the ATS untouched; only its shape is checked here. */
export function cleanPreviewToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return /^[A-Za-z0-9._~+/=-]{8,512}$/.test(token) ? token : null;
}

export const PASS_REASONS: Array<{ key: PassReason; label: string }> = [
  { key: "pay", label: "Pay too low" },
  { key: "place", label: "Too far away" },
  { key: "trade", label: "Not my trade" },
  { key: "language", label: "Language" },
  { key: "housing", label: "No housing" },
  { key: "other", label: "Other" },
];

export const REPORT_REASONS: Array<{ key: ReportReason; label: string }> = [
  { key: "fee", label: "Asks for money" },
  { key: "fraud", label: "Looks like fraud" },
  { key: "unavailable", label: "No longer available" },
  { key: "wrong_info", label: "Wrong information" },
  { key: "below_minimum", label: "Pay below the legal minimum" },
  { key: "discrimination", label: "Discrimination" },
  { key: "other", label: "Something else" },
];

const EVENT_KINDS: readonly MarketEventKind[] = ["view", "keep", "interested", "pass", "send", "recommend", "check_source", "report"];
const PASS_KEYS = new Set<string>(PASS_REASONS.map((r) => r.key));
const REPORT_KEYS = new Set<string>(REPORT_REASONS.map((r) => r.key));
export const NOTE_MAX = 500;

export type MarketEventInput = { kind: MarketEventKind; reason?: string; note?: string };

/**
 * What the browser may ask this site to count. The visitor id, the user agent
 * and the preview token are added on the server; the browser only names the
 * event, and a reason and note where the event takes one. Pass and report need
 * a reason, and "other" needs a note.
 */
export function validateEventBody(body: unknown): { ok: true; value: MarketEventInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "invalid_body" };
  const raw = body as Record<string, unknown>;
  const kind = raw.kind;
  if (typeof kind !== "string" || !(EVENT_KINDS as readonly string[]).includes(kind)) return { ok: false, error: "invalid_kind" };
  const note = typeof raw.note === "string" ? raw.note.trim().slice(0, NOTE_MAX) : "";
  if (kind === "pass" || kind === "report") {
    const reason = typeof raw.reason === "string" ? raw.reason : "";
    const allowed = kind === "pass" ? PASS_KEYS : REPORT_KEYS;
    if (!allowed.has(reason)) return { ok: false, error: "invalid_reason" };
    if (reason === "other" && !note) return { ok: false, error: "note_required" };
    return { ok: true, value: { kind, reason, ...(note ? { note } : {}) } };
  }
  return { ok: true, value: { kind: kind as MarketEventKind } };
}

/** What a market card shows, worked out once so the card itself only draws it. */
export type MarketCardView = {
  id: string;
  href: string;
  tradeEn: string;
  tradeNo: string;
  title: string;
  placeLine: string;
  idLine: string;
  applyBy: string | null;
  pay: string | null;
  perks: string[];
  badges: Array<{ label: string; tone: "green" | "gold" | "navy" }>;
  privateTest: boolean;
};

/**
 * One market card. The place line never names the firm or the board the
 * advert came from: "local employer" is the only employer it states.
 */
export function marketCardView(card: MarketSiteCard, listPrivateTest = false): MarketCardView {
  const where = [card.place, card.zone].map((v) => (v ?? "").trim()).filter(Boolean);
  const badges: MarketCardView["badges"] = [];
  if (card.englishWorks) badges.push({ label: "English works", tone: "green" });
  if (card.experienceInsteadOfCertificate) badges.push({ label: "Experience vs trade certificate", tone: "green" });
  if (card.newToday) badges.push({ label: "New today", tone: "gold" });
  if (Number.isFinite(card.positions) && card.positions > 0) {
    badges.push({ label: `${card.positions} ${card.positions === 1 ? "position" : "positions"}`, tone: "navy" });
  }
  return {
    id: card.id,
    href: marketJobPath(card.id),
    tradeEn: card.trade.en,
    tradeNo: card.trade.no,
    title: card.title,
    placeLine: [...where, "local employer"].join(", "),
    idLine: `Job ID ${card.id}`,
    applyBy: card.applyBy?.trim() || null,
    pay: card.pay?.trim() || card.payFloor?.label?.trim() || null,
    perks: card.perks.filter((p) => typeof p === "string" && p.trim()).slice(0, 3),
    badges,
    privateTest: listPrivateTest || card.privateTest,
  };
}

function time(value: string | null | undefined): number {
  const t = value ? Date.parse(value) : NaN;
  return Number.isFinite(t) ? t : 0;
}

export type ListEntry<T> = { kind: "own"; job: T } | { kind: "market"; card: MarketSiteCard };

/**
 * Our jobs and the market jobs in one list, newest first.
 *
 * Our own jobs keep the order the board gives them; the market jobs, newest
 * first, are woven in by date. With no market jobs the list is exactly ours,
 * untouched, which is what every visitor sees while the switch is off.
 */
export function mergeNewestFirst<T>(own: T[], market: MarketSiteCard[], ownDate: (job: T) => string | null): ListEntry<T>[] {
  const out: ListEntry<T>[] = [];
  const sorted = [...market].sort((a, b) => time(b.postedAt) - time(a.postedAt));
  let i = 0;
  let j = 0;
  while (i < own.length || j < sorted.length) {
    if (j >= sorted.length) out.push({ kind: "own", job: own[i++] });
    else if (i >= own.length) out.push({ kind: "market", card: sorted[j++] });
    else if (time(sorted[j].postedAt) > time(ownDate(own[i]))) out.push({ kind: "market", card: sorted[j++] });
    else out.push({ kind: "own", job: own[i++] });
  }
  return out;
}

function fold(value: string): string {
  return value.toLowerCase().replace(/ø/g, "o").replace(/æ/g, "ae").replace(/å/g, "a").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

/** The list's search and location filters, applied to market jobs by title, trade and place. */
export function filterMarketSearch(cards: MarketSiteCard[], search: string, location: string): MarketSiteCard[] {
  const words = fold(search).split(/\s+/).filter(Boolean);
  const town = fold(location);
  return cards.filter((card) => {
    const text = fold(`${card.title} ${card.trade.en} ${card.trade.no}`);
    const where = [card.place, card.zone].map((v) => fold(v ?? ""));
    return words.every((w) => text.includes(w)) && (!town || where.includes(town));
  });
}

const FIT_ID = /^(r[1-9]|lang)$/;

/** The answers of Check if I fit: only known question ids, only true or false; anything else is dropped. */
export function cleanFitAnswers(body: unknown): Record<string, boolean> {
  const raw = body && typeof body === "object" ? (body as { answers?: unknown }).answers : null;
  const out: Record<string, boolean> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (FIT_ID.test(k) && typeof v === "boolean") out[k] = v;
  }
  return out;
}
