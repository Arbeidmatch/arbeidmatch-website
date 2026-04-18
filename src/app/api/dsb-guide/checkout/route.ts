import { NextRequest, NextResponse } from "next/server";

import { createDsbGuideStripeCheckout } from "@/lib/dsbGuideCheckout";
import type { DsbGuideSlug } from "@/lib/dsbGuideAccess";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

type Body = {
  guide_slug?: string;
  email?: string;
  website?: string;
  coupon_code?: string;
};

/** Legacy direct-checkout endpoint (prefer verify-email + /dsb-support/verify flow). */
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

    const coupon = typeof body.coupon_code === "string" ? body.coupon_code : undefined;

    const result = await createDsbGuideStripeCheckout({
      guideSlug: guideSlug as DsbGuideSlug,
      email,
      couponCode: coupon,
    });

    if (!result.ok) {
      const status = result.error === "Guide not found." ? 404 : 500;
      return NextResponse.json({ success: false, error: result.error }, { status });
    }

    return NextResponse.json({ success: true, checkout_url: result.checkoutUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[dsb-guide/checkout]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
