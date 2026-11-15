import type { Metadata } from "next";

import RecruiterNetwork from "@/components/site/network/RecruiterNetwork";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

const URL = "https://www.arbeidmatch.no/recruiter-network";
const base = nbPageMetadata(
  "/recruiter-network",
  "Recruiter Network | ArbeidMatch",
  "Invite-only network of independent recruiters sourcing EU and EEA candidates for Norway. Request an invitation.",
);

export const metadata: Metadata = { ...base, alternates: { canonical: URL, languages: { en: URL, "x-default": URL } } };

/** The Recruiter Network in the approved design, the invitation as a sheet (ORDER 295, stage 6). */
export default function RecruiterNetworkPage() {
  return <RecruiterNetwork />;
}
