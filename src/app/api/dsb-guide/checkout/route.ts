import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { getPublicBaseUrl, resolveStripePriceId, type DsbGuideSlug } from "@/lib/dsbGuideAccess";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

type Body = {
  guide_slug?: string;
  email?: string;
  website?: string;
};

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(raw)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "dsb-guide-checkout", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = raw as Body;
    const guideSlug = body.guide_slug?.trim();
    const email = body.email?.trim().toLowerCase();

    if (guideSlug !== "eu" && guideSlug !== "non-eu") {
      return NextResponse.json({ success: false, error: "Invalid guide." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ success: false, error: "Payment is not configured." }, { status: 500 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const { data: guide, error: guideError } = await supabase
      .from("dsb_guides")
      .select("slug, stripe_price_id, title")
      .eq("slug", guideSlug)
      .maybeSingle();

    if (guideError || !guide) {
      return NextResponse.json({ success: false, error: "Guide not found." }, { status: 404 });
    }

    const priceId = resolveStripePriceId(guideSlug as DsbGuideSlug, guide.stripe_price_id as string);
    if (!priceId?.startsWith("price_")) {
      return NextResponse.json(
        { success: false, error: "Stripe price is not configured. Set STRIPE_PRICE_ID_DSB_EU / NON_EU or dsb_guides.stripe_price_id." },
        { status: 500 },
      );
    }

    const accessToken = randomUUID();
    const baseUrl = getPublicBaseUrl();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dsb-guide/${guideSlug}?token=${encodeURIComponent(accessToken)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dsb-support`,
      customer_email: email,
      metadata: {
        guide_slug: guideSlug,
        email,
        access_token: accessToken,
      },
    });

    if (!session.id || !session.url) {
      return NextResponse.json({ success: false, error: "Could not start checkout." }, { status: 500 });
    }

    const { error: insertError } = await supabase.from("dsb_guide_purchases").insert({
      guide_slug: guideSlug,
      email,
      stripe_session_id: session.id,
      stripe_payment_status: "pending",
      access_token: accessToken,
      token_expires_at: expiresAt,
    });

    if (insertError) {
      console.error("[dsb-guide/checkout] insert failed:", insertError.message);
      return NextResponse.json({ success: false, error: "Could not save purchase. Please contact support." }, { status: 500 });
    }

    return NextResponse.json({ success: true, checkout_url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[dsb-guide/checkout]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
