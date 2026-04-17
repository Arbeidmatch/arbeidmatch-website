"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

export default function EligibilityAssistancePage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [pausedByChoice, setPausedByChoice] = useState(false);
  const [wantsAssistance, setWantsAssistance] = useState<"yes" | "no" | "">("");
  const [targetRegion, setTargetRegion] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [details, setDetails] = useState("");

  const totalSteps = 3;
  const progress = pausedByChoice ? 100 : ((currentStep + 1) / totalSteps) * 100;

  const validateStep = () => {
    if (currentStep === 0) return Boolean(wantsAssistance);
    if (currentStep === 1) return Boolean(targetRegion);
    return fullName.trim().length > 1 && email.includes("@") && currentCountry.trim().length > 1;
  };

  const nextStep = () => {
    if (pausedByChoice) {
      return;
    }
    if (!validateStep()) {
      setStepError("Please complete the required fields before continuing.");
      return;
    }
    setStepError("");
    if (currentStep < totalSteps - 1) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStepError("");
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateStep()) {
      setStepError("Please complete the required fields before sending.");
      return;
    }

    setStepError("");
    setStatus("submitting");

    const payload = {
      wantsAssistance,
      targetRegion,
      fullName,
      email,
      phone,
      currentCountry,
      details,
    };

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
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>

          {currentStep === 0 && (
            <div className="space-y-3">
              <p className="text-lg font-medium text-navy">Do you want assistance with the required procedures?</p>
              {[
                ["yes", "Yes, I want assistance"],
                ["no", "No, not at the moment"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const nextValue = value as "yes" | "no";
                    setWantsAssistance(nextValue);
                    setStepError("");
                    setPausedByChoice(nextValue === "no");
                  }}
                  className={`block w-full rounded-md border px-4 py-3 text-left text-navy ${
                    wantsAssistance === value ? "border-gold bg-gold/10" : "border-border hover:border-gold"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {pausedByChoice && (
            <div className="rounded-md border border-border bg-surface p-4 text-navy">
              <h2 className="text-lg font-semibold">Thank you for checking in</h2>
              <p className="mt-2 text-sm text-text-secondary">
                No worries at all. If you need support with procedures later, you are always welcome
                to come back and continue.
              </p>
              <button
                type="button"
                onClick={() => {
                  setPausedByChoice(false);
                  setWantsAssistance("");
                  setStepError("");
                }}
                className="mt-4 rounded-md border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-white"
              >
                Change answer
              </button>
            </div>
          )}

          {currentStep === 1 && !pausedByChoice && (
            <div className="space-y-3">
              <p className="text-lg font-medium text-navy">Where do you want to work after completing procedures?</p>
              {["Scandinavia", "Europe (EU/EEA)", "Both Scandinavia and Europe (EU/EEA)"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTargetRegion(option)}
                  className={`block w-full rounded-md border px-4 py-3 text-left text-navy ${
                    targetRegion === option ? "border-gold bg-gold/10" : "border-border hover:border-gold"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {currentStep === 2 && !pausedByChoice && (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">Full name*</span>
                <input
                  required
                  name="fullName"
                  className={inputClass}
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">Email*</span>
                <input
                  required
                  name="email"
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">Phone number</span>
                <input
                  name="phone"
                  className={inputClass}
                  placeholder="+47 900 00 000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">Current country*</span>
                <input
                  required
                  name="currentCountry"
                  className={inputClass}
                  placeholder="Country of residence"
                  value={currentCountry}
                  onChange={(event) => setCurrentCountry(event.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">Additional details</span>
                <textarea
                  name="details"
                  rows={4}
                  className={inputClass}
                  placeholder="Tell us your current situation and what support you need"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                />
              </label>
            </div>
          )}

          {stepError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {stepError}
            </div>
          )}

          {!pausedByChoice && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0 || status === "submitting"}
                className="w-full rounded-md border border-navy px-4 py-3 text-sm font-medium text-navy disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              {currentStep < totalSteps - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={status === "submitting"}
                  className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "submitting" ? "Sending..." : "Send assistance request"}
                </button>
              )}
            </div>
          )}

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
