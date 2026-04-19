import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getPublicBaseUrl } from "@/lib/premium/stripeEnv";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

interface Body {
  email?: string;
  plan?: "monthly" | "annual";
  withDiscount?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "premium-checkout", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Payment is not configured." }, { status: 503 });
    }

    const monthly = process.env.STRIPE_MONTHLY_PRICE_ID?.trim();
    const annual = process.env.STRIPE_ANNUAL_PRICE_ID?.trim();
    const coupon = process.env.STRIPE_LAUNCH50_COUPON_ID?.trim();

    const body = (await request.json()) as Body;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const plan = body.plan === "annual" ? "annual" : "monthly";
    const withDiscount = Boolean(body.withDiscount);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const priceId = plan === "annual" ? annual : monthly;
    if (!priceId?.startsWith("price_")) {
      return NextResponse.json(
        { error: "Stripe price IDs are not configured. Set STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID." },
        { status: 503 },
      );
    }

    if (withDiscount && !coupon) {
      return NextResponse.json(
        { error: "Discount coupon is not configured. Set STRIPE_LAUNCH50_COUPON_ID (Stripe coupon id)." },
        { status: 503 },
      );
    }

    const stripe = new Stripe(secret);
    const base = getPublicBaseUrl();

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${base}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/premium`,
      metadata: {
        premium_email: email,
        premium_plan: plan,
      },
      subscription_data: {
        metadata: {
          premium_email: email,
          premium_plan: plan,
        },
      },
    };

    if (withDiscount && coupon) {
      sessionParams.discounts = [{ coupon }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      return NextResponse.json({ error: "Could not create checkout session." }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[premium/create-checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
