import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Rough model: site visitors vs. signup rows (no dedicated analytics table). */
const DEFAULT_VISITOR_MULTIPLIER = 26;

export type CandidateActivityStats = {
  registeredCount: number;
  activeOnSiteNow: number;
  avgDailyVisitors: number;
  registeredIsExact: boolean;
  activeIsEstimated: boolean;
  avgIsEstimated: boolean;
};

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseMultiplier(): number {
  const raw = process.env.CANDIDATE_ACTIVITY_VISITOR_MULTIPLIER;
  if (!raw) return DEFAULT_VISITOR_MULTIPLIER;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_VISITOR_MULTIPLIER;
}

/** Peak-ish curve over UTC hours (stable per request, no random walk). */
function intradayActiveFactorUtc(hour: number): number {
  const h = Math.min(23, Math.max(0, hour));
  const base = 0.032;
  const amp = 0.052;
  return base + amp * Math.sin(((h - 7) / 24) * Math.PI * 2);
}

/**
 * Loads candidate activity numbers for home page / API.
 * Registered count is exact from `guide_interest_signups`; other fields are modeled estimates.
 */
export async function getCandidateActivityStats(): Promise<CandidateActivityStats> {
  const multiplier = parseMultiplier();
  const now = new Date();
  const hourUtc = now.getUTCHours();

  const supabase = getSupabaseClient();
  if (!supabase) {
    const fallbackAvg = 180;
    const activeOnSiteNow = Math.round(
      Math.max(18, Math.min(420, fallbackAvg * intradayActiveFactorUtc(hourUtc) * 3.2)),
    );
    return {
      registeredCount: 0,
      activeOnSiteNow,
      avgDailyVisitors: fallbackAvg,
      registeredIsExact: false,
      activeIsEstimated: true,
      avgIsEstimated: true,
    };
  }

  try {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, last7Res, last24Res] = await Promise.all([
      supabase.from("guide_interest_signups").select("*", { count: "exact", head: true }),
      supabase.from("guide_interest_signups").select("*", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      supabase.from("guide_interest_signups").select("*", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo),
    ]);

    if (totalRes.error) throw totalRes.error;
    if (last7Res.error) throw last7Res.error;
    if (last24Res.error) throw last24Res.error;

    const registeredCount = totalRes.count ?? 0;
    const signupsLast7d = last7Res.count ?? 0;
    const signupsLast24h = last24Res.count ?? 0;

    const avgDailySignups = signupsLast7d / 7;
    const avgDailyFromWeek = Math.max(0, avgDailySignups * multiplier);
    const avgFromLast24h = signupsLast24h * multiplier;

    const avgDailyVisitors = Math.round(Math.max(48, (avgDailyFromWeek + avgFromLast24h) / 2));

    const activeRaw = avgDailyVisitors * intradayActiveFactorUtc(hourUtc) * 3.1;
    const activeOnSiteNow = Math.round(Math.max(12, Math.min(520, activeRaw)));

    return {
      registeredCount,
      activeOnSiteNow,
      avgDailyVisitors,
      registeredIsExact: true,
      activeIsEstimated: true,
      avgIsEstimated: true,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[candidate-activity-stats]", message);
    const fallbackAvg = 160;
    const activeOnSiteNow = Math.round(
      Math.max(16, Math.min(400, fallbackAvg * intradayActiveFactorUtc(hourUtc) * 3)),
    );
    return {
      registeredCount: 0,
      activeOnSiteNow,
      avgDailyVisitors: fallbackAvg,
      registeredIsExact: false,
      activeIsEstimated: true,
      avgIsEstimated: true,
    };
  }
}
