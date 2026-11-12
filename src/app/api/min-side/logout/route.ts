import { noStoreJson } from "@/lib/apiSecurity";
import { PORTAL_SESSION_COOKIE, portalSessionCookieOptions } from "@/lib/prosjekter/portal-session";

export const dynamic = "force-dynamic";

/**
 * ORDER 273: "Logg ut" in the Min side header. The session the login link or
 * the passkey set on this site (the httpOnly cookie) is taken away; the page
 * then goes to the Min side door, where the next login starts.
 */
export async function POST() {
  const res = noStoreJson({ ok: true });
  res.cookies.set(PORTAL_SESSION_COOKIE, "", { ...portalSessionCookieOptions(), maxAge: 0 });
  return res;
}
