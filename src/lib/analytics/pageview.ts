import { createHash } from "node:crypto";

import { aiCrawlerName, assistantFromReferrer, type AiAssistant } from "@/lib/analytics/ai-referrer";

/**
 * One pageview row for ats_web_pageviews, built exactly as the ATS sink builds it.
 *
 * WHY THE WEBSITE WRITES ITS OWN ROWS. The beacon used to post from the
 * visitor's browser to https://ats.arbeidmatch.no/api/public/track. Since
 * 6 September 2026 the ATS boundary refuses browser-shaped calls from the
 * public (the owner's rule: the public never talks to the ATS host from a
 * browser), so every pageview on arbeidmatch.no was a 404 and the site vanished
 * from its own traffic figures. Forwarding server-side does not work either:
 * the sink hashes the caller's IP and reads Vercel's own country and town
 * headers, so every visit would be recorded as the website's server. So the
 * website's same-origin route writes the row itself, into the same table, with
 * the same rules - mirrored from ats-recruitment/src/app/api/public/track/route.ts.
 *
 * Privacy is unchanged: a daily-rotating hash of IP + user agent + date + salt,
 * never the raw IP, no cookie. For a person visiting both hosts on one day to
 * count once, this deployment must carry the same ANALYTICS_SALT (or, failing
 * that, CRON_SECRET) as the ATS.
 */

export const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i;
const ALLOWED_HOST_SUFFIX = ["arbeidmatch.no", "localhost", "127.0.0.1", "vercel.app"];

export function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isOurHost(host: string | null): boolean {
  if (!host) return false;
  return ALLOWED_HOST_SUFFIX.some((s) => host === s || host.endsWith(`.${s}`));
}

/** The path as the sink accepts it: starts with "/", at most 512 characters. Null otherwise. */
export function cleanPath(value: unknown): string | null {
  const path = typeof value === "string" ? value.trim().slice(0, 512) : "";
  return path && path.startsWith("/") ? path : null;
}

/** First address of x-forwarded-for, then x-real-ip, then 0.0.0.0, as the ATS sink reads it. */
export function visitorIp(forwardedFor: string | null, realIp: string | null): string {
  return (forwardedFor ?? "").split(",")[0].trim() || (realIp ?? "").trim() || "0.0.0.0";
}

export function analyticsSalt(env: Record<string, string | undefined> = process.env): string {
  return env.ANALYTICS_SALT ?? env.CRON_SECRET ?? "am-analytics-v1";
}

/** sha256(ip|ua|YYYY-MM-DD|salt), first 32 hex characters. The raw IP goes no further than this. */
export function visitorHash(ip: string, userAgent: string, day: string, salt: string): string {
  return createHash("sha256").update(`${ip}|${userAgent}|${day}|${salt}`).digest("hex").slice(0, 32);
}

/** The town header is percent-encoded: "Ålesund" arrives as %C3%85lesund. */
export function decodeCity(raw: string | null): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  try {
    return decodeURIComponent(value).slice(0, 80);
  } catch {
    return value.slice(0, 80);
  }
}

export type PageviewRow = {
  host: string | null;
  path: string;
  referrer_host: string | null;
  visitor_hash: string;
  is_bot: boolean;
  country: string | null;
  city: string | null;
  ai_assistant: AiAssistant | null;
  ai_crawler: string | null;
};

export type PageviewInput = {
  headers: {
    origin: string | null;
    referer: string | null;
    host: string | null;
    userAgent: string | null;
    forwardedFor: string | null;
    realIp: string | null;
    country: string | null;
    city: string | null;
  };
  body: unknown;
  now?: Date;
  salt?: string;
};

/**
 * The row to insert, or null when the beacon is to be ignored silently
 * (off-origin post, or no usable path). Pure, so it can be tested without a
 * request or a database.
 */
export function buildPageviewRow(input: PageviewInput): PageviewRow | null {
  const { headers } = input;
  const originHost = hostOf(headers.origin) ?? hostOf(headers.referer);
  const selfHost = hostOf(headers.host);
  if (originHost && !isOurHost(originHost) && !isOurHost(selfHost)) return null;

  const body = (input.body && typeof input.body === "object" ? input.body : null) as {
    path?: unknown;
    ref?: unknown;
    host?: unknown;
  } | null;
  const path = cleanPath(body?.path);
  if (!path) return null;

  const ua = headers.userAgent ?? "";
  const aiCrawler = aiCrawlerName(ua);
  const day = (input.now ?? new Date()).toISOString().slice(0, 10);
  const hash = visitorHash(visitorIp(headers.forwardedFor, headers.realIp), ua, day, input.salt ?? analyticsSalt());
  const referrerHost = typeof body?.ref === "string" ? hostOf(body.ref) : null;
  const host = (typeof body?.host === "string" ? hostOf(body.host) : null) ?? selfHost;
  const country = (headers.country ?? "").trim().toUpperCase().slice(0, 2) || null;

  return {
    host,
    path,
    referrer_host: referrerHost,
    visitor_hash: hash,
    is_bot: BOT_RE.test(ua) || Boolean(aiCrawler),
    country,
    city: decodeCity(headers.city),
    ai_assistant: assistantFromReferrer(referrerHost),
    ai_crawler: aiCrawler,
  };
}
