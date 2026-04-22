import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DsbExitDiscountPopup from "@/components/dsb/DsbExitDiscountPopup";
import DsbGuideCheckoutEU from "@/components/dsb/DsbGuideCheckoutEU";
import { DSB_SUPPORT_AVAILABLE, DSB_PRODUCTS_AVAILABLE } from "@/lib/dsbAvailability";

export const metadata: Metadata = {
  title: "DSB Guide for EU/EEA Electricians in Norway · 15 EUR",
  description: "EU/EEA DSB authorization guide for Norway with faster process and secure one-time access.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function DsbSupportEuPage() {
  if (!DSB_SUPPORT_AVAILABLE || !DSB_PRODUCTS_AVAILABLE) {
    notFound();
  }

  return (
    <>
      <DsbGuideCheckoutEU />
      <DsbExitDiscountPopup guideType="eu" />
    </>
  );
}
