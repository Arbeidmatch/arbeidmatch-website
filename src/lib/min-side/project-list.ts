/**
 * ORDER 273: Prosjektvarsler as a table on Min side, and the project detail
 * that replaces it. The pure part: the date each row shows, the search, the
 * sort, the pages of 20, the neighbours for Forrige and Neste, and the address
 * (#varsler/<id>) that carries the open project, so Back returns to the list
 * and a reload opens the same project again.
 *
 * The screen keeps the list's state (search, stage, town, sort, page) above
 * the detail, so "Alle prosjekter" comes back to the same page with the last
 * opened row marked.
 */

import { projectStage, type MinSideProject, type MinSideStage } from "@/lib/min-side/profile";

export const LIST_PAGE = 20;

export type ListSort = { key: "date" | "value"; dir: "desc" | "asc" };
export const DEFAULT_SORT: ListSort = { key: "date", dir: "desc" };

export type ListState = {
  q: string;
  stage: MinSideStage | "all";
  town: string | null;
  sort: ListSort;
  page: number;
};
export const INITIAL_LIST: ListState = { q: "", stage: "all", town: null, sort: DEFAULT_SORT, page: 1 };

const MONTHS_NO = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

type Dated = Pick<MinSideProject, "stage" | "deadline_at" | "published_on"> & { start_on?: string | null };

/** The date a row is sorted by: the deadline of a tender, the award of an awarded one, the expected start of a planned one. */
export function dateKey(p: Dated): number | null {
  const pick = p.stage === "tender" ? p.deadline_at : p.stage === "planned" ? (p.start_on ?? p.published_on) : p.published_on;
  const ms = pick ? Date.parse(pick.length === 10 ? `${pick}T12:00:00Z` : pick) : NaN;
  return Number.isFinite(ms) ? ms : null;
}

const ddmm = (ms: number) => {
  const d = new Date(ms);
  const parts = new Intl.DateTimeFormat("nb-NO", { day: "2-digit", month: "2-digit", timeZone: "Europe/Oslo" }).formatToParts(d);
  const day = parts.find((x) => x.type === "day")?.value ?? "";
  const month = parts.find((x) => x.type === "month")?.value ?? "";
  return `${day.padStart(2, "0")}.${month.padStart(2, "0")}.`;
};

/** "Frist 14.11." for a tender, "Tildelt 02.10." for an awarded one, "Ventes mars" for a planned one; "" without a date. */
export function dateCell(p: Dated): string {
  const ms = dateKey(p);
  if (ms === null) return "";
  if (p.stage === "tender") return `Frist ${ddmm(ms)}`;
  if (p.stage === "awarded") return `Tildelt ${ddmm(ms)}`;
  const month = MONTHS_NO[Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Europe/Oslo" }).format(new Date(ms))) - 1];
  return `Ventes ${month}`;
}

/** Published after the last letter: the "Ny" tag. Without a last letter nothing is new. */
export function isNew(p: { first_seen_at?: string | null }, lastSentAt: string | null): boolean {
  if (!lastSentAt || !p.first_seen_at) return false;
  const a = Date.parse(p.first_seen_at);
  const b = Date.parse(lastSentAt);
  return Number.isFinite(a) && Number.isFinite(b) && a > b;
}

const norm = (s: string) => s.toLocaleLowerCase("nb").normalize("NFKD").replace(/[̀-ͯ]/g, "");

/** The one search field: the title, the byggherre and the entreprenør. */
export function matchesSearch(p: Pick<MinSideProject, "title" | "buyer_name" | "winners">, q: string): boolean {
  const words = norm(q).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = norm([p.title, p.buyer_name ?? "", ...p.winners].join(" "));
  return words.every((w) => hay.includes(w));
}

const valueOf = (p: Pick<MinSideProject, "awarded_value_nok" | "estimated_value_nok">) => p.awarded_value_nok ?? p.estimated_value_nok ?? null;

/** The list in its order; rows without the sorted value go last either way, and the id breaks ties so the order never jumps. */
export function sortRows<T extends MinSideProject>(rows: T[], sort: ListSort): T[] {
  const key = (p: T) => (sort.key === "date" ? dateKey(p) : valueOf(p));
  return [...rows].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    if (x === null && y === null) return a.id.localeCompare(b.id);
    if (x === null) return 1;
    if (y === null) return -1;
    if (x !== y) return sort.dir === "desc" ? y - x : x - y;
    return a.id.localeCompare(b.id);
  });
}

