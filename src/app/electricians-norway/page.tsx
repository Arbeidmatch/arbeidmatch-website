import type { Metadata } from "next";
import { Suspense } from "react";

import ElectriciansNorwayPage from "@/components/candidates/ElectriciansNorwayPage";

const SITE = "https://www.arbeidmatch.no";

export const metadata: Metadata = {
  title: { absolute: "Work as an electrician in Norway | EU/EEA & DSB | ArbeidMatch" },
  description:
    "High demand and strong pay for qualified EU/EEA electricians in Norway. Create your profile, get matched with employers, or use our DSB authorisation guide.",
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
    title: "Work as an electrician in Norway | ArbeidMatch",
    description:
      "EU/EEA electricians: build your profile, get matched with Norwegian employers, and prepare DSB authorisation with our guide.",
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: `${SITE}/electricians-norway`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Work as an electrician in Norway | ArbeidMatch",
    description:
      "Profiles, employer matches, and DSB guidance for EU/EEA electricians who want to work in Norway.",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ElectriciansNorwayPage />
    </Suspense>
  );
}
