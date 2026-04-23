"use client";

import { useEffect, useMemo, useState } from "react";
import { useGdprConsent } from "@/components/gdpr/GdprConsentProvider";
import GdprDeclinedGate from "@/components/gdpr/GdprDeclinedGate";
import JobApplicationForm from "@/components/jobs/JobApplicationForm";
import type { JobRecord } from "@/lib/jobs/types";

type CandidateProfileGateResponse = {
  profile?: {
    profile_score?: number | null;
  } | null;
};

export default function JobApplicationFormWithGdpr({ job }: { job: JobRecord }) {
  const { hydrated, status, reopenForAcceptance } = useGdprConsent();
  const [checkingGate, setCheckingGate] = useState(true);
  const [showGateModal, setShowGateModal] = useState(false);
  const [profileScore, setProfileScore] = useState(0);
  const [isEligibleToApply, setIsEligibleToApply] = useState(false);

  const clampedScore = useMemo(() => Math.max(0, Math.min(100, profileScore || 0)), [profileScore]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function checkProfileGate() {
      const storedEmail = window.localStorage.getItem("am_candidate_profile_email")?.trim().toLowerCase() || "";
      if (!storedEmail || !storedEmail.includes("@")) {
        setProfileScore(0);
        setIsEligibleToApply(false);
        setShowGateModal(true);
        setCheckingGate(false);
        return;
      }

      try {
        const res = await fetch(`/api/candidate-profile?email=${encodeURIComponent(storedEmail)}`, { method: "GET" });
        const data = (await res.json().catch(() => ({}))) as CandidateProfileGateResponse;
        const score = Number(data?.profile?.profile_score ?? 0);
        const normalizedScore = Number.isFinite(score) ? score : 0;
        setProfileScore(normalizedScore);
        const eligible = normalizedScore >= 60;
        setIsEligibleToApply(eligible);
        setShowGateModal(!eligible);
      } catch {
        setProfileScore(0);
        setIsEligibleToApply(false);
        setShowGateModal(true);
      } finally {
        setCheckingGate(false);
      }
    }

    void checkProfileGate();
  }, []);

  if (!hydrated) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60">
        Loading…
      </div>
    );
  }

  if (status !== "accepted") {
    return <GdprDeclinedGate variant="apply" onOpenAcceptance={reopenForAcceptance} />;
  }

  if (checkingGate) {
    return (
      <div className="rounded-[14px] border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60">
        Checking profile eligibility…
      </div>
    );
  }

  return (
    <>
      {isEligibleToApply ? (
        <JobApplicationForm job={job} />
      ) : (
        <div className="rounded-[14px] border border-[#C9A84C]/30 bg-white/[0.03] p-6 text-white/80">
          <p className="text-sm">Profile completion of at least 60% is required before applying.</p>
          <button
            type="button"
            onClick={() => setShowGateModal(true)}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#C9A84C]/40 px-4 py-2 text-sm font-semibold text-[#C9A84C]"
          >
            Open requirement details
          </button>
        </div>
      )}

      {showGateModal ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-[480px] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0D1B2A] to-[#111f30] p-10 shadow-2xl">
            <h2 className="text-3xl font-semibold text-white">Complete your profile to apply</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              You need to complete at least 60% of your profile before applying. This helps employers find the right match.
            </p>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs text-white/65">
                <span>Current profile score</span>
                <span>{clampedScore}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#C9A84C] transition-all duration-300"
                  style={{ width: `${clampedScore}%` }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href="https://jobs.arbeidmatch.no"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 w-full items-center justify-center rounded-xl bg-[#C9A84C] text-base font-medium text-[#0D1B2A]"
              >
                Complete Profile
              </a>
              <button
                type="button"
                onClick={() => setShowGateModal(false)}
                className="h-14 w-full rounded-xl border border-white/30 bg-transparent text-base font-medium text-white"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
