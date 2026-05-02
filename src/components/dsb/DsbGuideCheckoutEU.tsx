"use client";

import DsbGuideCheckoutMobileLayout from "@/components/dsb/DsbGuideCheckoutMobileLayout";

/**
 * EU DSB sales shell (optional): when `DSB_PAYMENT_ENABLED` is true, CTA calls the dsb-guide session API.
 * Default BETA: guides are served free from `/dsb-support/eu`.
 */
export default function DsbGuideCheckoutEU() {
  return <DsbGuideCheckoutMobileLayout variant="eu" />;
}
