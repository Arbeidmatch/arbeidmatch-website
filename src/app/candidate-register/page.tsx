import type { Metadata } from "next";

import { CandidateLoginScreen } from "@/components/candidate-login/CandidateLoginScreen";

export const metadata: Metadata = {
  title: "Create your candidate profile",
  description: "Create your free ArbeidMatch candidate profile.",
  alternates: { canonical: "/candidate-register" },
};

/**
 * THE ONE ENTRY GATE FOR NEW CANDIDATES (ORDER 396, 20 November 2026). His
 * words: "sa fie o singura poarta de intrare si aia sa fie prin site nu prin
 * ats". Every door that makes a profile leads here: a job's Register, a
 * recruiter's /register/<handle>, a referral, the Messenger bot, and RecOS's
 * own "Create my profile". Since ORDER 426 it is the create face of the
 * candidate's sign-in screen, drawn like RecOS's staff sign-in, carrying the
 * source the address names.
 */
export default function CandidateRegisterPage() {
  return <CandidateLoginScreen initialView="create" />;
}
