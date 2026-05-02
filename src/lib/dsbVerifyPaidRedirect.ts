import { redirect } from "next/navigation";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { verifyDsbEmailVerifyToken } from "@/lib/dsbEmailVerifyToken";
import { createDsbGuideStripeCheckout } from "@/lib/dsbGuideCheckout";

/**
 * Email verify link: when DSB_PAYMENT_ENABLED is true, continues to card collection (external).
 */
export async function redirectAfterDsbEmailVerifyToken(token: string): Promise<never> {
  const payload = verifyDsbEmailVerifyToken(token);
  if (!payload) {
    redirect("/dsb-support/eu?error=link_expired");
  }

  let result: Awaited<ReturnType<typeof createDsbGuideStripeCheckout>>;
  try {
    result = await createDsbGuideStripeCheckout({
      guideSlug: payload.guide_slug,
      email: payload.email,
    });
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("[dsbVerifyPaidRedirect] session error:", err);
    redirect("/dsb-support/eu?error=session_failed");
  }

  if (!result.ok) {
    console.error("[dsbVerifyPaidRedirect] paid session failed:", result.error);
    redirect("/dsb-support/eu?error=session_failed");
  }

  redirect(result.checkoutUrl);
}
