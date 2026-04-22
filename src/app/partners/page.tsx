import type { Metadata } from "next";

import PartnersPageClient from "@/components/partners/PartnersPageClient";

export const metadata: Metadata = {
  title: "Partners | ArbeidMatch Norway",
  description:
    "Join ArbeidMatch as a trusted partner: accounting, translation, language training, accommodation, construction, and legal services for EU/EEA workers and Norwegian employers.",
};

export default function PartnersPage() {
  return <PartnersPageClient />;
}
