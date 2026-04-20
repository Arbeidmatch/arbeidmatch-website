import { NextRequest, NextResponse } from "next/server";

import { createDsbGuideStripeCheckout } from "@/lib/dsbGuideCheckout";
import { notifyError } from "@/lib/errorNotifier";
import { isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

type Body = {
  guideType?: string;
  withDiscount?: boolean;
};

export async function POST(req: NextRequest) {
  let guideTypeForNotify: string | undefined;
  try {
    if (isRateLimited(req, "dsb-guide-checkout", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = (await req.json()) as Body;
    const guideType = body.guideType?.trim();
    const withDiscount = body.withDiscount === true;
    guideTypeForNotify = guideType;

    if (guideType !== "eu" && guideType !== "non-eu") {
      return NextResponse.json({ error: "Missing guide type" }, { status: 400 });
    }

    const result = await createDsbGuideStripeCheckout({ guideSlug: guideType, withDiscount });

    if (!result.ok) {
      console.error("DSB Checkout failed:", { error: result.error, details: result.details });
      return NextResponse.json(
        {
          error: result.error,
          details: result.details,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: result.checkoutUrl });
  } catch (error) {
    console.error("DSB Checkout error details:", {
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    await notifyError({
      route: "/api/dsb-guide/checkout",
      error,
      context: {
        guideType: guideTypeForNotify || "unknown",
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      {
        error: "Something went wrong",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
