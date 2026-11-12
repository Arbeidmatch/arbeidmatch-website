/**
 * ORDER 273: what the client receives, set inside Min side (his words of 12
 * November 2026: "unde seteaza clientul setarile la ce sa primeasca?", "mai
 * dinamice ca in meniul unui mobil ios"). The ATS holds every rule: what the
 * plan allows (an option outside it comes back locked), one fag changed at
 * most once in 30 days, the towns' own 30 days, and the company e-mail rule
 * for the recipients. This file only reads its answer defensively and builds
 * the one-field bodies the page saves on every change.
 */

export type Frequency = "daily" | "weekly" | "monthly";
export type Stage = "planned" | "tender" | "awarded";

export type Choice = { value: string; label: string; locked: boolean };
export type FagChoice = Choice & { group: "finishing" | "other" };

export type AlertSettings = {
  fag: string | null;
  several: boolean;
  fag_label: string;
  next_fag_change: string | null;
  stages: string[];
  include_general: boolean;
  regions: string[];
  cities: string[];
  next_city_change: string | null;
  include_unplaced: boolean;
  frequency: Frequency | null;
  send_weekday: number | null;
  send_hour: number | null;
  recipients: string[];
  allowed: {
    fag: FagChoice[];
    stages: Choice[];
    regions: Choice[];
    city_options: { name: string; count: number }[];
    frequencies: Choice[];
    weekdays: number[];
    hours: number[];
    max_recipients: number;
  };
  summary: { matching: number; next_letter_at: string | null };
};

const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);
const text = (v: unknown, max = 120) => (typeof v === "string" ? v.slice(0, max) : "");
const iso = (v: unknown) => (typeof v === "string" && Number.isFinite(Date.parse(v)) ? v.slice(0, 40) : null);
const KEY = /^[A-Za-z0-9_-]{1,40}$/;
const keys = (v: unknown, max = 40) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && KEY.test(x)).slice(0, max) : []);
const town = (v: unknown): v is string => typeof v === "string" && v.trim().length >= 1 && v.length <= 60 && /^\p{L}[\p{L} .'-]*$/u.test(v.trim());
const intIn = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null);
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;

function choices(v: unknown): Choice[] {
  return (Array.isArray(v) ? v : [])
    .map(obj)
    .filter((c): c is Record<string, unknown> => c !== null && typeof c.value === "string" && KEY.test(c.value))
    .map((c) => ({ value: String(c.value), label: text(c.label) || String(c.value), locked: c.locked === true }))
    .slice(0, 60);
}

function ints(v: unknown, min: number, max: number): number[] {
  return Array.isArray(v) ? [...new Set(v.map((x) => intIn(x, min, max)).filter((x): x is number => x !== null))].sort((a, b) => a - b) : [];
}

/** The ATS's settings, or null when there is no active subscription or the answer is not settings at all. */
export function alertSettingsFrom(raw: unknown): AlertSettings | null {
  const r = obj(raw);
  const allowed = obj(r?.allowed);
  if (!r || !allowed) return null;
  const summary = obj(r.summary);
  const freq = r.frequency === "daily" || r.frequency === "weekly" || r.frequency === "monthly" ? r.frequency : null;
  return {
    fag: typeof r.fag === "string" && KEY.test(r.fag) ? r.fag : null,
    several: r.several === true,
    fag_label: text(r.fag_label, 200),
    next_fag_change: iso(r.next_fag_change),
    stages: keys(r.stages, 3),
    include_general: r.include_general === true,
    regions: keys(r.regions),
    cities: Array.isArray(r.cities) ? [...new Set(r.cities.filter(town).map((c) => c.trim()))].slice(0, 50) : [],
    next_city_change: iso(r.next_city_change),
    include_unplaced: r.include_unplaced === true,
    frequency: freq,
    send_weekday: intIn(r.send_weekday, 1, 7),
    send_hour: intIn(r.send_hour, 0, 23),
    recipients: Array.isArray(r.recipients) ? r.recipients.filter((e): e is string => typeof e === "string" && EMAIL.test(e)).map((e) => e.slice(0, 254)).slice(0, 20) : [],
    allowed: {
      fag: (Array.isArray(allowed.fag) ? allowed.fag : [])
        .map(obj)
        .filter((c): c is Record<string, unknown> => c !== null && typeof c.value === "string" && KEY.test(c.value))
        .map((c) => ({ value: String(c.value), label: text(c.label) || String(c.value), locked: c.locked === true, group: c.group === "finishing" ? ("finishing" as const) : ("other" as const) }))
        .slice(0, 30),
      stages: choices(allowed.stages),
      regions: choices(allowed.regions),
      city_options: (Array.isArray(allowed.city_options) ? allowed.city_options : [])
        .map(obj)
        .filter((o): o is Record<string, unknown> => o !== null && town(o.name))
        .map((o) => ({ name: String(o.name).trim(), count: intIn(o.count, 0, 1_000_000) ?? 0 }))
        .slice(0, 80),
      frequencies: choices(allowed.frequencies),
      weekdays: ints(allowed.weekdays, 1, 7),
      hours: ints(allowed.hours, 0, 23),
      max_recipients: intIn(allowed.max_recipients, 0, 50) ?? 1,
    },
    summary: { matching: intIn(summary?.matching, 0, 1_000_000) ?? 0, next_letter_at: iso(summary?.next_letter_at) },
  };
}

