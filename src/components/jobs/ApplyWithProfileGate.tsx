"use client";

import { useCallback, useState } from "react";

type ProfileApi = {
  profile_completion_step?: number | null;
  profile_completed_at?: string | null;
  first_name?: string | null;
} | null;

function completionStep(profile: ProfileApi): number {
  if (!profile) return 0;
  if (profile.profile_completion_step != null) return profile.profile_completion_step;
  return profile.profile_completed_at ? 9 : 0;
}

export default function ApplyWithProfileGate({
  applyHref,
  className,
  children,
}: {
  applyHref: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remindLoading, setRemindLoading] = useState(false);
  const [remindMessage, setRemindMessage] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState<string | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setRemindMessage(null);
  }, []);

  const openIncomplete = useCallback((profile: ProfileApi, storedEmail: string | null) => {
    setStep(completionStep(profile));
    setEmail(storedEmail);
    setOpen(true);
  }, []);

  const handleApplyClick = useCallback(async () => {
    setLoading(true);
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("am_candidate_profile_email") : null;
      const trimmed = (stored || "").trim().toLowerCase();
      if (!trimmed.includes("@")) {
        openIncomplete(null, null);
        return;
      }

      const response = await fetch(`/api/candidate-profile?email=${encodeURIComponent(trimmed)}`);
      const body = (await response.json().catch(() => ({}))) as { profile?: ProfileApi };
      const profile = body.profile ?? null;
      const done = completionStep(profile) >= 9;
      if (done) {
        window.location.assign(applyHref);
        return;
      }
      openIncomplete(profile, trimmed);
    } finally {
      setLoading(false);
    }
  }, [applyHref, openIncomplete]);

  const sendReminder = useCallback(async () => {
    const target = email?.trim().toLowerCase();
    if (!target?.includes("@")) {
      setRemindMessage("Save your email in the profile flow first, or open Complete profile and enter it there.");
      return;
    }
    setRemindLoading(true);
    setRemindMessage(null);
    try {
      const response = await fetch("/api/candidate-profile/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setRemindMessage(body.error || "Could not send the email right now.");
        return;
      }
      close();
    } catch {
      setRemindMessage("Could not send the email right now.");
    } finally {
      setRemindLoading(false);
    }
  }, [close, email]);

  return (
    <>
      <button type="button" onClick={() => void handleApplyClick()} disabled={loading} className={className}>
        {loading ? "Checking..." : children}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[rgba(13,27,42,0.88)] px-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="am-apply-profile-title"
        >
          <div className="w-full max-w-md rounded-[14px] border border-[rgba(201,168,76,0.28)] bg-[#0A0F18] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">Profile required</p>
            <h2 id="am-apply-profile-title" className="mt-2 text-xl font-bold text-white">
              Complete Your Profile First
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              You are <span className="font-semibold text-white">{Math.min(9, step)}</span> of{" "}
              <span className="font-semibold text-white">9</span> steps. Finish the candidate profile to apply to jobs.
            </p>
            {remindMessage ? <p className="mt-3 text-sm text-amber-200">{remindMessage}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={close}
                className="min-h-[44px] rounded-[10px] border border-white/15 px-4 text-sm font-semibold text-white/80 hover:border-[rgba(201,168,76,0.35)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={remindLoading}
                onClick={() => void sendReminder()}
                className="min-h-[44px] rounded-[10px] bg-[#C9A84C] px-4 text-sm font-bold text-[#0D1B2A] hover:bg-[#b8953f] disabled:opacity-50"
              >
                {remindLoading ? "Sending..." : "Email secure profile link"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
