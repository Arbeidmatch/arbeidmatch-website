"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";

import { passkeysFrom, type ListedPasskey } from "@/lib/min-side/passkey";

/**
 * The browser's half of the Min side passkeys (ORDER 228). The device shows its
 * own fingerprint, face or PIN prompt; nothing here sees a biometric, only the
 * signed answer the authenticator returns. A browser without passkeys is never
 * offered the buttons (passkeysSupported).
 */

export function passkeysSupported(): boolean {
  try {
    return typeof window !== "undefined" && browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

async function step(name: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; json: Record<string, unknown> }> {
  try {
    const res = await fetch(`/api/min-side/passkey/${name}`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, json };
  } catch {
    return { ok: false, status: 0, json: { error: "Ingen forbindelse. Prøv igjen." } };
  }
}

function cancelled(e: unknown): boolean {
  const name = (e as { name?: string } | null)?.name ?? "";
  const code = (e as { code?: string } | null)?.code ?? "";
  return name === "NotAllowedError" || name === "AbortError" || code === "ERROR_CEREMONY_ABORTED";
}

export type PasskeyResult<T> = { ok: true; value: T } | { ok: false; cancelled: boolean; error: string };

export async function listPasskeys(token: string): Promise<ListedPasskey[] | null> {
  const r = await step("list", { token });
  return r.ok ? passkeysFrom(r.json.passkeys) : null;
}

export async function addPasskey(token: string): Promise<PasskeyResult<ListedPasskey[]>> {
  const start = await step("register-options", { token });
  if (!start.ok || !start.json.options) return { ok: false, cancelled: false, error: String(start.json.error ?? "Kunne ikke starte. Prøv igjen.") };
  let response;
  try {
    response = await startRegistration({ optionsJSON: start.json.options as Parameters<typeof startRegistration>[0]["optionsJSON"] });
  } catch (e) {
    if (cancelled(e)) return { ok: false, cancelled: true, error: "" };
    if ((e as { code?: string } | null)?.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") return { ok: false, cancelled: false, error: "Denne enheten har allerede en nøkkel." };
    return { ok: false, cancelled: false, error: "Denne enheten kunne ikke lage en nøkkel." };
  }
  const done = await step("register-verify", { token, response });
  if (!done.ok) return { ok: false, cancelled: false, error: String(done.json.error ?? "Nøkkelen kunne ikke legges til.") };
  return { ok: true, value: passkeysFrom(done.json.passkeys) };
}

export async function removePasskey(token: string, id: string): Promise<PasskeyResult<ListedPasskey[]>> {
  const r = await step("remove", { token, id });
  return r.ok ? { ok: true, value: passkeysFrom(r.json.passkeys) } : { ok: false, cancelled: false, error: String(r.json.error ?? "Kunne ikke fjerne nøkkelen.") };
}

/** Sign in with a passkey of this device; answers where Min side is. */
export async function signInWithPasskey(): Promise<PasskeyResult<string>> {
  const start = await step("login-options", {});
  if (!start.ok || !start.json.options) return { ok: false, cancelled: false, error: String(start.json.error ?? "Innloggingen er ikke tilgjengelig akkurat nå.") };
  let response;
  try {
    response = await startAuthentication({ optionsJSON: start.json.options as Parameters<typeof startAuthentication>[0]["optionsJSON"] });
  } catch (e) {
    if (cancelled(e)) return { ok: false, cancelled: true, error: "" };
    return { ok: false, cancelled: false, error: "Denne enheten kunne ikke bruke en nøkkel. Logg inn med e-post." };
  }
  const done = await step("login-verify", { response });
  const redirect = done.json.redirect;
  if (!done.ok || typeof redirect !== "string" || !redirect.startsWith("/min-side/")) {
    return { ok: false, cancelled: false, error: String(done.json.error ?? "Innloggingen kunne ikke fullføres.") };
  }
  return { ok: true, value: redirect };
}
