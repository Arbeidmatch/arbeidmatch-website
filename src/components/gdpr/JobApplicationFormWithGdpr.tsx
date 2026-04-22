"use client";

import { useGdprConsent } from "@/components/gdpr/GdprConsentProvider";
import GdprDeclinedGate from "@/components/gdpr/GdprDeclinedGate";
import JobApplicationForm from "@/components/jobs/JobApplicationForm";
import type { JobRecord } from "@/lib/jobs/types";

export default function JobApplicationFormWithGdpr({ job }: { job: JobRecord }) {
  const { hydrated, status, reopenForAcceptance } = useGdprConsent();

  if (!hydrated) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60">
        Loading…
      </div>
    );
  }

  if (status === "declined") {
    return <GdprDeclinedGate variant="apply" onOpenAcceptance={reopenForAcceptance} />;
  }

  return <JobApplicationForm job={job} />;
}
