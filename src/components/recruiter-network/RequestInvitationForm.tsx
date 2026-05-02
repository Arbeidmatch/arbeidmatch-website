"use client";

import type { FormEvent } from "react";
import { useState } from "react";

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
        className="mx-auto w-full max-w-[640px] rounded-xl border border-[rgba(10,22,40,0.1)] bg-[rgba(10,22,40,0.03)] px-6 py-10 text-center md:px-8 md:py-10 lg:px-12 lg:py-12"
        role="status"
      >
        <p className="text-base font-semibold text-[#0a1628]">
          Thank you. We will review your request and respond within 7 days.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] rounded-xl border border-[rgba(10,22,40,0.1)] bg-white px-6 py-6 md:px-8 md:py-8 lg:px-12 lg:py-12">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 text-[#0a1628]">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-full-name" className="text-sm font-medium text-[#0a1628]">
            Full name *
          </label>
          <input
            id="invite-full-name"
            name="full_name"
            required
            autoComplete="name"
            className="w-full rounded border border-[rgba(10,22,40,0.2)] px-3 py-2.5 text-[15px] text-[#0a1628] placeholder:text-[rgba(10,22,40,0.45)] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-email" className="text-sm font-medium text-[#0a1628]">
            Email *
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded border border-[rgba(10,22,40,0.2)] px-3 py-2.5 text-[15px] text-[#0a1628] placeholder:text-[rgba(10,22,40,0.45)] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-motivation" className="text-sm font-medium text-[#0a1628]">
            Tell us about your recruitment experience and why you want to join *
          </label>
          <textarea
            id="invite-motivation"
            name="motivation"
            required
            minLength={30}
            rows={5}
            placeholder="For example, your background in recruitment or HR, markets you cover, and what you hope to bring to the network."
            className="min-h-[120px] w-full resize-y rounded border border-[rgba(10,22,40,0.2)] px-3 py-2.5 text-[15px] text-[#0a1628] placeholder:text-[rgba(10,22,40,0.45)] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invite-experience" className="text-sm font-medium text-[#0a1628]">
            Experience summary (optional)
          </label>
          <textarea
            id="invite-experience"
            name="experience_summary"
            rows={3}
            placeholder="Optional: years of experience, industries, key placements"
            className="w-full resize-y rounded border border-[rgba(10,22,40,0.2)] px-3 py-2.5 text-[15px] text-[#0a1628] placeholder:text-[rgba(10,22,40,0.45)] focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-[#0a1628]">
          <input name="gdpr_consent" type="checkbox" required className="mt-1 h-4 w-4 shrink-0 accent-[#C9A84C]" />
          <span>
            I agree that ArbeidMatch Norge AS may store and process my information to evaluate my invitation request. *
          </span>
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 inline-flex w-full items-center justify-center rounded-[4px] border-0 bg-[#C9A84C] px-6 py-3 text-base font-semibold text-[#0a1628] transition-opacity disabled:opacity-60 sm:w-auto"
          style={{ padding: "12px 24px" }}
        >
          {submitting ? "Sending" : "Request invitation"}
        </button>
      </form>
    </div>
  );
}
