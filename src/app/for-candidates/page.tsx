import type { Metadata } from "next";

import ForCandidates from "@/components/site/candidates/ForCandidates";

const TITLE = "Find work in Norway | ArbeidMatch";
const DESCRIPTION =
  "Jobs with Norwegian employers for tradespeople from the EU and EEA. What we ask for, how applying works and who employs you.";

export const metadata: Metadata = {
  alternates: { canonical: "/for-candidates", languages: { en: "https://www.arbeidmatch.no/for-candidates", "x-default": "https://www.arbeidmatch.no/for-candidates" } },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/for-candidates", locale: "en_US", siteName: "ArbeidMatch", type: "website", images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch" }] },
};

/** For candidates, rebuilt from the mockup approved on 15 November 2026 (ORDER 295, stage 3). */
export default function ForCandidatesPage() {
  return <ForCandidates />;
}
