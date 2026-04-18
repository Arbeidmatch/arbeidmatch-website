import { randomUUID } from "crypto";
import Stripe from "stripe";

import { validateCouponForCheckout } from "@/lib/dsbDiscountLeads";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { getPublicBaseUrl, resolveStripePriceId, type DsbGuideSlug } from "@/lib/dsbGuideAccess";

export async function createDsbGuideStripeCheckout(params: {
  guideSlug: DsbGuideSlug;
  email: string;
  couponCode?: string | null;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  const { guideSlug, email, couponCode } = params;
  const normalizedEmail = email.trim().toLowerCase();

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return { ok: false, error: "Payment is not configured." };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { ok: false, error: "Database is not configured." };
  }

  console.log("[Verify] Looking up guide in DB...");
  const { data: guide, error: guideError } = await supabase
    .from("dsb_guides")
    .select("slug, stripe_price_id, title")
    .eq("slug", guideSlug)
    .maybeSingle();

  if (guideError || !guide) {
    return { ok: false, error: "Guide not found." };
  }

  const priceId = resolveStripePriceId(guideSlug, guide.stripe_price_id as string);
  if (guideSlug === "non-eu") {
    console.log("[Verify] Non-EU Stripe price ID resolved:", priceId);
  }
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

  const trimmedCoupon = couponCode?.trim() || "";
  let appliedCoupon = "";
  if (trimmedCoupon) {
    const ok = await validateCouponForCheckout(supabase, normalizedEmail, guideSlug, trimmedCoupon);
    if (!ok) {
      return { ok: false, error: "This discount code is invalid, expired, or does not match this email." };
    }
    appliedCoupon = trimmedCoupon;
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dsb-guide/${guideSlug}?token=${encodeURIComponent(accessToken)}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dsb-support/${supportPath}`,
    customer_email: normalizedEmail,
    /** Required when using `discounts`; mutual exclusion with customer-entered promotion codes. */
    allow_promotion_codes: false,
    metadata: {
      guide_slug: guideSlug,
      email: normalizedEmail,
      access_token: accessToken,
      discount_coupon: appliedCoupon,
    },
  };

  if (appliedCoupon) {
    sessionParams.discounts = [{ coupon: appliedCoupon }];
  }

  console.log("[Checkout] Coupon code received:", couponCode ?? "(none)");
  console.log(
    "[Checkout] Discounts applied:",
    appliedCoupon ? [{ coupon: appliedCoupon }] : "none",
  );

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.id || !session.url) {
    return { ok: false, error: "Could not start checkout." };
  }

  const { error: insertError } = await supabase.from("dsb_guide_purchases").insert({
    guide_slug: guideSlug,
    email: normalizedEmail,
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
