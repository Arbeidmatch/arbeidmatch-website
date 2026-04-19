import { randomUUID } from "crypto";
import Stripe from "stripe";

import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { getPublicBaseUrl, resolveStripePriceId, type DsbGuideSlug } from "@/lib/dsbGuideAccess";

export async function createDsbGuideStripeCheckout(params: {
  guideSlug: DsbGuideSlug;
  /** When omitted, Stripe Checkout collects email; webhook fills purchase row. */
  email?: string;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  const { guideSlug, email } = params;
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Payment is not configured." };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, error: "Database is not configured." };
  }

  const euPriceEnv = process.env.STRIPE_PRICE_ID_DSB_EU?.trim();
  const nonEuPriceEnv = process.env.STRIPE_PRICE_ID_DSB_NON_EU?.trim();
  if (!euPriceEnv || !nonEuPriceEnv) {
    throw new Error("Missing Stripe price IDs in environment variables");
  }

  const { data: guide, error: guideError } = await supabase
    .from("dsb_guides")
    .select("slug, stripe_price_id, title")
    .eq("slug", guideSlug)
    .maybeSingle();

  if (guideError || !guide) {
    return { ok: false, error: "Guide not found." };
  }

  const priceId = resolveStripePriceId(guideSlug, guide.stripe_price_id as string);
  if (!priceId?.startsWith("price_")) {
    return {
      ok: false,
      error: "Stripe price is not configured. Set STRIPE_PRICE_ID_DSB_EU / NON_EU or dsb_guides.stripe_price_id.",
    };
  }

  const accessToken = randomUUID();
  const baseUrl = getPublicBaseUrl();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const stripe = new Stripe(secret);
  const supportPath = guideSlug === "non-eu" ? "non-eu" : "eu";
  const expiresAtUnix = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const couponName = guideSlug === "eu" ? "DSB EU Guide - Special Offer" : "DSB NON-EU Guide - Special Offer";

  // One unique Stripe coupon per checkout customer, valid 7 days, one redemption.
  const couponMetadata: Record<string, string> = {
    guide_type: guideSlug,
    created_for: normalizedEmail || "stripe_checkout",
  };
  if (normalizedEmail) {
    couponMetadata.email = normalizedEmail;
  }

  const coupon = await stripe.coupons.create({
    amount_off: 1200,
    currency: "eur",
    duration: "once",
    max_redemptions: 1,
    redeem_by: expiresAtUnix,
    name: couponName,
    metadata: couponMetadata,
  });

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dsb-guide/${guideSlug}?token=${encodeURIComponent(accessToken)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dsb-support/${supportPath}`,
    /** Required when using `discounts`; mutual exclusion with customer-entered promotion codes. */
    allow_promotion_codes: false,
    discounts: [{ coupon: coupon.id }],
    metadata: {
      guide_slug: guideSlug,
      email: normalizedEmail,
      access_token: accessToken,
      discount_coupon: coupon.id,
    },
  };

  if (normalizedEmail) {
    sessionParams.customer_email = normalizedEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.id || !session.url) {
    return { ok: false, error: "Could not start checkout." };
  }

  const { error: insertError } = await supabase.from("dsb_guide_purchases").insert({
    guide_slug: guideSlug,
    email: normalizedEmail || "",
    stripe_session_id: session.id,
    stripe_payment_status: "pending",
    access_token: accessToken,
    token_expires_at: expiresAt,
  });

  if (insertError) {
    console.error("[dsbGuideCheckout] insert failed:", insertError.message);
    return { ok: false, error: "Could not save purchase. Please contact support." };
  }

  return { ok: true, checkoutUrl: session.url };
}
