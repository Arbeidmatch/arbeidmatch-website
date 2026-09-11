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
  const metadata = { kind: JOB_AD_KIND, order_token: token };

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
    success_url: `${baseUrl}/annonse/${token}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/annonse/${token}`,
  };
}

export type JobAdPaid = {
  token: string;
  paid: { sessionId: string; amountTotal: number; currency: string };
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
  return {
    token,
    paid: { sessionId: session.id, amountTotal: session.amount_total, currency: session.currency },
  };
}
