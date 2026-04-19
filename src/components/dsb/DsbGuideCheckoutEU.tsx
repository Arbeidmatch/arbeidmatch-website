"use client";

import DsbGuideCheckoutMobilePremium from "@/components/dsb/DsbGuideCheckoutMobilePremium";

/**
 * EU DSB checkout page: no email field on this site. Primary CTA calls `/api/dsb-guide/checkout`
 * with `guideType: "eu"`, then redirects to Stripe Checkout (email and card collected there).
 */
export default function DsbGuideCheckoutEU() {
  return <DsbGuideCheckoutMobilePremium variant="eu" />;
}
