import type { Metadata } from "next";

import { CandidateLoginScreen } from "@/components/candidate-login/CandidateLoginScreen";

export const metadata: Metadata = {
  title: "Candidate sign-in",
  description: "Sign in to your ArbeidMatch candidate profile.",
  alternates: { canonical: "/candidate-login" },
  robots: { index: false, follow: true },
};

/**
 * The candidate's sign-in (ORDER 426): on the site, drawn like RecOS's staff
 * sign-in. RecOS's old /candidate/login sends every visitor here.
 */
export default function CandidateLoginPage() {
  return <CandidateLoginScreen initialView="signin" />;
}