/** The fields one save may carry; the proxy passes nothing else on. */
export const SETTINGS_FIELDS = ["fag", "stages", "include_general", "regions", "cities", "include_unplaced", "frequency", "send_weekday", "send_hour", "recipients"] as const;
export type SettingsField = (typeof SETTINGS_FIELDS)[number];

/**
 * The body of one save, checked on the way out to the ATS: only the named
 * fields, each in its own shape. Null when nothing valid is left, so the
 * proxy answers 400 without calling the ATS.
 */
export function alertSettingsRequest(raw: Record<string, unknown>): Record<string, unknown> | null {
  const out: Record<string, unknown> = { action: "alert_settings" };
  if ("fag" in raw && typeof raw.fag === "string" && KEY.test(raw.fag)) out.fag = raw.fag;
  if ("stages" in raw && Array.isArray(raw.stages)) out.stages = keys(raw.stages, 3).filter((s) => s === "planned" || s === "tender" || s === "awarded");
  if (typeof raw.include_general === "boolean") out.include_general = raw.include_general;
  if (typeof raw.include_unplaced === "boolean") out.include_unplaced = raw.include_unplaced;
  if ("regions" in raw && Array.isArray(raw.regions)) out.regions = keys(raw.regions, 30).filter((r) => /^NO[0-9A-Z]{3}$/.test(r));
  if ("cities" in raw && Array.isArray(raw.cities)) out.cities = [...new Set(raw.cities.filter(town).map((c) => c.trim()))].slice(0, 50);
  if (raw.frequency === "daily" || raw.frequency === "weekly" || raw.frequency === "monthly") out.frequency = raw.frequency;
  if ("send_weekday" in raw && intIn(raw.send_weekday, 1, 7) !== null) out.send_weekday = raw.send_weekday;
  if ("send_hour" in raw && intIn(raw.send_hour, 0, 23) !== null) out.send_hour = raw.send_hour;
  if ("recipients" in raw && Array.isArray(raw.recipients)) {
    const list = raw.recipients.filter((e): e is string => typeof e === "string" && e.length <= 254 && EMAIL.test(e.trim())).map((e) => e.trim().toLowerCase());
    if (list.length !== raw.recipients.length) return null;
    out.recipients = [...new Set(list)].slice(0, 20);
  }
  return Object.keys(out).length > 1 ? out : null;
}

export const WEEKDAY_NO = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"];
export const WEEKDAY_SHORT = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
export const FREQUENCY_LABEL: Record<Frequency, string> = { daily: "Daglig", weekly: "Ukentlig", monthly: "Månedlig" };

const capital = (s: string) => (s ? s[0].toLocaleUpperCase("nb") + s.slice(1) : s);

/** "Neste brev mandag kl. 07"; "" without a next letter. */
export function nextLetterNo(isoAt: string | null): string {
  const ms = isoAt ? Date.parse(isoAt) : NaN;
  if (!Number.isFinite(ms)) return "";
  const d = new Date(ms);
  const day = new Intl.DateTimeFormat("nb-NO", { weekday: "long", timeZone: "Europe/Oslo" }).format(d);
  const hour = new Intl.DateTimeFormat("nb-NO", { hour: "2-digit", hourCycle: "h23", timeZone: "Europe/Oslo" }).format(d);
  return `Neste brev ${day} kl. ${hour.padStart(2, "0")}`;
}

/** The live summary card: "12 prosjekter passer nå · Neste brev mandag kl. 07". */
export function summaryLine(s: AlertSettings["summary"]): string {
  const n = s.matching === 1 ? "1 prosjekt passer nå" : `${s.matching} prosjekter passer nå`;
  const next = nextLetterNo(s.next_letter_at);
  return next ? `${n} · ${next}` : n;
}

/** The grey value beside a row: what is chosen, said short. */
export function valueWords(labels: string[], none: string, max = 2): string {
  if (!labels.length) return none;
  if (labels.length <= max) return labels.join(", ");
  return `${labels.slice(0, max).join(", ")} +${labels.length - max}`;
}

/** "Ukentlig, mandag kl. 07". */
export function letterWords(s: Pick<AlertSettings, "frequency" | "send_weekday" | "send_hour">): string {
  if (!s.frequency) return "Ikke valgt";
  const parts: string[] = [FREQUENCY_LABEL[s.frequency]];
  if (s.frequency !== "daily" && s.send_weekday) parts.push(WEEKDAY_NO[s.send_weekday - 1]);
  const when = parts.join(", ");
  return s.send_hour !== null ? `${capital(when)} kl. ${String(s.send_hour).padStart(2, "0")}` : capital(when);
}

/** Whether the fag may change now: never with several today (only "Spør oss"), else after next_fag_change. */
export function fagChangeable(s: Pick<AlertSettings, "several" | "next_fag_change">, now: number): boolean {
  if (s.several) return false;
  if (!s.next_fag_change) return true;
  const ms = Date.parse(s.next_fag_change);
  return !Number.isFinite(ms) || ms <= now;
}
