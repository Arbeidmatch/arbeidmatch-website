import { NextRequest } from "next/server";
import Stripe from "stripe";

import { getRateLimitResult, noStoreJson } from "@/lib/apiSecurity";
import { notifyError } from "@/lib/errorNotifier";
import { getOrder, markOrderPaid } from "@/lib/job-ads/atsClient";
import { norwegianError } from "@/lib/job-ads/errors";
import { jobAdPaidFromSession } from "@/lib/job-ads/stripe";
import { isOrderToken } from "@/lib/job-ads/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ token: string }> };

/**
 * The client is back from Stripe with ?session_id=. This confirms the payment on
 * its own, without waiting for the webhook, which the Stripe dashboard may not be
 * sending for checkout sessions yet.
 *
 * Nothing from the browser is trusted but the session id: the session is read
 * from Stripe with our key, and it must belong to this order and be paid. The
 * ATS then checks the amount and is idempotent per session, so this and the
 * webhook can both arrive without anything happening twice.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!isOrderToken(token)) return noStoreJson({ ok: false, error: norwegianError(404) }, { status: 404 });
  const rate = getRateLimitResult(request, "job-ads-confirm", 20, 10 * 60 * 1000);
  if (rate.limited) return noStoreJson({ ok: false, error: norwegianError(429) }, { status: 429 });

  let body: { sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ ok: false, error: norwegianError(400) }, { status: 400 });
  }
  const sessionId = String(body.sessionId ?? "").trim();
  if (!/^cs_[A-Za-z0-9_]{8,250}$/.test(sessionId)) {
    return noStoreJson({ ok: false, error: "Ugyldig betalingsreferanse." }, { status: 400 });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return noStoreJson({ ok: false, error: norwegianError(503) }, { status: 503 });

  let session: Stripe.Checkout.Session;
  try {
    session = await new Stripe(secret).checkout.sessions.retrieve(sessionId);
  } catch (error) {
    await notifyError({ route: "/api/job-ads/[token]/confirm", error });
    return noStoreJson({ ok: false, error: "Vi fikk ikke bekreftet betalingen akkurat nå. Last inn siden på nytt om litt." }, { status: 502 });
  }

  if (session.metadata?.order_token !== token) {
    return noStoreJson({ ok: false, error: "Betalingen hører ikke til denne bestillingen." }, { status: 400 });
  }
  const paid = jobAdPaidFromSession(session);
  if (!paid) {
    // Not paid (yet, or cancelled): show the order as it stands.
    const current = await getOrder(token);
    return noStoreJson(
      { ok: false, error: "Betalingen er ikke fullført. Dere kan prøve igjen nedenfor.", order: current.ok ? current.data : undefined },
      { status: 402 },
    );
  }

  const r = await markOrderPaid(paid.token, paid.paid);
  if (!r.ok) {
    if (r.status >= 500 || r.status === 409) {
      await notifyError({ route: "/api/job-ads/[token]/confirm", error: `ATS refused a paid session: ${r.status} ${r.error}` });
    }
    const current = await getOrder(token);
    return noStoreJson(
      { ok: false, error: norwegianError(r.status, r.error), order: current.ok ? current.data : undefined },
      { status: r.status },
    );
  }
  return noStoreJson({ ok: true, order: r.data });
}
