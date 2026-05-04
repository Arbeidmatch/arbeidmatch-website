"use client";

import { useState } from "react";
import Link from "next/link";

import { CANDIDATE_PORTAL_LOGIN_URL } from "@/lib/candidatePortal";

const goldBtn =
  "inline-flex min-h-[52px] w-full max-w-md items-center justify-center rounded-xl bg-[#C9A84C] px-8 py-3.5 text-center text-[16px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] sm:w-auto";

function goToCandidateLogin() {
  window.location.assign(CANDIDATE_PORTAL_LOGIN_URL);
}

export default function CandidateAccountSection() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function onInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !email.trim()) return;
    setSubmitting(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/candidate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          gdpr_consent: true,
          timestamp: new Date().toISOString(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean };
      if (res.ok && data.success) {
        setStatus("success");
        setEmail("");
        setConsent(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-b border-[rgba(201,168,76,0.14)] bg-[#0a121c] py-12 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-3xl space-y-10 md:space-y-12">
          <div className="rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[#0D1B2A] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] md:p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-[28px]">Already registered?</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
              Access your profile and track your applications.
            </p>
            <div className="mt-6">
              <button type="button" className={goldBtn} onClick={goToCandidateLogin}>
                Sign in to your profile
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] p-6 md:p-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white md:text-[28px]">New here? Join our candidate network</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 md:text-base">
              Enter your email to receive an invitation link.
            </p>

            {status === "success" ? (
              <p className="mt-6 text-base font-medium leading-relaxed text-[#C9A84C]" role="status">
                Thank you! Check your inbox for your invitation link.
              </p>
            ) : (
              <form className="mt-6 space-y-5" onSubmit={onInviteSubmit}>
                <div>
                  <label htmlFor="candidate-invite-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="candidate-invite-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-white/15 bg-[#0a121c] px-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/80">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 bg-[#0a121c] text-[#C9A84C] focus:ring-[#C9A84C]"
                  />
                  <span>
                    I agree to the{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
                    >
                      Terms of Service
                    </Link>{" "}
                    and consent to ArbeidMatch processing my personal data for recruitment purposes.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!consent || submitting}
                  className={`${goldBtn} disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {submitting ? "Sending…" : "Send me an invitation"}
                </button>

                {status === "error" ? (
                  <p className="text-sm leading-relaxed text-red-300/90" role="alert">
                    Something went wrong. Please try again or contact{" "}
                    <a className="font-medium text-[#C9A84C] underline-offset-2 hover:underline" href="mailto:support@arbeidmatch.no">
                      support@arbeidmatch.no
                    </a>
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
