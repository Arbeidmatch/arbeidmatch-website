"use client";

import DsbGuideCheckoutMobileLayout from "@/components/dsb/DsbGuideCheckoutMobileLayout";

/**
 * Non-EU DSB sales shell (optional): when `DSB_PAYMENT_ENABLED` is true, CTA calls the dsb-guide session API.
 * Default BETA: guides are served free from `/dsb-support/non-eu`.
 */
export default function DsbGuideCheckoutNonEU() {
  return <DsbGuideCheckoutMobileLayout variant="non-eu" />;
}
