import type { Metadata } from "next";
import { Suspense } from "react";

import ElectriciansNorwayPage from "@/components/candidates/ElectriciansNorwayPage";

const SITE = "https://www.arbeidmatch.no";

export const metadata: Metadata = {
  title: { absolute: "DSB-authorised electricians for Norway | Employers & candidates | ArbeidMatch" },
  description:
    "ArbeidMatch connects Norwegian employers with EU/EEA electricians who hold or are obtaining DSB authorisation. Guides help candidates navigate the process.",
  alternates: {
    canonical: `${SITE}/electricians-norway`,
    languages: {
      nb: `${SITE}/electricians-norway`,
      en: `${SITE}/en`,
      ro: `${SITE}/ro`,
      pl: `${SITE}/pl`,
    },
  },
  openGraph: {
    title: "DSB-authorised electricians for Norway | ArbeidMatch",
    description:
      "Hire verified electricians for Norwegian projects, or get our DSB guide as a candidate. ArbeidMatch recruitment and guidance.",
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: `${SITE}/electricians-norway`,
  },
  twitter: {
    card: "summary_large_image",
    title: "DSB-authorised electricians for Norway | ArbeidMatch",
    description:
      "Employers: request authorised candidates. Candidates: DSB guides and support from ArbeidMatch.",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ElectriciansNorwayPage />
    </Suspense>
  );
}
