"use client";

import { useCallback, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { useGdprConsent } from "@/components/gdpr/GdprConsentProvider";

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

function isValidEmail(value: string): boolean {
  const t = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

type PanelView = "apply" | "incomplete" | "success";

export default function ApplyWithProfileGate({
  applyHref,
  className,
  children,
}: {
  applyHref: string;
  className?: string;
  children: React.ReactNode;
}) {
  const gdpr = useGdprConsent();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("apply");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [storedEmail, setStoredEmail] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  const close = useCallback(() => {
    setOpen(false);
    setErrorMessage(null);
    setEmailDraft("");
    setPanelView("apply");
  }, []);

  const openPanel = useCallback((view: PanelView, email: string | null, profileStep: number) => {
    setPanelView(view);
    setStoredEmail(email);
    setStep(profileStep);
    setErrorMessage(null);
    setEmailDraft("");
    setOpen(true);
  }, []);

  const handleApplyClick = useCallback(async () => {
    if (!gdpr.hydrated) return;
    if (gdpr.status !== "accepted") {
      gdpr.reopenForAcceptance();
      return;
    }
    setLoading(true);
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem("am_candidate_profile_email") : null;
      const trimmed = (stored || "").trim().toLowerCase();
      if (!trimmed.includes("@")) {
        openPanel("apply", null, 0);
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
      openPanel("incomplete", trimmed, completionStep(profile));
    } finally {
      setLoading(false);
    }
  }, [applyHref, gdpr, openPanel]);

  const postReminder = useCallback(
    async (payload: { email: string; mode: "send_email" | "continue_url" }) => {
      setActionLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch("/api/candidate-profile/reminder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email.trim().toLowerCase(),
            returnUrl: applyHref,
            mode: payload.mode,
          }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
          continueUrl?: string;
        };
        if (!response.ok) {
          if (payload.mode === "continue_url" && response.status === 404) {
            setErrorMessage(data.hint || "Your link expired. Use “Resend profile link” below.");
            return;
          }
          setErrorMessage(data.error || "Something went wrong. Please try again.");
          return;
        }
        if (payload.mode === "continue_url" && typeof data.continueUrl === "string") {
          window.location.assign(data.continueUrl);
          return;
        }
        if (payload.mode === "send_email") {
          try {
            window.localStorage.setItem("am_candidate_profile_email", payload.email.trim().toLowerCase());
          } catch {
            /* ignore */
          }
        }
        setPanelView("success");
      } catch {
        setErrorMessage("Could not reach the server. Please try again.");
      } finally {
        setActionLoading(false);
      }
    },
    [applyHref],
  );

  const onSubmitApply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const addr = emailDraft.trim().toLowerCase();
      if (!isValidEmail(addr)) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      await postReminder({ email: addr, mode: "send_email" });
    },
    [emailDraft, postReminder],
  );

  const onContinueProfile = useCallback(async () => {
    const addr = storedEmail?.trim().toLowerCase();
    if (!addr?.includes("@")) return;
    await postReminder({ email: addr, mode: "continue_url" });
  }, [postReminder, storedEmail]);

  const onResendLink = useCallback(async () => {
    const addr = storedEmail?.trim().toLowerCase();
    if (!addr?.includes("@")) return;
    await postReminder({ email: addr, mode: "send_email" });
  }, [postReminder, storedEmail]);

  return (
    <>
      <button
        type="button"
        onClick={() => void handleApplyClick()}
        disabled={loading || !gdpr.hydrated || gdpr.status === "unset"}
        className={className}
      >
        {loading ? "Checking…" : children}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0D1B2A]/92 px-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25 }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              transition={transition}
              className="w-full max-w-[440px] rounded-[18px] border border-[#C9A84C]/35 bg-[#0D1B2A] px-6 py-8"
            >
              <AnimatePresence mode="wait">
                {panelView === "success" ? (
                  <motion.div
                    key="success"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                    transition={transition}
                    className="text-center"
                  >
                    <motion.div
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A84C]/45 bg-[rgba(201,168,76,0.12)]"
                      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 22 }}
                    >
                      <Check className="h-7 w-7 text-[#C9A84C]" strokeWidth={2.5} aria-hidden />
                    </motion.div>
                    <h2 id={titleId} className="mt-5 text-xl font-bold tracking-tight text-white">
                      Check your inbox
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">
                      We sent you a secure link to continue your profile. The link is valid for 7 days.
                    </p>
                    <button
                      type="button"
                      onClick={close}
                      className="mt-8 w-full min-h-[44px] rounded-[10px] border border-white/15 text-sm font-semibold text-white/85 transition-colors hover:border-[#C9A84C]/40"
                    >
                      Close
                    </button>
                  </motion.div>
                ) : panelView === "incomplete" ? (
                  <motion.div
                    key="incomplete"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={transition}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">Almost there</p>
                    <h2 id={titleId} className="mt-2 text-xl font-bold text-white">
                      Finish your profile to apply
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/72">
                      You are <span className="font-semibold text-white">{Math.min(9, step)}</span> of{" "}
                      <span className="font-semibold text-white">9</span> steps complete.
                    </p>
                    {errorMessage ? <p className="mt-3 text-sm text-amber-200">{errorMessage}</p> : null}
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void onContinueProfile()}
                        className="min-h-[44px] w-full rounded-[10px] bg-[#C9A84C] text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-95 disabled:opacity-50"
                      >
                        {actionLoading ? "Opening…" : "Continue my profile"}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void onResendLink()}
                        className="min-h-[44px] w-full rounded-[10px] border border-[#C9A84C]/40 text-sm font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)] disabled:opacity-50"
                      >
                        Resend profile link
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={close}
                      className="mt-6 w-full text-center text-xs font-medium text-white/45 underline-offset-4 hover:text-white/65 hover:underline"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="apply"
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={transition}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">Apply</p>
                    <h2 id={titleId} className="mt-2 text-xl font-bold text-white">
                      Apply for this job
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">Create your candidate profile to apply.</p>
                    <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmitApply(e)}>
                      <div>
                        <label htmlFor="am-apply-email" className="mb-1.5 block text-xs font-medium text-white/50">
                          Email
                        </label>
                        <input
                          id="am-apply-email"
                          type="email"
                          autoComplete="email"
                          value={emailDraft}
                          onChange={(e) => setEmailDraft(e.target.value)}
                          placeholder="Enter your email"
                          className="min-h-[48px] w-full rounded-[10px] border border-white/12 bg-[#0A1624] px-3.5 text-sm text-white outline-none ring-0 transition-[border-color] placeholder:text-white/35 focus:border-[#C9A84C]/55"
                        />
                      </div>
                      {errorMessage ? <p className="text-sm text-amber-200">{errorMessage}</p> : null}
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="min-h-[48px] w-full rounded-[10px] bg-[#C9A84C] text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-95 disabled:opacity-50"
                      >
                        {actionLoading ? "Sending…" : "Send me the registration link"}
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={close}
                      className="mt-6 w-full text-center text-xs font-medium text-white/45 underline-offset-4 hover:text-white/65 hover:underline"
                    >
                      Cancel
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
