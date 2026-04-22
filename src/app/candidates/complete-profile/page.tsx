import type { Metadata } from "next";
import { Suspense } from "react";

import GdprProfileWizardGate from "@/components/gdpr/GdprProfileWizardGate";

import CompleteProfileClient from "./CompleteProfileClient";

export const metadata: Metadata = {
  title: "Complete Your Profile | ArbeidMatch",
  description: "Resume your candidate profile and unlock job applications on ArbeidMatch.",
  robots: { index: false, follow: false },
};

function LoadingFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#0D1B2A] text-sm text-white/70">
      Loading...
    </div>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GdprProfileWizardGate>
        <CompleteProfileClient />
      </GdprProfileWizardGate>
    </Suspense>
  );
}
