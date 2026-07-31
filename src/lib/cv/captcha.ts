import "server-only";

import { logApiError } from "@/lib/secureLogger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Cloudflare Turnstile. The widget is already allowed by the CSP and the site key is
 * already in the environment; only the secret is new.
 *
 * When TURNSTILE_SECRET_KEY is unset the check passes, so the CV flow keeps working on
 * environments where the secret has not been configured. Set it in production.
 */
export async function verifyCaptcha(
  token: string | null,
  remoteIp: string | null,
): Promise<{ ok: boolean; skipped: boolean }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true, skipped: true };
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
