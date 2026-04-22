"use client";

import { useGdprConsent } from "@/components/gdpr/GdprConsentProvider";
import GdprDeclinedGate from "@/components/gdpr/GdprDeclinedGate";
import GdprInlineConsentPanel from "@/components/gdpr/GdprInlineConsentPanel";

export default function GdprProfileWizardGate({ children }: { children: React.ReactNode }) {
  const { hydrated, status, isNoIndexPath, reopenForAcceptance } = useGdprConsent();

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16 text-sm text-white/60">
        Loading…
      </div>
    );
  }

  if (status === "declined" || status === "dismissed") {
    return <GdprDeclinedGate variant="profile" onOpenAcceptance={reopenForAcceptance} />;
  }

  if (status === "unset" && isNoIndexPath) {
    return <GdprInlineConsentPanel />;
  }

  return <>{children}</>;
}
