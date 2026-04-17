"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function EligibilityAssistancePage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [wantsAssistance, setWantsAssistance] = useState<"yes" | "no">("yes");
  const [targetRegion, setTargetRegion] = useState("Norway");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/send-eligibility-assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to send assistance request");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="bg-surface py-12">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
        <h1 className="text-3xl font-bold text-navy">Work Eligibility Assistance</h1>
        <p className="mt-3 text-text-secondary">
          If you currently do not have work rights in Norway or the EU/EEA, we can guide you through
          the procedures needed to become eligible.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-border bg-white p-6 shadow-[0_10px_30px_rgba(13,27,42,0.08)]"
        >
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-navy">
              Do you want assistance with the required procedures?
            </legend>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="radio"
                name="wantsAssistance"
                value="yes"
                checked={wantsAssistance === "yes"}
                onChange={() => setWantsAssistance("yes")}
                required
              />
              Yes, I want assistance
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="radio"
                name="wantsAssistance"
                value="no"
                checked={wantsAssistance === "no"}
                onChange={() => setWantsAssistance("no")}
              />
              No, not at the moment
            </label>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-medium text-navy">
              Where do you want to work after completing procedures?
            </legend>
            {["Norway", "EU/EEA countries", "Both Norway and EU/EEA countries"].map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-navy">
                <input
                  type="radio"
                  name="targetRegion"
                  value={option}
                  checked={targetRegion === option}
                  onChange={() => setTargetRegion(option)}
                  required
                />
                {option}
              </label>
            ))}
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Full name*</span>
            <input required name="fullName" className={inputClass} placeholder="John Doe" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Email*</span>
            <input required name="email" type="email" className={inputClass} placeholder="you@example.com" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Phone number</span>
            <input name="phone" className={inputClass} placeholder="+47 900 00 000" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Current country*</span>
            <input required name="currentCountry" className={inputClass} placeholder="Country of residence" />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">Additional details</span>
            <textarea
              name="details"
              rows={4}
              className={inputClass}
              placeholder="Tell us your current situation and what support you need"
            />
          </label>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-md bg-gold py-3 text-lg font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "submitting" ? "Sending..." : "Send assistance request"}
          </button>

          {status === "success" && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
              Thank you. We received your request and will contact you shortly with next steps.
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              Something went wrong. Please try again or email post@arbeidmatch.no.
            </div>
          )}
        </form>

        <p className="mt-4 text-sm text-text-secondary">
          Already eligible to work? Return to{" "}
          <Link href="/score" className="font-medium text-gold">
            Eligibility Check
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
