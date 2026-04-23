/**
 * Stripe product setup:
 * 1) Create Product "Growth" in Stripe dashboard.
 * 2) Create recurring monthly price NOK 1499 and copy the `price_...` id to STRIPE_GROWTH_PRICE_ID.
 * 3) Create Product "Scale" in Stripe dashboard.
 * 4) Create recurring monthly price NOK 3999 and copy the `price_...` id to STRIPE_SCALE_PRICE_ID.
 */
export const GROWTH_PRICE_ID = process.env.STRIPE_GROWTH_PRICE_ID?.trim() || "";
export const SCALE_PRICE_ID = process.env.STRIPE_SCALE_PRICE_ID?.trim() || "";

export function priceIdForPlan(plan: "growth" | "scale"): string {
  return plan === "growth" ? GROWTH_PRICE_ID : SCALE_PRICE_ID;
}
