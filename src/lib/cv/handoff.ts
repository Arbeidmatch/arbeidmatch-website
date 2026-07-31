import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { logApiError } from "@/lib/secureLogger";
import { siteOrigin } from "@/lib/cv/org";

export function pushToAtsEnabled(): boolean {
  return process.env.CV_PUSH_TO_ATS?.trim().toLowerCase() === "true";
}

function sharedSecret(): string | null {
  return process.env.CV_INTERNAL_SHARED_SECRET?.trim() || null;
}

/** Signature over the document id, so the internal route cannot be called from outside. */
export function signHandoff(documentId: string): string | null {
  const secret = sharedSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(documentId).digest("hex");
}

export function verifyHandoffSignature(documentId: string, signature: string | null): boolean {
  const expected = signHandoff(documentId);
  if (!expected || !signature) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Fire and forget call into the internal push route. Nothing about the candidate travels
 * in this request, only the internal document id.
 */
export async function queueHandoff(input: { documentId: string }): Promise<void> {
  if (!pushToAtsEnabled()) return;

  const signature = signHandoff(input.documentId);
  if (!signature) return;

  try {
    await fetch(`${siteOrigin()}/api/cv/push-to-ats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cv-signature": signature,
      },
      body: JSON.stringify({ documentId: input.documentId }),
      cache: "no-store",
    });
  } catch (error) {
    // The candidate already has their PDF; a handoff failure is ours to retry, not theirs.
    logApiError("cv/handoff/queue", error);
  }
}

export const MAX_PUSH_ATTEMPTS = 5;

/** 1s, 2s, 4s, 8s, 16s. */
export function backoffMs(attempt: number): number {
  return 1000 * 2 ** Math.max(0, attempt - 1);
}
