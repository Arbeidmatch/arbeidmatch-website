import type { Metadata } from "next";

import CandidateSupport from "@/components/site/candidates/CandidateSupport";
import { getSiteNumbers, replySentence } from "@/lib/numbers";

const TITLE = "Candidate support | ArbeidMatch";
const DESCRIPTION_LEAD = "Write to ArbeidMatch about your application, your profile or CV, a job you saw or Norwegian courses.";
const URL = "https://www.arbeidmatch.no/for-candidates/support";

/** ORDER 302: the reply promise is RecOS's; without it the description ends at the lead. */
export async function generateMetadata(): Promise<Metadata> {
  const reply = replySentence(await getSiteNumbers(), "en");
  const DESCRIPTION = reply ? `${DESCRIPTION_LEAD} ${reply}` : DESCRIPTION_LEAD;
  return {
    alternates: { canonical: "/for-candidates/support", languages: { en: URL, "x-default": URL } },
    title: { absolute: TITLE },
    description: DESCRIPTION,
    openGraph: { title: TITLE, description: DESCRIPTION, url: "/for-candidates/support", locale: "en_US", siteName: "ArbeidMatch", type: "website" },
  };
}

/** The candidates' own support page, in place of the Facebook page (ORDER 295, stage 3). */
export default function CandidateSupportPage() {
  return <CandidateSupport />;
}
