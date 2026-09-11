import "server-only";

import { ATS_BASE_URL_VARS } from "@/lib/cv/mailer";
import { logApiError } from "@/lib/secureLogger";
import type { AdPackage, AdvertDraft, PaymentMethod, PostingRules, PublicOrderView } from "./types";
import { isOrderToken } from "./types";

/**
 * The website's side of the paid-advert API on the ATS (api/public/job-ads).
 *
 * Server to server only: the shared secret goes in a header from here and never
 * reaches a browser. The browser talks to this site's own /api/job-ads routes,
 * which call these functions.
 *
 * The address is found the same way the CV mailer finds it (ATS_BASE_URL_VARS),
 * so the feature works under whichever name the deployment already carries.
 */

export type AtsResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

/** The review runs while the client waits and may take a minute; the ATS gives it 90 s. */
export const REVIEW_TIMEOUT_MS = 110_000;
const DEFAULT_TIMEOUT_MS = 30_000;

export function atsJobAdsBase(): string | null {
  for (const name of ATS_BASE_URL_VARS) {
    const base = process.env[name]?.trim();
    if (base) return `${base.replace(/\/+$/, "")}/api/public/job-ads`;
  }
  return null;
}

async function call<T>(
  path: string,
  init: { method: "GET" | "POST" | "PUT"; body?: unknown; timeoutMs?: number },
): Promise<AtsResult<T>> {
  const base = atsJobAdsBase();
  const secret = process.env.ATS_EMAIL_SECRET?.trim();
  if (!base || !secret) return { ok: false, status: 503, error: "ats_not_configured" };

  try {
    const response = await fetch(`${base}${path}`, {
      method: init.method,
      headers: {
        "x-website-email-secret": secret,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    });
    const json = (await response.json().catch(() => null)) as ({ ok?: boolean; error?: string } & Record<string, unknown>) | null;
    if (!response.ok || !json || json.ok !== true) {
      const status = response.ok ? 502 : response.status;
      return { ok: false, status, error: String(json?.error ?? `ats_${response.status}`) };
    }
    return { ok: true, data: json as unknown as T };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    logApiError("job-ads/atsClient", error, { path: path.replace(/[a-f0-9]{64}/, ":token"), timedOut });
    return { ok: false, status: timedOut ? 504 : 503, error: timedOut ? "ats_timeout" : "ats_unreachable" };
  }
}

function orderPath(token: string, suffix = ""): string | null {
  return isOrderToken(token) ? `/${token}${suffix}` : null;
}

const badToken = { ok: false as const, status: 404, error: "order not found" };

type OrderEnvelope = { order: PublicOrderView };

function unwrap(r: AtsResult<OrderEnvelope>): AtsResult<PublicOrderView> {
  return r.ok ? { ok: true, data: r.data.order } : r;
}

/** The posting rules in force, so the form shows exactly the version the client accepts. */
export async function getPostingRules(): Promise<AtsResult<PostingRules>> {
  const r = await call<{ version: string; rules: PostingRules["rules"] }>("", { method: "GET" });
  return r.ok ? { ok: true, data: { version: String(r.data.version), rules: r.data.rules ?? [] } } : r;
}

/** A new advert. The ATS reviews it synchronously, so this can take up to a minute. */
export async function createOrder(input: { advert: AdvertDraft; rulesVersion: string }): Promise<AtsResult<PublicOrderView>> {
  return unwrap(
    await call<OrderEnvelope>("", {
      method: "POST",
      body: { advert: input.advert, rulesVersion: input.rulesVersion, rulesAccepted: true },
      timeoutMs: REVIEW_TIMEOUT_MS,
    }),
  );
}

export async function getOrder(token: string): Promise<AtsResult<PublicOrderView>> {
  const path = orderPath(token);
  if (!path) return badToken;
  return unwrap(await call<OrderEnvelope>(path, { method: "GET" }));
}

/** The corrected advert, read again by the reviewer. */
export async function reviseOrder(token: string, advert: AdvertDraft): Promise<AtsResult<PublicOrderView>> {
  const path = orderPath(token);
  if (!path) return badToken;
  return unwrap(await call<OrderEnvelope>(path, { method: "PUT", body: { advert }, timeoutMs: REVIEW_TIMEOUT_MS }));
}

/**
 * The client's choice. The ATS freezes the price in order.chosen.quote. For a
 * card the order waits for payment; for an invoice it is invoiced and published.
 */
export async function choosePayment(
  token: string,
  choice: { package: AdPackage; addons: string[]; method: PaymentMethod; invoiceReference?: string | null; invoiceEmail?: string | null },
): Promise<AtsResult<PublicOrderView>> {
  const path = orderPath(token, "/payment");
  if (!path) return badToken;
  return unwrap(await call<OrderEnvelope>(path, { method: "POST", body: choice, timeoutMs: 60_000 }));
}

/**
 * Stripe says the checkout for this order is paid. The ATS checks the amount
 * against the frozen total and is idempotent per session id.
 */
export async function markOrderPaid(
  token: string,
  paid: { sessionId: string; amountTotal: number; currency: string },
): Promise<AtsResult<PublicOrderView>> {
  const path = orderPath(token, "/payment");
  if (!path) return badToken;
  return unwrap(await call<OrderEnvelope>(path, { method: "POST", body: { paid }, timeoutMs: 60_000 }));
}
