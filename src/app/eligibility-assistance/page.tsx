"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";
const selectedOptionBadge = (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
    <span role="img" aria-label="Selected">
      ✓
    </span>
  </span>
);

export default function EligibilityAssistancePage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [pausedByChoice, setPausedByChoice] = useState(false);
  const [wantsAssistance, setWantsAssistance] = useState<"yes" | "no" | "">("");
  const [targetRegion, setTargetRegion] = useState<"Scandinavia" | "Europe" | "">("");
  const [targetCountry, setTargetCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("");

  const totalSteps = 2;
  const progress = pausedByChoice ? 100 : ((currentStep + 1) / totalSteps) * 100;
  const regionCountries: Record<"Scandinavia" | "Europe", string[]> = {
    Scandinavia: ["Norway", "Sweden", "Denmark", "Finland", "Iceland"],
    Europe: [
      "Austria",
      "Belgium",
      "Bulgaria",
      "Croatia",
      "Cyprus",
      "Czech Republic",
      "Estonia",
      "France",
      "Germany",
      "Greece",
      "Hungary",
      "Ireland",
      "Italy",
      "Latvia",
      "Lithuania",
      "Luxembourg",
      "Malta",
      "Netherlands",
      "Poland",
      "Portugal",
      "Romania",
      "Slovakia",
      "Slovenia",
      "Spain",
      "Switzerland",
      "United Kingdom",
    ],
  };
  const filteredCountries =
    targetRegion === ""
      ? []
      : regionCountries[targetRegion].filter((country) =>
          country.toLowerCase().includes(countrySearch.trim().toLowerCase()),
        );

  const validateStep = () => {
    if (currentStep === 0) return Boolean(wantsAssistance);
    return (
      Boolean(targetRegion) &&
      targetCountry.trim().length > 1 &&
      notifyEmail.trim().length > 3 &&
      notifyEmail.includes("@")
    );
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
      targetCountry,
      notifyEmail,
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
                    if (nextValue === "yes") setCurrentStep(1);
                  }}
                  className={`block w-full rounded-md border px-4 py-3 text-left text-navy ${
                    wantsAssistance === value
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-green-400"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>{label}</span>
                    {wantsAssistance === value && selectedOptionBadge}
                  </span>
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
                  setCurrentStep(0);
                }}
                className="mt-4 rounded-md border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-white"
              >
                Change answer
              </button>
            </div>
          )}

          {currentStep === 1 && !pausedByChoice && (
            <div className="space-y-3">
              <p className="text-lg font-medium text-navy">Where do you want to work?</p>
              <div className="space-y-2">
                {(["Scandinavia", "Europe"] as const).map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => {
                      setTargetRegion(region);
                      setTargetCountry("");
                      setCountrySearch("");
                      setIsCountryPickerOpen(true);
                    }}
                    className={`block w-full rounded-md border px-4 py-3 text-left text-navy ${
                      targetRegion === region
                        ? "border-green-500 bg-green-50"
                        : "border-border hover:border-green-400"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span>{region}</span>
                      {targetRegion === region && selectedOptionBadge}
                    </span>
                  </button>
                ))}
              </div>

              {targetRegion && (
                <div className="space-y-2 rounded-md border border-border bg-white p-3">
                  <p className="text-sm font-medium text-navy">
                    Select country in {targetRegion}*
                  </p>
                  {isCountryPickerOpen ? (
                    <>
                      <input
                        className={inputClass}
                        placeholder="Search country..."
                        value={countrySearch}
                        onChange={(event) => setCountrySearch(event.target.value)}
                      />
                      <div className="max-h-44 overflow-y-auto rounded-md border border-border">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <button
                              key={country}
                              type="button"
                              onClick={() => {
                                setTargetCountry(country);
                                setIsCountryPickerOpen(false);
                              }}
                              className={`block w-full border-b border-border px-3 py-2 text-left text-sm last:border-b-0 ${
                                targetCountry === country
                                  ? "bg-gold/10 font-medium text-navy"
                                  : "text-navy hover:bg-surface"
                              }`}
                            >
                              {country}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-text-secondary">No countries found</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCountrySearch("");
                        setIsCountryPickerOpen(true);
                      }}
                      className="block w-full rounded-md border border-gold bg-gold/10 px-4 py-3 text-left text-sm font-medium text-navy hover:border-gold-hover"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span>Selected country: {targetCountry} (click to change)</span>
                        {selectedOptionBadge}
                      </span>
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-text-secondary">
                This is important because visa and legal documentation depend on the specific country.
              </p>
            </div>
          )}

          {currentStep === 1 && !pausedByChoice && (
            <div className="space-y-4">
              <div className="rounded-md border border-border bg-surface p-4">
                <p className="text-sm font-medium text-navy">Future legal procedure guide</p>
                <p className="mt-1 text-sm text-text-secondary">
                  We will prepare a precise guide in the near future with the legal steps and
                  required documentation to help you apply correctly.
                </p>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-navy">
                  Email for notification when updated guide is available*
                </span>
                <input
                  required
                  name="notifyEmail"
                  type="email"
                  className={inputClass}
                  placeholder="you@example.com"
                  value={notifyEmail}
                  onChange={(event) => setNotifyEmail(event.target.value)}
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
            <div className="flex items-center gap-3">
              {currentStep === 1 && (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "submitting" ? "Sending..." : "Notify me"}
                </button>
              )}
            </div>
          )}

          {status === "success" && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
              Thank you. You are on the notification list and will receive an email as soon as the
              guide is available.
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
