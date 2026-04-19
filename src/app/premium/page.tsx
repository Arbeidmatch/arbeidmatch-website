import type { Metadata } from "next";
import { Suspense } from "react";

import PremiumLandingPage from "@/components/premium/PremiumLandingPage";

const canonical = "https://www.arbeidmatch.no/premium";

export const metadata: Metadata = {
  title: "ArbeidMatch Premium | Guides for EU/EEA Workers and Employers in Norway",
  description:
    "ArbeidMatch Premium is coming soon. Register to be notified at launch and receive an exclusive early access offer.",
  alternates: { canonical },
  openGraph: {
    title: "ArbeidMatch Premium | Guides for EU/EEA Workers and Employers in Norway",
    description:
      "ArbeidMatch Premium is coming soon. Register to be notified at launch and receive an exclusive early access offer.",
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
