import { redirect } from "next/navigation";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { verifyDsbEmailVerifyToken } from "@/lib/dsbEmailVerifyToken";
import { createDsbGuideStripeCheckout } from "@/lib/dsbGuideCheckout";

export const dynamic = "force-dynamic";

export default async function DsbSupportVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  try {
    const params = await searchParams;
    const token = params.token?.trim();

    console.log("[Verify Page] Token received:", !!params.token);
    console.log("[Verify Page] Starting verification...");

    if (!token) {
      redirect("/dsb-support/eu?error=link_expired");
    }

    const payload = verifyDsbEmailVerifyToken(token);
    console.log("[Verify Page] Payload decoded:", !!payload);
    console.log("[Verify Page] Guide slug:", payload?.guide_slug);
    console.log("[Verify Page] Coupon:", payload?.coupon_code);

    if (!payload) {
      redirect("/dsb-support/eu?error=link_expired");
    }

    const couponFromToken =
      typeof payload.coupon_code === "string" && payload.coupon_code.trim()
        ? payload.coupon_code.trim()
        : undefined;

    console.log("[Verify Page] Creating Stripe session...");
    let result: Awaited<ReturnType<typeof createDsbGuideStripeCheckout>>;
    try {
      result = await createDsbGuideStripeCheckout({
        guideSlug: payload.guide_slug,
        email: payload.email,
        couponCode: couponFromToken,
      });
    } catch (stripeErr) {
      if (isRedirectError(stripeErr)) {
        throw stripeErr;
      }
      console.error("[Verify Page] Stripe session threw:", stripeErr);
      redirect("/dsb-support/eu?error=checkout_failed");
    }

    if (!result.ok) {
      console.error("[Verify Page] Checkout failed:", result.error);
      redirect("/dsb-support/eu?error=checkout_failed");
    }

    console.log("[Verify Page] Stripe URL:", result.checkoutUrl);
    redirect(result.checkoutUrl);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error("[Verify Page] Unexpected error:", error);
    redirect("/dsb-support?error=verify_error");
  }
}
