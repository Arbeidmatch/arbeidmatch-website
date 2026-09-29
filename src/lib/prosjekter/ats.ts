import "server-only";

import { ATS_BASE_URL_VARS } from "@/lib/cv/mailer";
import { logApiError } from "@/lib/secureLogger";

/**
 * The website's side of the project portal on the ATS (api/public/projects-overview,
 * project-alerts/<token>, project-presentation/<token>).
 *
 * Server to server only. The browser talks to this site's /api/prosjekter/*
 * routes (the CSP allows connect-src 'self'), and server components call this
 * directly.
 *
 * WHY THE TWO HEADERS. The ATS rate-limits its public routes per visitor. Seen
 * from the ATS, every request from here comes from this site's own egress
 * address, so without help one busy visitor would spend the whole site's
 * allowance. The ATS therefore accepts a visitor address from us, but only when
 * it arrives together with the secret we already share with it for the mail
 * relay (ATS_EMAIL_SECRET here, WEBSITE_EMAIL_SECRET there):
 *
 *   x-arbeidmatch-website-secret: <ATS_EMAIL_SECRET>
 *   x-arbeidmatch-applicant-ip:   <the visitor's address>
 *
 * Without the secret the address header is ignored and the ATS counts our own
 * address, so a missing secret degrades to a shared limit rather than failing.
 */

export const ATS_DEFAULT_BASE = "https://ats.arbeidmatch.no";

export function atsBase(): string {
  for (const name of ATS_BASE_URL_VARS) {
    const base = process.env[name]?.trim();
    if (base) return base.replace(/\/+$/, "");
  }
  return ATS_DEFAULT_BASE;
}

const IP_SHAPE = /^[0-9A-Fa-f:.]{3,45}$/;

/**
 * The visitor's address from the request headers. On Vercel x-forwarded-for is
 * written by the platform, with the client first. Anything that does not look
 * like an address is dropped rather than forwarded.
 */
export function visitorIp(headers: Headers): string | null {
  const candidates = [headers.get("x-forwarded-for")?.split(",")[0], headers.get("x-real-ip")];
  for (const raw of candidates) {
    const ip = raw?.trim() ?? "";
    if (IP_SHAPE.test(ip)) return ip;
  }
  return null;
}

/** The headers that vouch for one visitor. Empty when the secret is not configured. */
export function vouchingHeaders(visitorHeaders: Headers): Record<string, string> {
  const secret = process.env.ATS_EMAIL_SECRET?.trim();
  const ip = visitorIp(visitorHeaders);
  if (!secret || !ip) return {};
  return { "x-arbeidmatch-website-secret": secret, "x-arbeidmatch-applicant-ip": ip };
}

export type AtsAnswer = { status: number; body: Record<string, unknown> };

const UNREACHABLE = "Prosjektene kunne ikke hentes akkurat nå. Prøv igjen om litt.";

/**
 * One call to the ATS on behalf of a visitor. Always answers: the ATS's own
 * status and JSON when it replies, 503/504 with a Norwegian message when it
 * cannot be reached, 502 when it replies with something that is not JSON.
 */
export async function callAts(
  path: string,
  init: { method: "GET" | "POST"; visitorHeaders: Headers; body?: unknown; timeoutMs?: number },
): Promise<AtsAnswer> {
  try {
    const response = await fetch(`${atsBase()}${path}`, {
      method: init.method,
      headers: {
        Accept: "application/json",
        ...vouchingHeaders(init.visitorHeaders),
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs ?? 15_000),
    });
    const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return { status: 502, body: { error: UNREACHABLE } };
    }
    return { status: response.status, body: json };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    logApiError("prosjekter/ats", error, {
      path: path.replace(/[0-9a-f-]{36}/i, ":token").replace(/(project-login\/)[^/?]+/, "$1:token").split("?")[0] ?? "",
      timedOut,
    });
    return { status: timedOut ? 504 : 503, body: { error: UNREACHABLE } };
  }
}
