/**
 * Receives events FROM ATS → website (e.g. partner_approved, job_filled).
 * Status: READY FOR INTEGRATION - extend handlers when ATS sends real payloads.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { noStoreJson } from "@/lib/apiSecurity";
import { logApiError } from "@/lib/secureLogger";

const DEFAULT_TOLERANCE_SECONDS = 300;

function verifySignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string,
): boolean {
  if (!signature || !timestamp) return false;
  const timestampNum = Number(timestamp);
  if (!Number.isFinite(timestampNum)) return false;

  const tolerance =
    Number(process.env.ATS_WEBHOOK_TOLERANCE_SECONDS) || DEFAULT_TOLERANCE_SECONDS;
  const age = Math.abs(Math.floor(Date.now() / 1000) - timestampNum);
  if (age > tolerance) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.ATS_WEBHOOK_SECRET?.trim();
    if (!secret) {
      logApiError("ats/webhook", new Error("missing_ats_webhook_secret"));
      return noStoreJson({ error: "Webhook not configured." }, { status: 500 });
    }

    const signature = request.headers.get("x-ats-signature");
    const timestamp = request.headers.get("x-ats-timestamp");
    const body = await request.text();

    if (!verifySignature(body, signature, timestamp, secret)) {
      return noStoreJson({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const event = JSON.parse(body) as { type?: string; data?: unknown };

    switch (event.type) {
      case "partner.approved":
        // TODO: send approval email to employer
        void event.data;
        break;
      case "partner.rejected":
        // TODO: send rejection email to employer
        void event.data;
        break;
      case "candidate.status_updated":
        // TODO: sync status if needed
        void event.data;
        break;
      default:
        void event.type;
    }

    return noStoreJson({ received: true });
  } catch (error) {
    logApiError("ats/webhook", error);
    return noStoreJson({ error: "Invalid payload" }, { status: 400 });
  }
}
