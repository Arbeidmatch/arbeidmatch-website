import type { Metadata } from "next";

import CandidateProfileWizard from "@/components/candidates/CandidateProfileWizard";

export const metadata: Metadata = {
  title: "Candidate Profile | ArbeidMatch",
  description:
    "Build your candidate profile, record a short video intro, and unlock job applications with stronger matching for Norwegian employers.",
  robots: { index: false, follow: false },
};

export default function CandidatesPage() {
  return <CandidateProfileWizard />;
}
