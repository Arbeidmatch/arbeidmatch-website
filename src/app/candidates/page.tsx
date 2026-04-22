import type { Metadata } from "next";

import CandidateProfileWizard from "@/components/candidates/CandidateProfileWizard";
import GdprProfileWizardGate from "@/components/gdpr/GdprProfileWizardGate";

export const metadata: Metadata = {
  title: "Candidate Profile | ArbeidMatch",
  description:
    "Build your candidate profile, record a short video intro, and unlock job applications with stronger matching for Norwegian employers.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function CandidatesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const email = firstString(sp.email);
  const token = firstString(sp.token);
  const ret = firstString(sp.return);
  const hasToken = typeof token === "string" && token.length >= 32;

  return (
    <GdprProfileWizardGate>
      <CandidateProfileWizard
        entryMode={hasToken ? "complete-only" : "default"}
        resumeToken={hasToken ? token : null}
        applyReturnPath={ret?.trim() ? ret : null}
        initialEmailHint={email?.includes("@") ? email : null}
      />
    </GdprProfileWizardGate>
  );
}
