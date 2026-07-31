import "server-only";

import { logApiError } from "@/lib/secureLogger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile, enforced only when it is fully configured.
 *
 * Both halves must be present: the secret to verify with, and the public site key that
 * makes the browser render a widget in the first place. With only the secret set, the
 * modal shows no widget, the request carries no token, and every real user is turned
 * away. That happened in production, so the check now requires both rather than
 * demanding a token the client was never given the means to produce.
 */
export async function verifyCaptcha(
  token: string | null,
  remoteIp: string | null,
): Promise<{ ok: boolean; skipped: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret || !siteKey) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    const result = (await response.json()) as { success?: boolean };
    return { ok: result.success === true, skipped: false };
  } catch (error) {
    logApiError("cv/captcha", error);
    // A Cloudflare outage must not stop people building a CV.
    return { ok: true, skipped: true };
  }
}
