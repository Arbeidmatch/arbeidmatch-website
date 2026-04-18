import Link from "next/link";
import { redirect } from "next/navigation";

import { verifyDsbEmailVerifyToken } from "@/lib/dsbEmailVerifyToken";
import { createDsbGuideStripeCheckout } from "@/lib/dsbGuideCheckout";

export const dynamic = "force-dynamic";

export default async function DsbSupportVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    redirect("/dsb-support");
  }

  const payload = verifyDsbEmailVerifyToken(token);
  if (!payload) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-surface px-4 py-16 text-center">
        <p className="max-w-md text-navy">This verification link is invalid or has expired.</p>
        <Link href="/dsb-support" className="mt-6 text-sm font-medium text-gold hover:text-gold-hover">
          Back to DSB support
        </Link>
      </div>
    );
  }

  const couponFromToken =
    typeof payload.coupon_code === "string" && payload.coupon_code.trim()
      ? payload.coupon_code.trim()
      : undefined;
  console.log("[Checkout] Verify JWT coupon_code:", couponFromToken ?? "(absent)");

  const result = await createDsbGuideStripeCheckout({
    guideSlug: payload.guide_slug,
    email: payload.email,
    couponCode: couponFromToken,
  });

  if (!result.ok) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-surface px-4 py-16 text-center">
        <p className="max-w-md text-navy">{result.error}</p>
        <Link href="/dsb-support" className="mt-6 text-sm font-medium text-gold hover:text-gold-hover">
          Back to DSB support
        </Link>
      </div>
    );
  }

  redirect(result.checkoutUrl);
}
