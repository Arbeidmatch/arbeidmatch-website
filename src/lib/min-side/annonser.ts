/**
 * ORDER 276 (JobbOS phase 1): the section Annonser of Min side. A firm's own
 * job adverts live on JobbOS, a separate system; Min side only shows the
 * summary JobbOS gives for the firm (GET /api/v1/min-side?org=, version 1):
 * per advert its title, status, the line under it, its anonymous counts and
 * its public page while the board shows it. Writing, paying and extending
 * happen on JobbOS's own Annonser page after the firm's own sign-in.
 *
 * This file reads that answer defensively, on the server (with the JobbOS
 * origin, so every link must point there) and again on the page. Anything
 * that does not have the expected shape is dropped, never guessed.
 */

export const ANNONSER_VERSION = 1;
/** At most this many adverts are kept, as JobbOS itself lists at most 50. */
export const ANNONSER_MAX = 50;

export type AnnonseGroup = "live" | "pending" | "ended";

export type Annonse = {
  id: string;
  title: string;
  statusNo: string;
  group: AnnonseGroup;
  whenNo: string;
  views: number;
  applyClicks: number;
  /** The advert's page on the board, only while the public board shows it. */
  publicUrl: string | null;
};

export type Annonser =
  | {
      state: "ok";
      lineNo: string;
      liveCount: number;
      expiring: { advertId: string; title: string; days: number } | null;
      adverts: Annonse[];
      manageUrl: string;
      newAdvertUrl: string;
    }
  /** The firm is on the list, but JobbOS could not be asked just now. */
  | { state: "unavailable" };

const GROUPS: ReadonlySet<string> = new Set(["live", "pending", "ended"]);
const ID = /^[0-9a-zA-Z-]{1,64}$/;

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Raw) : null);
const text = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const count = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < 1e9 ? v : 0);

/** An https link, and when an origin is given, only one on that origin. */
export function safeLink(v: unknown, origin?: string): string | null {
  if (typeof v !== "string" || v.length > 300) return null;
  let url: URL;
  try {
    url = new URL(v);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (origin !== undefined && url.origin !== origin) return null;
  return url.toString();
}

/**
 * The section from a JobbOS answer (server, with `origin`) or from the page's
 * own copy (page, without). Null when there is nothing to show: no firm on
 * JobbOS, a firm that did not choose adverts, or an answer of another shape.
 */
export function annonserFrom(value: unknown, origin?: string): Annonser | null {
  const r = obj(value);
  if (!r) return null;
  if (r.state === "unavailable") return { state: "unavailable" };
  // JobbOS's own answer says ok/version/firm; the page's copy says state "ok".
  const fromJobbos = r.ok === true && r.version === ANNONSER_VERSION;
  if (!fromJobbos && r.state !== "ok") return null;
  if (fromJobbos && !obj(r.firm)) return null;
  const summary = fromJobbos ? obj(r.summary) : r;
  if (!summary) return null;
  const manageUrl = safeLink(r.manageUrl, origin);
  const newAdvertUrl = safeLink(r.newAdvertUrl, origin);
  if (!manageUrl || !newAdvertUrl || !Array.isArray(r.adverts)) return null;

  const adverts: Annonse[] = [];
  for (const item of r.adverts.slice(0, ANNONSER_MAX)) {
    const a = obj(item);
    if (!a || typeof a.id !== "string" || !ID.test(a.id) || typeof a.group !== "string" || !GROUPS.has(a.group)) continue;
    const title = text(a.title, 120);
    const statusNo = text(a.statusNo, 40);
    if (!title || !statusNo) continue;
    adverts.push({
      id: a.id,
      title,
      statusNo,
      group: a.group as AnnonseGroup,
      whenNo: text(a.whenNo, 160),
      views: count(a.views),
      applyClicks: count(a.applyClicks),
      // A public page only for an advert the board shows now.
      publicUrl: a.group === "live" ? safeLink(a.publicUrl, origin) : null,
    });
  }

  // The card of the advert ending soonest: only a live advert of the list, its title as the list has it.
  const e = obj(r.expiring);
  const soon = e && typeof e.advertId === "string" && count(e.days) <= 7 ? adverts.find((a) => a.id === e.advertId && a.group === "live") : undefined;
  const expiring = soon && e ? { advertId: soon.id, title: soon.title, days: count(e.days) } : null;

  return {
    state: "ok",
    lineNo: text(summary.lineNo, 200),
    liveCount: adverts.filter((a) => a.group === "live").length,
    expiring,
    adverts,
    manageUrl,
    newAdvertUrl,
  };
}

/** The words under "Annonser" in the list. */
export function annonserHint(a: Annonser): string {
  if (a.state === "unavailable") return "Ikke tilgjengelig nå";
  if (a.liveCount > 0) return `${a.liveCount} live`;
  const pending = a.adverts.filter((x) => x.group === "pending").length;
  if (pending > 0) return pending === 1 ? "1 til kontroll" : `${pending} til kontroll`;
  return a.adverts.length ? "Ingen live nå" : "Ingen annonser ennå";
}

/** The three tabs of the section, as the board has them: Live, Kontroll, Utløpt. */
export const ANNONSE_TABS: { key: AnnonseGroup; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "pending", label: "Kontroll" },
  { key: "ended", label: "Utløpt" },
];

/** "Utløper om 1 dag" / "om 6 dager", for the card of the advert ending soonest. */
export function expiringWordsNo(days: number): string {
  if (days <= 0) return "Utløper i dag";
  return days === 1 ? "Utløper om 1 dag" : `Utløper om ${days} dager`;
}
