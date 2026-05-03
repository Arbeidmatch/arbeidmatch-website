"use client";

import type { FormEvent } from "react";
import { useState } from "react";

const fieldClass =
  "w-full min-h-[44px] rounded-[4px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[15px] text-[rgba(255,255,255,0.98)] placeholder:text-[rgba(255,255,255,0.35)] shadow-none focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,76,0.15)]";

const labelClass = "text-sm font-medium leading-none text-[rgba(255,255,255,0.75)]";

export default function RequestInvitationForm() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const website = fd.get("website");
    if (typeof website === "string" && website.trim()) {
      return;
    }

    const full_name = String(fd.get("full_name") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const motivation = String(fd.get("motivation") || "").trim();
    const experience_summary = String(fd.get("experience_summary") || "").trim();
    const gdpr_consent = fd.get("gdpr_consent") === "on";

    if (motivation.length < 30) {
      setError("Please write at least 30 characters in the motivation field.");
      return;
    }
    if (!gdpr_consent) {
      setError("Please accept the privacy statement to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/recruiter-network/request-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name,
          email,
          motivation,
          experience_summary: experience_summary || undefined,
          gdpr_consent: true,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError("Something went wrong. Please try again or contact partners@arbeidmatch.no.");
        return;
      }
      setSuccess(true);
      e.currentTarget.reset();
    } catch {
      setError("Something went wrong. Please try again or contact partners@arbeidmatch.no.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        className="mx-auto w-full max-w-[640px] rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-6 py-10 text-center lg:px-10 lg:py-10"
        role="status"
      >
        <p className="text-base font-semibold text-[rgba(255,255,255,0.92)]">
          Thank you. We will review your request and respond within 7 days.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-6 py-6 lg:px-10 lg:py-10">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <div className="flex flex-col gap-2">
          <label htmlFor="invite-full-name" className={labelClass}>
            Full name *
          </label>
          <input
            id="invite-full-name"
            name="full_name"
            required
            autoComplete="name"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="invite-email" className={labelClass}>
            Email *
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="invite-motivation" className={labelClass}>
            Tell us about your recruitment experience and why you want to join *
          </label>
          <textarea
            id="invite-motivation"
            name="motivation"
            required
            minLength={30}
            rows={5}
            placeholder="For example, your background in recruitment or HR, markets you cover, and what you hope to bring to the network."
            className={`min-h-[120px] resize-y ${fieldClass}`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="invite-experience" className={labelClass}>
            Experience summary (optional)
          </label>
          <textarea
            id="invite-experience"
            name="experience_summary"
            rows={3}
            placeholder="Optional: years of experience, industries, key placements"
            className={`min-h-[120px] resize-y ${fieldClass}`}
          />
        </div>

        <div className="flex flex-col gap-6">
          <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-[4px] py-2 pr-2">
            <span className="relative mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <input
                name="gdpr_consent"
                type="checkbox"
                required
                className="peer sr-only"
                aria-describedby="gdpr-invite-desc"
              />
              <span
                className="pointer-events-none absolute inset-0 rounded-[4px] border-2 border-[rgba(255,255,255,0.25)] bg-transparent transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[rgba(201,168,76,0.35)] peer-checked:border-[#C9A84C] peer-checked:bg-[#C9A84C]"
                aria-hidden
              />
              <svg
                className="pointer-events-none relative z-[1] h-3 w-3 text-[#0D1B2A] opacity-0 transition-opacity peer-checked:opacity-100"
                viewBox="0 0 12 10"
                fill="none"
                aria-hidden
              >
                <path
                  d="M1 5.2 4.2 8.4 11 1.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span id="gdpr-invite-desc" className="text-[13px] leading-[1.5] text-[rgba(255,255,255,0.60)]">
              I agree that ArbeidMatch Norge AS may store and process my information to evaluate my invitation request. *
            </span>
          </label>

          <div className="flex flex-col gap-2">
            {error ? <p className="text-sm text-[rgba(248,113,113,0.95)]">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="block w-fit rounded-[4px] border-0 bg-[#C9A84C] px-8 py-[14px] text-left text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8962e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending" : "Request invitation"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
