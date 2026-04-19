"use server";

import { cookies } from "next/headers";
import Stripe from "stripe";

import { signPremiumJwt } from "@/lib/premium/jwt";
import { upsertSubscriberAfterCheckout } from "@/lib/premium/subscribers";

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  };
}

export async function finalizePremiumCheckoutSession(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return { ok: false, error: "Stripe is not configured." };

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });

  if (session.payment_status !== "paid") {
    return { ok: false, error: "Payment not completed." };
  }

  const email = (session.customer_details?.email || session.metadata?.premium_email || "")
    .trim()
    .toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "No email on checkout session." };
  }

  const sub = session.subscription as Stripe.Subscription | null;
  const plan = session.metadata?.premium_plan === "annual" ? "annual" : "monthly";
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;

  const ok = await upsertSubscriberAfterCheckout({
    email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub?.id ?? null,
    plan,
  });
  if (!ok) return { ok: false, error: "Could not save subscription." };

  const token = await signPremiumJwt({ email, plan, expiresIn: "30d" });
  const store = await cookies();
  store.set("premium_token", token, cookieOptions(60 * 60 * 24 * 30));
  return { ok: true };
}
