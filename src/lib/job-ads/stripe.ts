import type Stripe from "stripe";

import { isOrderToken, PACKAGE_NAMES, type PublicOrderView } from "./types";

/**
 * Card payment for a paid advert, on the site's existing Stripe account.
 *
 * One Checkout Session per attempt, in NOK, for exactly the total the ATS froze
 * in order.chosen.quote (VAT included). The session carries the order token in
 * its metadata, which is how both confirmation paths (the webhook and the return
 * to the order page) find the order again, and the only thing either trusts.
 */

export const JOB_AD_KIND = "job_ad";

/** Stripe's shortest allowed lifetime for a Checkout Session. */
const CHECKOUT_TTL_SECONDS = 30 * 60;

/** Øre, as Stripe counts and as the ATS checks: round(totalNok * 100). */
export function totalInOre(order: Pick<PublicOrderView, "chosen">): number | null {
  const total = order.chosen?.quote?.totalNok;
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) return null;
  return Math.round(total * 100);
}

export function jobAdCheckoutParams(input: {
  order: PublicOrderView;
  token: string;
  baseUrl: string;
}): Stripe.Checkout.SessionCreateParams | null {
  const { order, token, baseUrl } = input;
  const amount = totalInOre(order);
  const pkg = order.chosen?.package;
  if (!amount || !pkg || !isOrderToken(token)) return null;

  const title = String(order.advert?.title ?? "").trim() || "stilling";
  const name = `Stillingsannonse: ${title}, pakke ${PACKAGE_NAMES[pkg]}`.slice(0, 250);
  const email = String(order.advert?.contact?.email ?? "").trim();
  // What the session was opened for travels with it: the page may freeze a
  // newer choice while this checkout is still open, and the ATS accepts the
  // payment for the choice it was actually made for.
  const addons = [...(order.chosen?.addons ?? [])].sort().join(",");
  const metadata = { kind: JOB_AD_KIND, order_token: token, package: pkg, addons };

  return {
    mode: "payment",
    locale: "nb",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "nok",
          unit_amount: amount,
          product_data: { name, description: "inkl. 25 % mva" },
        },
      },
    ],
    ...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { customer_email: email } : {}),
    metadata,
    payment_intent_data: { metadata },
    // Never left open for a day: an old checkout paid after the order moved on is money to refund.
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SECONDS,
    success_url: `${baseUrl}/annonse/${token}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/annonse/${token}`,
  };
}

export type JobAdPaid = {
  token: string;
  paid: { sessionId: string; amountTotal: number; currency: string; selection?: { package: string; addons: string[] } };
};

/**
 * The `paid` call for the ATS, from a completed Checkout Session, or null when
 * the session is not a paid advert.
 *
 * The same webhook receives the Premium subscription checkouts; those carry no
 * `kind`, and must pass through untouched. Only a session we created for an
 * advert, and only once Stripe says the money is in, is forwarded.
 */
export function jobAdPaidFromSession(
  session: Pick<Stripe.Checkout.Session, "id" | "metadata" | "payment_status" | "amount_total" | "currency">,
): JobAdPaid | null {
  if (session.metadata?.kind !== JOB_AD_KIND) return null;
  if (session.payment_status !== "paid") return null;
  const token = session.metadata?.order_token;
  if (!isOrderToken(token)) return null;
  if (typeof session.amount_total !== "number" || !session.currency) return null;
  const pkg = session.metadata?.package;
  const selection = pkg
    ? { package: pkg, addons: String(session.metadata?.addons ?? "").split(",").map((a) => a.trim()).filter(Boolean) }
    : undefined;
  return {
    token,
    paid: { sessionId: session.id, amountTotal: session.amount_total, currency: session.currency, ...(selection ? { selection } : {}) },
  };
}

type SessionLister = {
  checkout: {
    sessions: {
      list: Stripe["checkout"]["sessions"]["list"];
      expire: Stripe["checkout"]["sessions"]["expire"];
    };
  };
};

/**
 * Close every checkout still open for this order, before a new one is opened
 * or the order is invoiced.
 *
 * Without it a client could leave a checkout open, go back, pick invoice or
 * other add-ons, and then pay the old checkout: money taken for an order that
 * no longer waits for it. Sessions live at most CHECKOUT_TTL_SECONDS, so the
 * last day covers them all. `failed` counts sessions that could not be closed
 * (most often one being paid at this very moment); the caller must not go on.
 */
export async function expireOpenJobAdSessions(stripe: SessionLister, token: string): Promise<{ expired: number; failed: number }> {
  let expired = 0;
  let failed = 0;
  const since = Math.floor(Date.now() / 1000) - 86_400;
  for await (const s of stripe.checkout.sessions.list({ status: "open", created: { gte: since }, limit: 100 })) {
    if (s.metadata?.kind !== JOB_AD_KIND || s.metadata?.order_token !== token) continue;
    try {
      await stripe.checkout.sessions.expire(s.id);
      expired++;
    } catch {
      failed++;
    }
  }
  return { expired, failed };
}
