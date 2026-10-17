/**
 * THE CLIENT'S SESSION ON THE PROJECT PAGES (PROJ-REST A, the owner's yes of
 * 17 October 2026: only a signed-in client sees a presentation's details).
 *
 * The session is Min side's: a login link from the e-mail is redeemed at the
 * ATS, which answers the key to the client's own page (profile) and/or to their
 * subscription page (token). Since PROJ-REST the website also keeps that key in
 * an httpOnly cookie on this domain, and passes it to the ATS, server to server,
 * when a presentation is opened. The ATS decides: the presentation's own
 * address sees everything, no session sees it masked, another address is
 * refused. The key never reaches the page's script.
 */

import { isProfileToken } from "@/lib/min-side/profile";
import { isProjectToken } from "@/lib/prosjekter/format";

export const PORTAL_SESSION_COOKIE = "am_portal_session";
/** The header the ATS reads it from (its lib/project-alerts/server.ts PORTAL_SESSION_HEADER). */
export const PORTAL_SESSION_HEADER = "x-arbeidmatch-portal-session";
const SESSION_DAYS = 30;

export function portalSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  };
}

/** The key to keep from a redeemed login: the Min side key first, else the subscription's. */
export function sessionKeyFrom(answer: { profile?: unknown; token?: unknown }): string | null {
  if (isProfileToken(answer.profile)) return answer.profile;
  if (isProjectToken(answer.token)) return answer.token;
  return null;
}

/** The header to pass on to the ATS for this cookie value; empty without a well-formed key. */
export function sessionHeaders(cookieValue: string | null | undefined): Record<string, string> {
  const key = String(cookieValue ?? "").trim();
  return isProjectToken(key) ? { [PORTAL_SESSION_HEADER]: key } : {};
}

export type LoginIntent = { plan: boolean; alerts: boolean; prosjekt: string | null };

/** What a login link may ask for, read from its query; only these three words are carried on. */
export function loginIntentFrom(query: { get(name: string): string | null } | Record<string, string | string[] | undefined>): LoginIntent {
  const read = (name: string): string | null => {
    if (typeof (query as { get?: unknown }).get === "function") return (query as { get(n: string): string | null }).get(name);
    const v = (query as Record<string, string | string[] | undefined>)[name];
    return typeof v === "string" ? v : null;
  };
  const plan = read("plan") === "1";
  const alerts = !plan && read("alerts") === "1";
  const p = read("prosjekt");
  return { plan, alerts, prosjekt: !plan && !alerts && isProjectToken(p) ? p.toLowerCase() : null };
}

/** The query string that carries an intent on to the next hop, "" without one. */
export function intentQuery(intent: LoginIntent): string {
  if (intent.plan) return "?plan=1";
  if (intent.alerts) return "?alerts=1";
  if (intent.prosjekt) return `?prosjekt=${intent.prosjekt}`;
  return "";
}

/**
 * Where a redeemed login goes. A presentation's "Logg inn" goes back to that
 * presentation; ?alerts=1 to the subscription page; otherwise Min side, else
 * the subscription page, as before PROJ-REST.
 */
export function loginTarget(answer: { profile: string | null; projects: string | null }, intent: LoginIntent): string | null {
  const { profile, projects } = answer;
  if (intent.prosjekt && (profile || projects)) return `/prosjekt/${intent.prosjekt}`;
  if (intent.alerts && projects) return `/prosjekter/${projects}`;
  if (profile) return `/min-side/${profile}${intent.plan ? "?plan=1" : intent.alerts ? "?alerts=1" : ""}`;
  if (projects) return `/prosjekter/${projects}`;
  return null;
}
