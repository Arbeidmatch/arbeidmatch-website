import Stripe from "stripe";

export type DsbDiscountGuideType = "eu" | "non-eu";

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

/** EU: €15 → €11 (−€4). Non-EU: €39 → €29 (−€10). Amounts in EUR cents. */
export function getDiscountAmountCents(guideType: DsbDiscountGuideType): number {
  return guideType === "eu" ? 400 : 1000;
}

function randomCouponSuffix(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function buildCouponId(guideType: DsbDiscountGuideType): string {
  const prefix = guideType === "eu" ? "AM-EU" : "AM-NEU";
  return `${prefix}-${randomCouponSuffix()}`;
}

/**
 * Creates a unique one-time Stripe coupon for this email/guide.
 * Retries on id collision (rare).
 */
export async function createDiscountCoupon(
  email: string,
  guideType: DsbDiscountGuideType,
): Promise<{ couponCode: string; expiresAt: Date } | null> {
  const stripe = getStripe();
  if (!stripe) {
    console.error("[Stripe Coupon] STRIPE_SECRET_KEY missing");
    return null;
  }

  const discountAmount = getDiscountAmountCents(guideType);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const redeemBy = Math.floor(expiresAt.getTime() / 1000);
  const name =
    guideType === "eu" ? "DSB EU Guide - Special Offer" : "DSB Non-EU Guide - Special Offer";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const couponId = buildCouponId(guideType);
    try {
      await stripe.coupons.create({
        id: couponId,
        amount_off: discountAmount,
        currency: "eur",
        duration: "once",
        max_redemptions: 1,
        redeem_by: redeemBy,
        name,
        metadata: {
          email: email.trim().toLowerCase(),
          guide_type: guideType,
          created_for: email.trim().toLowerCase(),
        },
      });
      return { couponCode: couponId, expiresAt };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists") || msg.includes("resource_already_exists")) {
        continue;
      }
      console.error("[Stripe Coupon] Failed:", err);
      return null;
    }
  }

  console.error("[Stripe Coupon] Too many id collisions");
  return null;
}
