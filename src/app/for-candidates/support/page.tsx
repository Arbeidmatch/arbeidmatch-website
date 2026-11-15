import type { Metadata } from "next";

import CandidateSupport from "@/components/site/candidates/CandidateSupport";

const TITLE = "Candidate support | ArbeidMatch";
const DESCRIPTION = "Write to ArbeidMatch about your application, your profile or CV, a job you saw or Norwegian courses. We reply within one working day.";
const URL = "https://www.arbeidmatch.no/for-candidates/support";

export const metadata: Metadata = {
  alternates: { canonical: "/for-candidates/support", languages: { en: URL, "x-default": URL } },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/for-candidates/support", locale: "en_US", siteName: "ArbeidMatch", type: "website" },
};

/** The candidates' own support page, in place of the Facebook page (ORDER 295, stage 3). */
export default function CandidateSupportPage() {
  return <CandidateSupport />;
}
