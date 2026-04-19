import { randomUUID } from "crypto";
import Stripe from "stripe";

import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { getPublicBaseUrl, resolveStripePriceId, type DsbGuideSlug } from "@/lib/dsbGuideAccess";

export type DsbGuideCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; error: string; details?: string };

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function createDsbGuideStripeCheckout(params: {
  guideSlug: DsbGuideSlug;
  /** When omitted, Stripe Checkout collects email; webhook fills purchase row. */
  email?: string;
}): Promise<DsbGuideCheckoutResult> {
  const { guideSlug, email } = params;
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    return {
      ok: false,
      error: "Payment is not configured.",
      details: "STRIPE_SECRET_KEY is missing.",
    };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return {
      ok: false,
      error: "Database is not configured.",
      details: "Supabase service client is not available.",
    };
  }

  const { data: guide, error: guideError } = await supabase
    .from("dsb_guides")
    .select("slug, stripe_price_id, title")
    .eq("slug", guideSlug)
    .maybeSingle();

  if (guideError || !guide) {
    return {
      ok: false,
      error: "Guide not found.",
      details: guideError?.message || `No row in dsb_guides for slug "${guideSlug}".`,
    };
  }

  const priceId = resolveStripePriceId(guideSlug, guide.stripe_price_id as string);
  if (!priceId?.startsWith("price_")) {
    const envHint =
      guideSlug === "eu"
        ? "Set STRIPE_PRICE_ID_DSB_EU (or a valid price_ in dsb_guides.stripe_price_id for slug eu)."
        : "Set STRIPE_PRICE_ID_DSB_NON_EU (or a valid price_ in dsb_guides.stripe_price_id for slug non-eu).";
    return {
      ok: false,
      error: "Stripe price is not configured.",
      details: `Resolved price ID is missing or invalid. ${envHint}`,
    };
  }

  const baseUrl = getPublicBaseUrl();
  console.log("[dsbGuideCheckout] Checkout request:", {
    guideSlug,
    priceId,
    baseUrl,
    hasSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
    hasBaseUrl: Boolean(process.env.NEXT_PUBLIC_BASE_URL?.trim()),
  });

  const accessToken = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const stripe = new Stripe(secret);
  const supportPath = guideSlug === "non-eu" ? "non-eu" : "eu";
  const expiresAtUnix = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const couponName = guideSlug === "eu" ? "DSB EU Guide - Special Offer" : "DSB NON-EU Guide - Special Offer";

  let couponId: string | undefined;
  try {
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
    couponId = coupon.id;
  } catch (couponErr) {
    console.error("[dsbGuideCheckout] Coupon create failed, checkout will continue without auto-discount:", errMessage(couponErr));
    couponId = undefined;
  }

  const baseMeta: Record<string, string> = {
    guide_slug: guideSlug,
    email: normalizedEmail,
    access_token: accessToken,
  };

  const buildSessionParams = (opts: { withCoupon: boolean }): Stripe.Checkout.SessionCreateParams => {
    const metadata: Record<string, string> = { ...baseMeta };
    if (opts.withCoupon && couponId) {
      metadata.discount_coupon = couponId;
    }

    const p: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dsb-guide/${guideSlug}?token=${encodeURIComponent(accessToken)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dsb-support/${supportPath}`,
      metadata,
    };

    if (opts.withCoupon && couponId) {
      p.allow_promotion_codes = false;
      p.discounts = [{ coupon: couponId }];
    } else {
      p.allow_promotion_codes = true;
    }

    if (normalizedEmail) {
      p.customer_email = normalizedEmail;
    }

    return p;
  };

  let session: Stripe.Checkout.Session;
  const tryWithCoupon = Boolean(couponId);

  try {
    session = await stripe.checkout.sessions.create(buildSessionParams({ withCoupon: tryWithCoupon }));
  } catch (firstErr) {
    const firstMsg = errMessage(firstErr);
    console.error("[dsbGuideCheckout] checkout.sessions.create failed:", firstMsg);

    if (tryWithCoupon) {
      try {
        console.warn("[dsbGuideCheckout] Retrying Stripe Checkout without coupon / with promotion codes allowed.");
        session = await stripe.checkout.sessions.create(buildSessionParams({ withCoupon: false }));
      } catch (secondErr) {
        return {
          ok: false,
          error: "Could not start checkout.",
          details: errMessage(secondErr),
        };
      }
    } else {
      return {
        ok: false,
        error: "Could not start checkout.",
        details: firstMsg,
      };
    }
  }

  if (!session.id || !session.url) {
    return { ok: false, error: "Could not start checkout.", details: "Stripe returned no session URL." };
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
    return {
      ok: false,
      error: "Could not save purchase. Please contact support.",
      details: insertError.message,
    };
  }

  return { ok: true, checkoutUrl: session.url };
}
