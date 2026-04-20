"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getWorkGuidePageMetadata } from "@/lib/eligibilityGuidePageTitle";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const needsTurnstile = Boolean(TURNSTILE_SITE_KEY);

const inputClass =
  "w-full rounded-md border border-border px-4 py-2 text-navy focus:outline-none focus:ring-2 focus:ring-gold";
const selectedOptionBadge = (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(29,158,117,0.1)] text-xs font-bold text-[#1D9E75]">
    <span role="img" aria-label="Selected">
      ✓
    </span>
  </span>
);

export function EligibilityAssistanceClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error" | "rate-limited">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepError, setStepError] = useState("");
  const [pausedByChoice, setPausedByChoice] = useState(false);
  const [wantsAssistance, setWantsAssistance] = useState<"yes" | "no" | "">("");
  const initialRegion = searchParams.get("region");
  const initialEmail = searchParams.get("email");
  const verificationStatus = searchParams.get("verification");
  const urlRegionParam = searchParams.get("region");
  const urlCountryParam = searchParams.get("country");
  const [targetRegion, setTargetRegion] = useState<"Scandinavia" | "Europe" | "">(
    initialRegion === "Scandinavia" || initialRegion === "Europe" ? initialRegion : "",
  );
  const [targetCountry, setTargetCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(initialEmail ?? "");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [registrationKind, setRegistrationKind] = useState<"verify" | "already" | "direct">("verify");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [rateLimitSecondsLeft, setRateLimitSecondsLeft] = useState(0);

  const pageMetadata = useMemo(
    () =>
      getWorkGuidePageMetadata({
        targetCountry,
        targetRegion,
        urlRegion: urlRegionParam,
        urlCountry: urlCountryParam,
      }),
    [targetCountry, targetRegion, urlRegionParam, urlCountryParam],
  );

  useEffect(() => {
    document.title = pageMetadata.title;
  }, [pageMetadata.title]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [status, verificationStatus]);

  useEffect(() => {
    if (status !== "rate-limited") return;
    const id = window.setInterval(() => {
      setRateLimitSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const onTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

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
      notifyEmail.includes("@") &&
      marketingConsent
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

    try {
      const response = await fetch("/api/send-eligibility-assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifyEmail,
          targetCountry,
          targetRegion,
          marketingConsent: marketingConsent ? "Yes" : "No",
          turnstileToken: turnstileToken ?? "",
          wantsAssistance,
        }),
      });
      const result = (await response.json()) as {
        success?: boolean;
        alreadyRegistered?: boolean;
        directlyRegistered?: boolean;
        rateLimited?: boolean;
        retryAfter?: number;
        error?: string;
      };

      const retryAfterSec = result.retryAfter;
      const isRateLimited =
        typeof retryAfterSec === "number" &&
        (result.rateLimited === true || response.status === 429);
      if (isRateLimited) {
        setRateLimitSecondsLeft(retryAfterSec);
        setStatus("rate-limited");
        setTurnstileToken(null);
        setTurnstileKey((k) => k + 1);
        return;
      }

      if (!response.ok) {
        if (response.status === 400 && result.error === "Bot detected") {
          setStepError("Security check failed. Please complete the verification and try again.");
          setTurnstileToken(null);
          setTurnstileKey((k) => k + 1);
          setStatus("idle");
          return;
        }
        setStatus("error");
        return;
      }

      if (!result.success) {
        setStatus("error");
        return;
      }

      if (result.directlyRegistered) {
        setRegistrationKind("direct");
      } else if (result.alreadyRegistered) {
        setRegistrationKind("already");
      } else {
        setRegistrationKind("verify");
      }
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const resetForAnotherCountry = () => {
    setRegistrationKind("verify");
    setFeedbackScore(null);
    setFeedbackNote("");
    setFeedbackStatus("idle");
    setStepError("");
    setStatus("idle");
    setCurrentStep(1);
    setWantsAssistance("yes");
    setPausedByChoice(false);
    setTargetRegion("");
    setTargetCountry("");
    setCountrySearch("");
    setIsCountryPickerOpen(true);
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const submitFeedback = async () => {
    if (feedbackScore === null || feedbackStatus === "sending") return;
    setFeedbackStatus("sending");
    try {
      const response = await fetch("/api/confirmation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "eligibility-assistance",
          purpose: "Candidate feedback after eligibility assistance form",
          pageUrl: "/eligibility-assistance",
          score: feedbackScore,
          note: feedbackNote.trim(),
          email: notifyEmail,
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      setFeedbackStatus("sent");
    } catch {
      setFeedbackStatus("error");
    }
  };

  if (status === "rate-limited") {
    return (
      <section className="bg-surface py-10">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="overflow-hidden rounded-xl border border-[#C9A84C]/35 bg-[#0D1B2A] p-8 text-center shadow-[0_10px_30px_rgba(13,27,42,0.12)]">
            <div className="mx-auto mb-3 h-1 w-24 rounded-full bg-[#C9A84C]" aria-hidden />
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              We love your enthusiasm!{" "}
              <span aria-hidden className="inline-block">
                🌍
              </span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#C7D1DF]">
              We understand you have big ambitions. To receive notifications for another country,
              please wait a moment.
            </p>
            <p className="mt-8 font-mono text-5xl font-bold tabular-nums text-[#C9A84C]" aria-live="polite">
              {Math.floor(rateLimitSecondsLeft / 60)}:{String(rateLimitSecondsLeft % 60).padStart(2, "0")}
            </p>
            <button
              type="button"
              disabled={rateLimitSecondsLeft > 0}
              onClick={resetForAnotherCountry}
              className="mt-8 inline-flex rounded-md bg-[#C9A84C] px-6 py-3 text-sm font-semibold text-[#0D1B2A] transition-colors hover:bg-[#d4b456] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (status === "success" && registrationKind === "direct") {
    return (
      <section className="bg-surface py-10">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-xl bg-white p-8 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl font-bold text-white">
              ✓
            </div>
            <h1 className="mt-4 text-3xl font-bold text-navy">
              You&apos;re now registered for {targetCountry} notifications!
            </h1>
            <p className="mt-3 text-sm text-text-secondary">
              We&apos;ll notify you when opportunities match your profile.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-md bg-[#0D1B2A] px-6 py-3 text-sm font-medium text-white hover:bg-[#111e2e]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (status === "success" && registrationKind === "already") {
    return (
      <section className="bg-surface py-10">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-xl bg-white p-8 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.1)] text-3xl text-[#1D9E75]">
              ℹ
            </div>
            <h1 className="mt-4 text-3xl font-bold text-navy">
              You&apos;re already registered for {targetCountry} notifications.
            </h1>
            <p className="mt-3 text-sm text-text-secondary">
              We&apos;ll notify you when opportunities match your profile.
            </p>
            <button
              type="button"
              onClick={resetForAnotherCountry}
              className="mt-6 inline-flex rounded-md bg-[#0D1B2A] px-6 py-3 text-sm font-medium text-white hover:bg-[#111e2e]"
            >
              Apply for another country
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (status === "success" && registrationKind === "verify") {
    return (
      <section className="bg-surface py-10">
        <div className="mx-auto w-full max-w-2xl px-4">
          <div className="rounded-xl bg-white p-5 text-center shadow-[0_10px_30px_rgba(13,27,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-3xl font-bold text-white">
              ✓
            </div>
            <h1 className="mt-4 text-3xl font-bold text-navy">One more step: verify your email</h1>
            <p className="mt-2 text-sm text-text-secondary">
              We sent a verification link to your email. Please click it to activate notifications.
            </p>
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-border bg-surface p-4 text-left">
              <p className="text-sm font-semibold text-navy">How was your form experience?</p>
              <p className="mt-1 text-xs text-text-secondary">
                Rate from 1 to 10 so we can improve your experience.
              </p>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => {
                      setFeedbackScore(score);
                      if (feedbackStatus !== "idle") setFeedbackStatus("idle");
                    }}
                    className={`rounded-md border px-2 py-2 text-sm font-medium transition ${
                      feedbackScore === score
                        ? "border-[#1D9E75] bg-[rgba(29,158,117,0.1)] text-[#1D9E75]"
                        : "border-border text-navy hover:border-[#1D9E75]"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-xs font-medium text-navy">What can we improve? (optional)</label>
              <textarea
                rows={3}
                className={`${inputClass} mt-1`}
                placeholder="Tell us what to change for a smoother experience..."
                value={feedbackNote}
                onChange={(event) => {
                  setFeedbackNote(event.target.value);
                  if (feedbackStatus !== "idle") setFeedbackStatus("idle");
                }}
              />
              <button
                type="button"
                onClick={() => void submitFeedback()}
                disabled={feedbackScore === null || feedbackStatus === "sending" || feedbackStatus === "sent"}
                className="mt-3 rounded-md bg-[#0D1B2A] px-4 py-2 text-sm font-medium text-white hover:bg-[#111e2e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {feedbackStatus === "sending"
                  ? "Sending feedback..."
                  : feedbackStatus === "sent"
                    ? "Feedback sent"
                    : "Send feedback"}
              </button>
              {feedbackStatus === "error" && (
                <p className="mt-2 text-xs text-[#E24B4A]">Could not send feedback. Please try again.</p>
              )}
              {feedbackStatus === "sent" && (
                <p className="mt-2 text-xs text-[#1D9E75]">Thank you! Your feedback was received.</p>
              )}
            </div>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-md bg-[#C9A84C] px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface py-12">
      <div className="mx-auto w-full max-w-2xl px-4 md:px-6">
        {verificationStatus === "success" && (
          <div className="mb-4 rounded-md border border-[#1D9E75] bg-[rgba(29,158,117,0.1)] p-3 text-sm text-[#1D9E75]">
            Your email is verified. You are now registered for notifications.
          </div>
        )}
        {verificationStatus === "invalid" && (
          <div className="mb-4 rounded-xl border border-[#E24B4A] bg-[rgba(226,75,74,0.1)] p-5 text-[#E24B4A]">
            <h2 className="text-lg font-semibold text-[#E24B4A]">Verification Failed</h2>
            <p className="mt-2 text-sm">
              We could not verify your email. This link may have expired or already been used.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:post@arbeidmatch.no"
                className="inline-flex rounded-md border border-[#E24B4A] bg-white px-4 py-2 text-sm font-medium text-[#E24B4A] hover:bg-[rgba(226,75,74,0.1)]"
              >
                Contact Support
              </a>
              <Link
                href="/eligibility-assistance"
                className="inline-flex rounded-md bg-[#0D1B2A] px-4 py-2 text-sm font-medium text-white hover:bg-[#111e2e]"
              >
                Try Again
              </Link>
            </div>
          </div>
        )}
        {verificationStatus === "error" && (
          <div className="mb-4 rounded-xl border border-[#E24B4A] bg-[rgba(226,75,74,0.1)] p-5 text-[#E24B4A]">
            <h2 className="text-lg font-semibold text-[#E24B4A]">Verification Failed</h2>
            <p className="mt-2 text-sm">
              We could not verify your email. This link may have expired or already been used.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="mailto:post@arbeidmatch.no"
                className="inline-flex rounded-md border border-[#E24B4A] bg-white px-4 py-2 text-sm font-medium text-[#E24B4A] hover:bg-[rgba(226,75,74,0.1)]"
              >
                Contact Support
              </a>
              <Link
                href="/eligibility-assistance"
                className="inline-flex rounded-md bg-[#0D1B2A] px-4 py-2 text-sm font-medium text-white hover:bg-[#111e2e]"
              >
                Try Again
              </Link>
            </div>
          </div>
        )}
        <h1 className="text-3xl font-bold text-navy">{pageMetadata.title}</h1>
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
                      ? "border-[#1D9E75] bg-[rgba(29,158,117,0.1)]"
                      : "border-border hover:border-[#1D9E75]"
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
                        ? "border-[#1D9E75] bg-[rgba(29,158,117,0.1)]"
                        : "border-border hover:border-[#1D9E75]"
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
              <label className="flex items-start gap-2 rounded-md border border-border bg-white p-3 text-sm text-navy">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(event) => setMarketingConsent(event.target.checked)}
                  className="mt-0.5 accent-gold"
                />
                <span>
                  I confirm that I agree to receive emails from ArbeidMatch about updates, marketing,
                  and relevant opportunities.*
                </span>
              </label>

              {needsTurnstile ? (
                <div className="flex flex-col items-center justify-center gap-2 pt-2">
                  <Turnstile
                    key={turnstileKey}
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={onTurnstileSuccess}
                    onExpire={() => setTurnstileToken(null)}
                    onError={() => setTurnstileToken(null)}
                    options={{ theme: "light" }}
                  />
                </div>
              ) : null}
            </div>
          )}

          {stepError && (
            <div className="rounded-md border border-[#E24B4A] bg-[rgba(226,75,74,0.1)] p-3 text-sm text-[#E24B4A]">
              {stepError}
            </div>
          )}

          {!pausedByChoice && (
            <div className="flex items-center gap-3">
              {currentStep === 1 && (
                <button
                  type="submit"
                  disabled={
                    status === "submitting" || (needsTurnstile && !turnstileToken)
                  }
                  className="w-full rounded-md bg-gold py-3 text-sm font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "submitting" ? "Sending..." : "Notify me"}
                </button>
              )}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md border border-[#E24B4A] bg-[rgba(226,75,74,0.1)] p-4 text-[#E24B4A]">
              Something went wrong. Please try again or email support@arbeidmatch.no.
            </div>
          )}
        </form>

        <p className="mt-4 text-sm text-text-secondary">
          Already eligible to work? Return to{" "}
          <Link href="/score" className="font-medium text-gold">
            Work Readiness Check
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
