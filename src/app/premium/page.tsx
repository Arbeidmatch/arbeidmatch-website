import type { Metadata } from "next";
import { Suspense } from "react";

import PremiumLandingPage from "@/components/premium/PremiumLandingPage";

const canonical = "https://www.arbeidmatch.no/premium";

export const metadata: Metadata = {
  title: "ArbeidMatch Premium | Guides for EU/EEA Workers and Employers in Norway",
  description:
    "In-depth English-language guides on Norwegian labor law, DSB approvals, tax registration, workers rights, and employment contracts. Start free for 24 hours.",
  alternates: { canonical },
  openGraph: {
    title: "ArbeidMatch Premium | Guides for EU/EEA Workers and Employers in Norway",
    description:
      "In-depth English-language guides on Norwegian labor law, DSB approvals, tax registration, workers rights, and employment contracts. Start free for 24 hours.",
    url: canonical,
    locale: "nb_NO",
    type: "website",
  },
};

export default function PremiumPage() {
  return (
    <Suspense
      fallback={<div className="min-h-[60vh] bg-[#0f1923]" aria-hidden />}
    >
      <PremiumLandingPage />
    </Suspense>
  );
}
