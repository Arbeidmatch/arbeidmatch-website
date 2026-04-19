"use client";

import DsbGuideCheckoutMobilePremium from "@/components/dsb/DsbGuideCheckoutMobilePremium";

/**
 * Non-EU DSB checkout page: no email field on this site. Primary CTA calls `/api/dsb-guide/checkout`
 * with `guideType: "non-eu"`, then redirects to Stripe Checkout (email and card collected there).
 */
export default function DsbGuideCheckoutNonEU() {
  return <DsbGuideCheckoutMobilePremium variant="non-eu" />;
}
