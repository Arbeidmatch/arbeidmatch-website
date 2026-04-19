import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CandidateActivityStats = {
  /** Total rows in `guide_interest_signups` (exact when DB is available). */
  registeredCount: number;
  /** Display-only: deterministic daily count 20–50 for hero / activity strip. */
  candidatesRegisteredToday: number;
  activeOnSiteNow: number;
  /** Modeled cumulative visits, moves with `activeOnSiteNow` so metrics feel linked. */
  totalVisits: number;
  registeredIsExact: boolean;
  activeIsEstimated: boolean;
  totalVisitsIsEstimated: boolean;
};

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** 32-bit mixing; deterministic for a given seed. */
function hash32(seed: number): number {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}

/** Calendar day index in Norway’s main IANA zone (Norwegian “today”). */
function norwayCivilDayIndex(d: Date): number {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;
  const y = Number(map.year);
  const m = Number(map.month) - 1;
  const day = Number(map.day);
  return Math.floor(Date.UTC(y, m, day) / 86_400_000);
}

function norwayWallClock(d: Date): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Oslo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;
  return { hour: Number(map.hour), minute: Number(map.minute) };
}

/**
 * Daily count 20–50; uses full calendar day index so the same weekday in different weeks
 * does not repeat the same value (unlike a pure 7-day cycle).
 */
export function getCandidatesRegisteredToday(now: Date): number {
  const day = norwayCivilDayIndex(now);
  const h = hash32(day * 0x165667b1 + 0x27d4eb2d);
  return 20 + (h % 31);
}

const ACTIVE_MIN = 205;
const ACTIVE_MAX = 432;
const ACTIVE_SPAN = ACTIVE_MAX - ACTIVE_MIN + 1;

/**
 * "Active on site now" in [205, 432], varies by ~5-minute UTC bucket so it feels live.
 */
export function getActiveOnSiteNow(now: Date): number {
  const day = norwayCivilDayIndex(now);
  const { hour, minute } = norwayWallClock(now);
  const bucket = hour * 12 + Math.floor(minute / 5);
  const h = hash32(day * 1_000_000 + bucket * 0x9e3779b9 + 0x85ebca6b);
  return ACTIVE_MIN + (h % ACTIVE_SPAN);
}

/**
 * Total visits: large cumulative-style number that rises when active rises (same formula, same request).
 */
export function getTotalVisitsLinked(activeOnSiteNow: number, now: Date): number {
  const day = norwayCivilDayIndex(now);
  const base = 1_240_000 + (day % 10_000) * 73;
  return Math.round(base + activeOnSiteNow * 1_847);
}

/**
 * Loads candidate activity numbers for home page / API.
 * `registeredCount` is exact from `guide_interest_signups` when available.
 * Display metrics use deterministic modeled values (ranges per product request).
 */
export async function getCandidateActivityStats(): Promise<CandidateActivityStats> {
  const now = new Date();

  const candidatesRegisteredToday = getCandidatesRegisteredToday(now);
  const activeOnSiteNow = getActiveOnSiteNow(now);
  const totalVisits = getTotalVisitsLinked(activeOnSiteNow, now);

  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      registeredCount: 0,
      candidatesRegisteredToday,
      activeOnSiteNow,
      totalVisits,
      registeredIsExact: false,
      activeIsEstimated: true,
      totalVisitsIsEstimated: true,
    };
  }

  try {
    const totalRes = await supabase.from("guide_interest_signups").select("*", { count: "exact", head: true });

    if (totalRes.error) throw totalRes.error;

    const registeredCount = totalRes.count ?? 0;

    return {
      registeredCount,
      candidatesRegisteredToday,
      activeOnSiteNow,
      totalVisits,
      registeredIsExact: true,
      activeIsEstimated: true,
      totalVisitsIsEstimated: true,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[candidate-activity-stats]", message);
    return {
      registeredCount: 0,
      candidatesRegisteredToday,
      activeOnSiteNow,
      totalVisits,
      registeredIsExact: false,
      activeIsEstimated: true,
      totalVisitsIsEstimated: true,
    };
  }
}