/** The filtered, sorted list the table and Forrige/Neste both read. */
export function listRows<T extends MinSideProject>(rows: T[], s: Pick<ListState, "q" | "stage" | "town" | "sort">, now: number): T[] {
  const town = s.town ? norm(s.town) : null;
  return sortRows(
    rows.filter((p) => (s.stage === "all" || projectStage(p, now) === s.stage) && (!town || norm(p.place ?? "") === town) && matchesSearch(p, s.q)),
    s.sort,
  );
}

export function pageCount(total: number, size = LIST_PAGE): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / size));
}

/** One page, the page number held inside the pages there are. */
export function pageOf<T>(rows: T[], page: number, size = LIST_PAGE): { rows: T[]; page: number; pages: number } {
  const pages = pageCount(rows.length, size);
  const p = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { rows: rows.slice((p - 1) * size, p * size), page: p, pages };
}

/** The page a row is on, so going back to the list (or Neste across a page end) shows it. */
export function pageForId(rows: { id: string }[], id: string, size = LIST_PAGE): number | null {
  const i = rows.findIndex((r) => r.id === id);
  return i < 0 ? null : Math.floor(i / size) + 1;
}

/** Forrige and Neste of one row in the list as filtered and sorted; null at the ends. */
export function neighbours(rows: { id: string }[], id: string): { index: number; total: number; prev: string | null; next: string | null } {
  const i = rows.findIndex((r) => r.id === id);
  if (i < 0) return { index: 0, total: rows.length, prev: null, next: null };
  return { index: i + 1, total: rows.length, prev: i > 0 ? rows[i - 1].id : null, next: i < rows.length - 1 ? rows[i + 1].id : null };
}

/** Changing a filter or the sort starts at page 1; changing only the page keeps the rest. */
export function withList(s: ListState, part: Partial<ListState>): ListState {
  const filterChanged = (["q", "stage", "town", "sort"] as const).some((k) => k in part && part[k] !== s[k]);
  return { ...s, ...part, page: part.page ?? (filterChanged ? 1 : s.page) };
}

// ---------------------------------------------------------------------------
// The address. #varsler is the list, #varsler/<id> one project,
// #varsler/innstillinger the settings and #varsler/innstillinger/<level> one
// level of them. Any other section is #<section>; #hjem is the phone's home.
// ---------------------------------------------------------------------------

const PROJECT_ID = /^[A-Za-z0-9-]{6,60}$/;
export const SETTINGS_LEVELS = ["fag", "faser", "fylker", "byer", "brev", "mottakere"] as const;
export type SettingsLevel = (typeof SETTINGS_LEVELS)[number];

export type VarslerRoute = { view: "list" } | { view: "project"; id: string } | { view: "settings"; level: SettingsLevel | null };

/** What the part after "#varsler" asks for; null when the hash is not about the alerts at all. */
export function varslerRoute(hash: string): VarslerRoute | null {
  const raw = hash.replace(/^#/, "");
  if (raw !== "varsler" && !raw.startsWith("varsler/")) return null;
  const rest = raw.slice("varsler".length).replace(/^\//, "");
  if (!rest) return { view: "list" };
  if (rest === "innstillinger") return { view: "settings", level: null };
  if (rest.startsWith("innstillinger/")) {
    const level = rest.slice("innstillinger/".length);
    return { view: "settings", level: (SETTINGS_LEVELS as readonly string[]).includes(level) ? (level as SettingsLevel) : null };
  }
  return PROJECT_ID.test(rest) ? { view: "project", id: rest } : { view: "list" };
}

export function varslerHash(r: VarslerRoute): string {
  if (r.view === "project") return `#varsler/${r.id}`;
  if (r.view === "settings") return r.level ? `#varsler/innstillinger/${r.level}` : "#varsler/innstillinger";
  return "#varsler";
}
