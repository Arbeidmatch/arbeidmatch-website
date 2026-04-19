import { NextRequest, NextResponse } from "next/server";

import { createDsbGuideStripeCheckout } from "@/lib/dsbGuideCheckout";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

type Body = {
  guideType?: string;
};

export async function POST(req: NextRequest) {
  try {
    if (isRateLimited(req, "dsb-guide-checkout", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await req.json()) as Body;
    const guideType = body.guideType?.trim();

    if (guideType !== "eu" && guideType !== "non-eu") {
      return NextResponse.json({ error: "Missing guide type" }, { status: 400 });
    }

    const result = await createDsbGuideStripeCheckout({ guideSlug: guideType });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ url: result.checkoutUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[dsb-guide/checkout]", message);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
