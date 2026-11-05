/**
 * PASSKEYS ON MIN SIDE (ORDER 228, the owner's ask of 5 November 2026: "sa
 * poata pune o cheie de acces ca sa intre cu amprenta sau ce au ei").
 *
 * A client adds a passkey once, with the fingerprint, face or PIN of the
 * device, and signs in with it from then on instead of waiting for an e-mail
 * link. The e-mail link keeps working as before.
 *
 * The ceremony runs here, on www.arbeidmatch.no; the ATS checks the answers and
 * keeps the keys (its api/public/client-profile/passkey/*). The browser talks
 * only to this site's /api/min-side/passkey/<step>, which passes each step on
 * server to server. The ATS's single-use challenge id is kept between the two
 * steps in an httpOnly cookie of this site, never in the page's script.
 *
 * A sign-in answers the same key a pressed login link answers, and it is kept
 * in the same session cookie (PORTAL_SESSION_COOKIE), so what follows is the
 * same as after the link.
 */

import { isProfileToken } from "@/lib/min-side/profile";

export const PASSKEY_STEPS = ["register-options", "register-verify", "login-options", "login-verify", "list", "remove"] as const;
export type PasskeyStep = (typeof PASSKEY_STEPS)[number];

export function isPasskeyStep(value: unknown): value is PasskeyStep {
  return typeof value === "string" && (PASSKEY_STEPS as readonly string[]).includes(value);
}

/** The challenge between the two steps of a ceremony; five minutes, like the ATS's. */
export const PASSKEY_CHALLENGE_COOKIE = "am_pk_challenge";
const CHALLENGE_SECONDS = 5 * 60;

export function passkeyChallengeCookieOptions(maxAge = CHALLENGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/min-side/passkey",
    maxAge,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The ATS route and body for one step, or null when the request is not one we pass on. */
export function atsCallFor(
  step: PasskeyStep,
  raw: Record<string, unknown>,
  challengeId: string | null,
): { path: string; body: Record<string, unknown> } | null {
  const base = "/api/public/client-profile/passkey";
  const session = isProfileToken(raw.token) ? raw.token : null;
  const response = raw.response && typeof raw.response === "object" && !Array.isArray(raw.response) ? raw.response : null;
  const challenge = challengeId && UUID.test(challengeId) ? challengeId : null;
  switch (step) {
    case "register-options":
      return session ? { path: `${base}/register/options`, body: { session } } : null;
    case "register-verify": {
      if (!session || !response) return null;
      const name = typeof raw.device_name === "string" ? raw.device_name.slice(0, 60) : undefined;
      return { path: `${base}/register/verify`, body: { session, challenge_id: challenge, response, ...(name ? { device_name: name } : {}) } };
    }
    case "login-options":
      return { path: `${base}/login/options`, body: {} };
    case "login-verify":
      return response ? { path: `${base}/login/verify`, body: { challenge_id: challenge, response } } : null;
    case "list":
      return session ? { path: `${base}/credentials`, body: { session } } : null;
    case "remove":
      return session && typeof raw.id === "string" && UUID.test(raw.id) ? { path: `${base}/credentials`, body: { session, action: "remove", id: raw.id } } : null;
  }
}

export type ListedPasskey = { id: string; device_name: string | null; created_at: string; last_used_at: string | null };

export function passkeysFrom(value: unknown): ListedPasskey[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === "object" && typeof (p as { id?: unknown }).id === "string")
    .map((p) => ({
      id: String(p.id),
      device_name: typeof p.device_name === "string" ? p.device_name : null,
      created_at: typeof p.created_at === "string" ? p.created_at : "",
      last_used_at: typeof p.last_used_at === "string" ? p.last_used_at : null,
    }));
}

/** How a device is named in the list: the name the client gave it, else the day it was added. */
export function passkeyLabel(p: ListedPasskey): string {
  if (p.device_name) return p.device_name;
  const d = new Date(p.created_at);
  return Number.isFinite(d.getTime()) ? `Lagt til ${d.toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}` : "Enhet";
}
