import { NextRequest } from "next/server";
import Stripe from "stripe";

import { noStoreJson } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { markOrderPaid } from "@/lib/job-ads/atsClient";
import { CARD_PAYMENTS_ON } from "@/lib/job-ads/payments";
import { jobAdPaidFromSession } from "@/lib/job-ads/stripe";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sessions older than this have either been confirmed by now or are for a human to look at. */
const LOOKBACK_SECONDS = 3 * 86_400;

/**
 * Publishes paid adverts whose confirmation never arrived (ORDER 284).
 *
 * A card payment is confirmed two ways: Stripe's webhook, and the client's return
 * to the order page. The dashboard may not send checkout.session.completed, and a
 * client who closes the tab on Stripe's page never comes back, so an advert could
 * be paid and never published. This reads the recent completed Checkout Sessions
 * from Stripe by id and hands every paid advert to the ATS, which checks the
 * amount and is idempotent per session: one already published is answered the same
 * way and nothing happens twice.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return noStoreJson({ error: "Server misconfiguration" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return noStoreJson({ error: "Unauthorized" }, { status: 401 });
  }
  // Card payment paused: nothing to reconcile, and no error for his bell.
  if (!CARD_PAYMENTS_ON) return noStoreJson({ success: true, paused: true });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return noStoreJson({ error: "Service unavailable" }, { status: 503 });

  const stripe = new Stripe(secret);
  const since = Math.floor(Date.now() / 1000) - LOOKBACK_SECONDS;
  let seen = 0;
  let confirmed = 0;
  const failures: string[] = [];
  try {
    for await (const session of stripe.checkout.sessions.list({ status: "complete", created: { gte: since }, limit: 100 })) {
      const paid = jobAdPaidFromSession(session);
      if (!paid) continue;
      seen++;
      const result = await markOrderPaid(paid.token, paid.paid);
      if (result.ok) confirmed++;
      else failures.push(`${session.id}: ${result.status} ${result.error}`);
    }
  } catch (error) {
    await notifyError({ route: "/api/cron/job-ads-reconcile", error });
    return noStoreJson({ success: false, error: "Reconcile failed." }, { status: 502 });
  }
  if (failures.length > 0) {
    await notifyError({ route: "/api/cron/job-ads-reconcile", error: `ATS refused ${failures.length} paid session(s): ${failures.slice(0, 5).join("; ")}` });
  }
  return noStoreJson({ success: true, seen, confirmed, refused: failures.length });
}
