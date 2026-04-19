import type { Metadata } from "next";
import DsbExitDiscountPopup from "@/components/dsb/DsbExitDiscountPopup";
import DsbGuideCheckoutEU from "@/components/dsb/DsbGuideCheckoutEU";

export const metadata: Metadata = {
  title: "DSB Guide for EU/EEA Electricians in Norway · 15 EUR",
  description: "EU/EEA DSB authorization guide for Norway with faster process and secure one-time access.",
};

export default function DsbSupportEuPage() {
  return (
    <>
      <DsbGuideCheckoutEU />
      <DsbExitDiscountPopup guideType="eu" />
    </>
  );
}
