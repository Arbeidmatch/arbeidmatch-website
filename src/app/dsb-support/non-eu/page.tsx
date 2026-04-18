import type { Metadata } from "next";
import DsbGuideCheckoutNonEU from "@/components/dsb/DsbGuideCheckoutNonEU";

export const metadata: Metadata = {
  title: "DSB Guide for Non-EU Electricians in Norway · 39 EUR",
  description: "Non-EU DSB authorization guide for Norway with visa and assessment guidance, secure one-time access.",
};

export default function DsbSupportNonEuPage() {
  return <DsbGuideCheckoutNonEU />;
}
