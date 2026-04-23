import "server-only";

import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripeServerClient(): Stripe {
  if (stripeSingleton) return stripeSingleton;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripeSingleton = new Stripe(secretKey);
  return stripeSingleton;
}
