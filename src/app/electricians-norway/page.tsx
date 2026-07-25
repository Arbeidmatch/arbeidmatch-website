import type { Metadata } from "next";

import ElectriciansNorwayPage from "@/components/candidates/ElectriciansNorwayPage";

const SITE = "https://www.arbeidmatch.no";

export const metadata: Metadata = {
  title: { absolute: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch" },
  description:
    "Electrician jobs in Norway for EU/EEA tradespeople: what the work involves, what to have ready before you apply, pay expectations, and open roles.",
  // No hreflang alternates: this page exists only in English. The previous map pointed the
  // Romanian and Polish alternates at the site's language home pages, which are different pages.
  alternates: {
    canonical: `${SITE}/electricians-norway`,
  },
  openGraph: {
    title: "Work as an Electrician in Norway | EU/EEA Guide | ArbeidMatch",
    description:
      "EU/EEA electricians: learn what you need to work legally in Norway. DSB authorization, required documents, salary ranges, and job opportunities.",
    // The page is written in English; declaring nb_NO misdescribed it to crawlers and previews.
    locale: "en_GB",
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
