import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DsbExitDiscountPopup from "@/components/dsb/DsbExitDiscountPopup";
import DsbGuideCheckoutNonEU from "@/components/dsb/DsbGuideCheckoutNonEU";
import { DSB_SUPPORT_AVAILABLE, DSB_PRODUCTS_AVAILABLE } from "@/lib/dsbAvailability";

export const metadata: Metadata = {
  title: "DSB Guide for Non-EU Electricians in Norway · 39 EUR",
  description: "Non-EU DSB authorization guide for Norway with visa and assessment guidance, secure one-time access.",
};

export default function DsbSupportNonEuPage() {
  if (!DSB_SUPPORT_AVAILABLE || !DSB_PRODUCTS_AVAILABLE) {
    notFound();
  }

  return (
    <>
      <DsbGuideCheckoutNonEU />
      <DsbExitDiscountPopup guideType="non-eu" />
    </>
  );
}
