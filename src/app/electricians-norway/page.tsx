import type { Metadata } from "next";

import ElectriciansNorwayPage from "@/components/candidates/ElectriciansNorwayPage";

const SITE = "https://www.arbeidmatch.no";

export const metadata: Metadata = {
  title: { absolute: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch" },
  description:
    "EU/EEA electricians: learn what you need to work legally in Norway. DSB authorization, required documents, salary ranges, and job opportunities.",
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
      "EU/EEA electricians: learn what you need to work legally in Norway. DSB authorization, required documents, salary ranges, and job opportunities.",
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: `${SITE}/electricians-norway`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch",
    description:
      "EU/EEA electricians: learn what you need to work legally in Norway. DSB authorization, required documents, salary ranges, and job opportunities.",
  },
};

export default function Page() {
  return <ElectriciansNorwayPage />;
}
