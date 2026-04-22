import type { Metadata } from "next";
import { Suspense } from "react";

import ElectriciansNorwayPage from "@/components/candidates/ElectriciansNorwayPage";
import ElectriciansDsbAuthorizationGuide from "@/components/candidates/ElectriciansDsbAuthorizationGuide";

const SITE = "https://www.arbeidmatch.no";

export const metadata: Metadata = {
  title: { absolute: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch" },
  description:
    "EU/EEA electricians: work legally in Norway — full DSB authorization guide, official resources, documents, timelines, salary ranges, and job opportunities in one place.",
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
    title: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch",
    description:
      "EU/EEA electricians: full DSB authorization guide for Norway, official resources, documents, salary ranges, and job opportunities.",
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: `${SITE}/electricians-norway`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch",
    description:
      "EU/EEA electricians: full DSB authorization guide for Norway, official resources, documents, salary ranges, and job opportunities.",
  },
};

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <ElectriciansNorwayPage />
      </Suspense>
      <ElectriciansDsbAuthorizationGuide />
    </>
  );
}
