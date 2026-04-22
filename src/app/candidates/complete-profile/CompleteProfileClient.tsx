"use client";

import { useSearchParams } from "next/navigation";

import CandidateProfileWizard from "@/components/candidates/CandidateProfileWizard";

export default function CompleteProfileClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const returnPath = searchParams.get("return");
  return (
    <CandidateProfileWizard
      entryMode="complete-only"
      resumeToken={token}
      applyReturnPath={returnPath?.trim() ? returnPath : null}
    />
  );
}
