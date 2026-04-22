"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Shield } from "lucide-react";

import { sanitizeApplyReturnPath } from "@/lib/candidates/applyReturnPath";
import { jobsBoardAbsoluteUrl } from "@/lib/jobs/jobsBoardOrigin";
import { buildCandidateProfilePayload, buildJobPreferences } from "@/lib/candidates/linearProfilePayload";
import type { CandidateProfilePayload, JobPreferencesPayload } from "@/lib/candidates/profileSchema";
import {
  experienceBands,
  housingPrefs,
  jobTypes,
  hoursPrefs,
  rotationPrefs,
  salaryHourlyOptions,
} from "@/lib/candidates/profileSchema";
import {
  DEFAULT_EEA_DIAL_PREFIX,
  OUTSIDE_EEA_RESIDENCE_VALUE,
  buildEeaPhone,
  eeaDialOptionsSortedByCountry,
  isEeaCandidatePhone,
  isEeaResidenceCountryName,
  splitEeaPhoneToParts,
} from "@/lib/candidates/euEeaCandidateGeo";

type Mode = "choose" | "wizard";

function isProbablyVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("vimeo.com") || lower.includes("loom.com");
}

function toYouTubeEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

function toVimeoEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = parts[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  } catch {
    return null;
  }
}

function toLoomEmbed(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("loom.com")) return null;
    const share = parsed.pathname.replace("/share/", "").replace("/", "");
    return share ? `https://www.loom.com/embed/${share}` : null;
  } catch {
    return null;
  }
}

function buildEmbedSrc(url: string): string | null {
  return toYouTubeEmbed(url) || toVimeoEmbed(url) || toLoomEmbed(url);
}

type WizardEntryMode = "default" | "complete-only";

type CandidateProfileWizardProps = {
  entryMode?: WizardEntryMode;
  resumeToken?: string | null;
  /** Safe return URL (jobs subdomain) after profile is saved. */
  applyReturnPath?: string | null;
  /** Pre-fills email from magic link before resume payload loads. */
  initialEmailHint?: string | null;
};

const TOTAL_STEPS = 9;

const STEP_TITLES = [
  "Work type",
  "Experience",
  "Expected hourly rate",
  "Hours per week",
  "Preferred rotation",
  "Driving licence",
  "Housing",
  "Video intro",
  "Employer sharing consent",
] as const;

const EXPERIENCE_LABELS: Record<(typeof experienceBands)[number], string> = {
  "0_2": "0 to 2 years",
  "2_5": "2 to 5 years",
  "5_10": "5 to 10 years",
  "10_plus": "10+ years",
};

const SALARY_LABELS: Record<(typeof salaryHourlyOptions)[number], string> = {
  "400_500": "400 to 500 NOK per hour",
  "500_600": "500 to 600 NOK per hour",
  "600_plus": "600+ NOK per hour",
};

const HOURS_LABELS: Record<(typeof hoursPrefs)[number], string> = {
  "40": "40",
  "48": "48",
  "60_plus": "60+",
};

const ROTATION_LABELS: Record<(typeof rotationPrefs)[number], string> = {
  "1_2": "1 to 2 weeks",
  "2_4": "2 to 4 weeks",
  flexible: "Flexible",
};

const HOUSING_LABELS: Record<(typeof housingPrefs)[number], string> = {
  company: "Company provided",
  self: "Self-arranged",
  no_preference: "No preference",
};

export default function CandidateProfileWizard({
  entryMode = "default",
  resumeToken = null,
  applyReturnPath = null,
  initialEmailHint = null,
}: CandidateProfileWizardProps) {
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<Mode>("choose");
  const [wizardStep, setWizardStep] = useState(1);

  const [showGdprEntry, setShowGdprEntry] = useState(false);
  const [gdprEntryAccepted, setGdprEntryAccepted] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(() => (initialEmailHint?.includes("@") ? initialEmailHint.trim() : ""));
  const [phoneDial, setPhoneDial] = useState<string>(DEFAULT_EEA_DIAL_PREFIX);
  const [phoneNational, setPhoneNational] = useState("");
  const [currentCountry, setCurrentCountry] = useState("");
  const [outsideRedirectPending, setOutsideRedirectPending] = useState(false);
  const fullPhone = useMemo(() => buildEeaPhone(phoneDial, phoneNational), [phoneDial, phoneNational]);
  const [city, setCity] = useState("");

  const [jobType, setJobType] = useState<JobPreferencesPayload["jobType"] | null>(null);
  const [experienceBand, setExperienceBand] = useState<JobPreferencesPayload["experienceBand"] | null>(null);
  const [salaryHourly, setSalaryHourly] = useState<JobPreferencesPayload["salaryHourly"] | null>(null);
  const [hoursPerWeek, setHoursPerWeek] = useState<JobPreferencesPayload["hoursPerWeek"] | null>(null);
  const [rotation, setRotation] = useState<JobPreferencesPayload["rotation"] | null>(null);
  const [hasDriverLicense, setHasDriverLicense] = useState<boolean | null>(null);
  const [licenseCategories, setLicenseCategories] = useState("");
  const [housing, setHousing] = useState<JobPreferencesPayload["housing"] | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const [shareWithEmployers, setShareWithEmployers] = useState<boolean | null>(null);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const tokenTrim = resumeToken?.trim() ?? "";
  const [resumeBoot, setResumeBoot] = useState<"loading" | "ok" | "error">(() =>
    entryMode === "complete-only" && tokenTrim ? "loading" : "ok",
  );

  const progress = useMemo(() => Math.round((wizardStep / TOTAL_STEPS) * 100), [wizardStep]);

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

  const buildDraft = useCallback((): Record<string, unknown> => {
    return {
      gdprEntryAccepted,
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone: fullPhone,
      currentCountry,
      city,
      jobType,
      experienceBand,
      salaryHourly,
      hoursPerWeek,
      rotation,
      hasPermit: hasDriverLicense === true,
      permitCategories: licenseCategories,
      housing,
      videoUrl,
      shareWithEmployers,
    };
  }, [
    city,
    currentCountry,
    email,
    experienceBand,
    firstName,
    fullPhone,
    gdprEntryAccepted,
    hasDriverLicense,
    housing,
    hoursPerWeek,
    jobType,
    lastName,
    licenseCategories,
    rotation,
    salaryHourly,
    shareWithEmployers,
    videoUrl,
  ]);

  function resetWizard() {
    setWizardStep(1);
    setShowGdprEntry(true);
    setGdprEntryAccepted(false);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneDial(DEFAULT_EEA_DIAL_PREFIX);
    setPhoneNational("");
    setCurrentCountry("");
    setOutsideRedirectPending(false);
    setCity("");
    setJobType(null);
    setExperienceBand(null);
    setSalaryHourly(null);
    setHoursPerWeek(null);
    setRotation(null);
    setHasDriverLicense(null);
    setLicenseCategories("");
    setHousing(null);
    setVideoUrl("");
    setShareWithEmployers(null);
    setSaveStatus("idle");
    setSaveMessage("");
  }

  function startMatchedFlow() {
    setMode("wizard");
    resetWizard();
  }

  function goBack() {
    if (wizardStep <= 1) {
      setMode("choose");
      setShowGdprEntry(false);
      return;
    }
    setWizardStep((current) => Math.max(1, current - 1));
  }

  async function persistProgress(lastCompletedStep: number) {
    const emailKey = email.trim().toLowerCase();
    if (!emailKey.includes("@") || lastCompletedStep < 1 || lastCompletedStep > 8) return;
    const draft = buildDraft();
    try {
      await fetch("/api/candidate-profile/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailKey, lastCompletedStep, draft }),
      });
    } catch {
      /* best-effort */
    }
  }

  async function saveProfile() {
    if (
      !gdprEntryAccepted ||
      shareWithEmployers === null ||
      !jobType ||
      !experienceBand ||
      !salaryHourly ||
      !hoursPerWeek ||
      !rotation ||
      hasDriverLicense === null ||
      !housing
    ) {
      return;
    }

    const preferences = buildJobPreferences({
      jobType,
      experienceBand,
      salaryHourly,
      hoursPerWeek,
      rotation,
      hasPermit: hasDriverLicense,
      permitCategories: licenseCategories.trim() || undefined,
      housing,
    });

    const payload: CandidateProfilePayload = buildCandidateProfilePayload({
      email: email.trim(),
      firstName,
      lastName,
      phone: fullPhone,
      currentCountry,
      city,
      preferences,
      videoUrl,
      shareWithEmployers,
    });

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      window.localStorage.setItem("am_candidate_profile_json", JSON.stringify(payload));
      window.localStorage.setItem("am_candidate_profile_email", payload.email.toLowerCase());
      window.localStorage.setItem("am_candidate_share_employers", shareWithEmployers ? "yes" : "no");

      const response = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { hint?: string; error?: string };
        setSaveStatus("error");
        setSaveMessage(body.hint || body.error || "Could not save profile to database yet.");
        return;
      }

      setSaveStatus("done");
    } catch {
      setSaveStatus("error");
      setSaveMessage("Could not save profile. Your data is stored locally in this browser session.");
    }
  }

  useEffect(() => {
    if (saveStatus !== "done") return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const fromReturn = applyReturnPath ? sanitizeApplyReturnPath(origin, applyReturnPath) : null;
    const target =
      fromReturn || (shareWithEmployers ? jobsBoardAbsoluteUrl("/jobs") : jobsBoardAbsoluteUrl("/jobs?browse=1"));
    const handle = window.setTimeout(() => {
      window.location.assign(target);
    }, 900);
    return () => window.clearTimeout(handle);
  }, [applyReturnPath, saveStatus, shareWithEmployers]);

  useEffect(() => {
    if (entryMode !== "complete-only" || tokenTrim) return;
    setMode("wizard");
    resetWizard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryMode, tokenTrim]);

  useEffect(() => {
    if (entryMode !== "complete-only" || !tokenTrim) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/candidate-profile/resume?token=${encodeURIComponent(tokenTrim)}`);
        const data = (await response.json()) as {
          error?: string;
          draft?: Record<string, unknown>;
          profile_completion_step?: number;
          email?: string;
        };
        if (!response.ok || cancelled) {
          setResumeBoot("error");
          return;
        }
        const completed = data.profile_completion_step ?? 0;
        if (completed >= 9) {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          const fromReturn = applyReturnPath ? sanitizeApplyReturnPath(origin, applyReturnPath) : null;
          window.location.assign(fromReturn || jobsBoardAbsoluteUrl("/jobs"));
          return;
        }
        const d = data.draft && typeof data.draft === "object" ? data.draft : {};
        if (typeof d.firstName === "string") setFirstName(d.firstName);
        if (typeof d.lastName === "string") setLastName(d.lastName);
        if (typeof d.email === "string") setEmail(d.email);
        if (typeof d.phone === "string") {
          const parts = splitEeaPhoneToParts(d.phone);
          setPhoneDial(parts.dial);
          setPhoneNational(parts.nationalDigits);
        }
        if (typeof d.currentCountry === "string") {
          setCurrentCountry(isEeaResidenceCountryName(d.currentCountry) ? d.currentCountry : "");
        }
        if (typeof d.city === "string") setCity(d.city);
        if (typeof d.videoUrl === "string") setVideoUrl(d.videoUrl);
        if (jobTypes.includes(d.jobType as JobPreferencesPayload["jobType"])) {
          setJobType(d.jobType as JobPreferencesPayload["jobType"]);
        }
        if (experienceBands.includes(d.experienceBand as JobPreferencesPayload["experienceBand"])) {
          setExperienceBand(d.experienceBand as JobPreferencesPayload["experienceBand"]);
        }
        if (salaryHourlyOptions.includes(d.salaryHourly as JobPreferencesPayload["salaryHourly"])) {
          setSalaryHourly(d.salaryHourly as JobPreferencesPayload["salaryHourly"]);
        }
        if (hoursPrefs.includes(d.hoursPerWeek as JobPreferencesPayload["hoursPerWeek"])) {
          setHoursPerWeek(d.hoursPerWeek as JobPreferencesPayload["hoursPerWeek"]);
        }
        if (rotationPrefs.includes(d.rotation as JobPreferencesPayload["rotation"])) {
          setRotation(d.rotation as JobPreferencesPayload["rotation"]);
        }
        if (typeof d.hasPermit === "boolean") {
          setHasDriverLicense(d.hasPermit);
        }
        if (typeof d.permitCategories === "string") setLicenseCategories(d.permitCategories);
        if (housingPrefs.includes(d.housing as JobPreferencesPayload["housing"])) {
          setHousing(d.housing as JobPreferencesPayload["housing"]);
        }
        if (typeof d.shareWithEmployers === "boolean") setShareWithEmployers(d.shareWithEmployers);
        if (d.shareWithEmployers === null) setShareWithEmployers(null);
        if (typeof d.gdprEntryAccepted === "boolean") setGdprEntryAccepted(d.gdprEntryAccepted);

        const emailKey = (typeof data.email === "string" ? data.email : typeof d.email === "string" ? d.email : "").trim();
        if (emailKey.includes("@")) {
          window.localStorage.setItem("am_candidate_profile_email", emailKey.toLowerCase());
        }

        setMode("wizard");
        setWizardStep(Math.min(TOTAL_STEPS, completed + 1));
        setShowGdprEntry(!Boolean(d.gdprEntryAccepted));
        if (!cancelled) setResumeBoot("ok");
      } catch {
        if (!cancelled) setResumeBoot("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyReturnPath, entryMode, tokenTrim]);

  function validateCurrentStep(): boolean {
    switch (wizardStep) {
      case 1:
        return jobType !== null;
      case 2:
        return experienceBand !== null;
      case 3:
        return salaryHourly !== null;
      case 4:
        return hoursPerWeek !== null;
      case 5:
        return rotation !== null;
      case 6:
        if (hasDriverLicense === null) return false;
        if (hasDriverLicense && licenseCategories.trim().length < 2) return false;
        return true;
      case 7:
        return housing !== null;
      case 8: {
        const v = videoUrl.trim();
        return Boolean(v && isProbablyVideoUrl(v) && buildEmbedSrc(v));
      }
      case 9:
        return shareWithEmployers !== null;
      default:
        return false;
    }
  }

  async function handleConfirmNext() {
    if (!validateCurrentStep()) return;
    if (wizardStep <= 8) {
      await persistProgress(wizardStep);
      setWizardStep((current) => Math.min(TOTAL_STEPS, current + 1));
      return;
    }
    await saveProfile();
  }

  const stepTitle = STEP_TITLES[wizardStep - 1] ?? "Profile";

  function gdprFormValid(): boolean {
    if (currentCountry === OUTSIDE_EEA_RESIDENCE_VALUE) return false;
    const nationalOk = phoneNational.replace(/\D/g, "").length >= 6;
    return (
      gdprEntryAccepted &&
      email.trim().includes("@") &&
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      nationalOk &&
      isEeaCandidatePhone(fullPhone) &&
      currentCountry.trim().length >= 2 &&
      city.trim().length >= 2
    );
  }

  function dismissGdpr() {
    if (!gdprFormValid()) return;
    window.localStorage.setItem("am_candidate_profile_email", email.trim().toLowerCase());
    setShowGdprEntry(false);
  }

  function startOutsideEeaRedirect() {
    if (outsideRedirectPending) return;
    setOutsideRedirectPending(true);
    window.setTimeout(() => {
      window.location.assign("/non-eu-candidates");
    }, 2200);
  }

  if (entryMode === "complete-only" && tokenTrim && resumeBoot === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0D1B2A] px-6 text-white">
        <p className="text-sm text-white/70">Loading your profile…</p>
      </div>
    );
  }

  if (entryMode === "complete-only" && tokenTrim && resumeBoot === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#0D1B2A] px-6 text-center text-white">
        <p className="max-w-md text-sm text-white/75">This link is invalid or has expired. Request a new reminder from the apply flow.</p>
        <Link
          href="/for-candidates"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-6 text-sm font-bold text-[#0D1B2A]"
        >
          Back to candidate overview
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0D1B2A] text-white">
      <div className="mx-auto w-full max-w-content px-4 py-8 sm:px-6 sm:py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        {mode === "choose" ? (
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
            <div className="mx-auto max-w-3xl rounded-[18px] border border-[#C9A84C]/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:p-8 md:rounded-[20px] md:p-12">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">Candidates</p>
              <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.02em] sm:mt-4 sm:text-4xl md:text-5xl">
                Choose how you want to explore roles
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/75 sm:mt-5 sm:text-base">
                Browse jobs in read-only mode, or build a focused profile to unlock applications and stronger job matching.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2">
                <Link
                  href={jobsBoardAbsoluteUrl("/jobs?browse=1")}
                  className="group inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] border border-[rgba(201,168,76,0.4)] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-[rgba(201,168,76,0.6)] hover:bg-[rgba(201,168,76,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/55 md:min-h-[52px]"
                >
                  Browse Jobs
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={startMatchedFlow}
                  className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] bg-[#C9A84C] px-5 py-3.5 text-sm font-bold text-[#0D1B2A] transition-all duration-300 hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A] md:min-h-[52px]"
                >
                  Get Matched Jobs
                </button>
              </div>

              <p className="mt-6 text-xs leading-relaxed text-white/55 sm:mt-8 sm:text-sm">
                If you continue with matching, you will review GDPR consent first, then complete a short premium profile flow.
              </p>
            </div>
          </motion.div>
        ) : null}

        {mode === "wizard" && !showGdprEntry ? (
          <motion.div
            className="mx-auto max-w-2xl"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C9A84C]">Profile builder</p>
                <h1 className="mt-2 text-2xl font-bold leading-tight sm:mt-3 sm:text-3xl md:text-4xl">{stepTitle}</h1>
                <p className="mt-2 max-w-xl text-sm text-white/70 sm:mt-3 md:text-base">
                  One decision per step. Confirm when you are ready.
                </p>
              </div>
              <div className="w-full shrink-0 rounded-[12px] border border-[#C9A84C]/30 bg-[rgba(10,15,24,0.85)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-4 md:max-w-xs">
                <div className="flex items-center justify-between text-xs font-medium text-white/70">
                  <span id="am-profile-step-label">
                    Step {wizardStep} of {TOTAL_STEPS}
                  </span>
                  <span className="tabular-nums text-[#C9A84C]" aria-hidden>
                    {progress}%
                  </span>
                </div>
                <div
                  className="mt-2.5 h-3 overflow-hidden rounded-full border border-[#C9A84C]/25 bg-[#0A0F18] sm:h-3.5"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-valuetext={`Step ${wizardStep} of ${TOTAL_STEPS}, ${progress} percent complete`}
                  aria-labelledby="am-profile-step-label"
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8953f] via-[#C9A84C] to-[#d4b56a] shadow-[0_0_14px_rgba(201,168,76,0.55)]"
                    initial={false}
                    animate={{ width: `${progress}%` }}
                    transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
              </div>
            </div>

            <form
              className="mt-6 rounded-[18px] border border-[#C9A84C]/18 bg-[linear-gradient(165deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-5 shadow-[0_14px_44px_rgba(0,0,0,0.32)] sm:mt-8 sm:p-7 md:mt-10 md:p-10"
              onSubmit={(event) => {
                event.preventDefault();
                void handleConfirmNext();
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                const el = event.target;
                if (!(el instanceof HTMLInputElement) || el.type !== "radio") return;
                if (!validateCurrentStep()) return;
                event.preventDefault();
                void handleConfirmNext();
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={wizardStep}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                  transition={transition}
                >
                  {wizardStep === 1 ? (
                    <RadioFieldset legend="Which work type fits you best?">
                      {jobTypes.map((value) => (
                        <RadioRow
                          key={value}
                          name="jobType"
                          label={value}
                          checked={jobType === value}
                          onChange={() => setJobType(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 2 ? (
                    <RadioFieldset legend="How many years of relevant experience do you have?">
                      {experienceBands.map((value) => (
                        <RadioRow
                          key={value}
                          name="experienceBand"
                          label={EXPERIENCE_LABELS[value]}
                          checked={experienceBand === value}
                          onChange={() => setExperienceBand(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 3 ? (
                    <RadioFieldset legend="What hourly rate are you aiming for?">
                      {salaryHourlyOptions.map((value) => (
                        <RadioRow
                          key={value}
                          name="salaryHourly"
                          label={SALARY_LABELS[value]}
                          checked={salaryHourly === value}
                          onChange={() => setSalaryHourly(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 4 ? (
                    <RadioFieldset legend="How many hours per week do you prefer?">
                      {hoursPrefs.map((value) => (
                        <RadioRow
                          key={value}
                          name="hoursPerWeek"
                          label={HOURS_LABELS[value]}
                          checked={hoursPerWeek === value}
                          onChange={() => setHoursPerWeek(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 5 ? (
                    <RadioFieldset legend="What rotation rhythm do you prefer?">
                      {rotationPrefs.map((value) => (
                        <RadioRow
                          key={value}
                          name="rotation"
                          label={ROTATION_LABELS[value]}
                          checked={rotation === value}
                          onChange={() => setRotation(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 6 ? (
                    <div className="space-y-5">
                      <RadioFieldset legend="Do you hold a valid driving licence for work in Norway?">
                        <RadioRow name="dl" label="Yes" checked={hasDriverLicense === true} onChange={() => setHasDriverLicense(true)} />
                        <RadioRow name="dl" label="No" checked={hasDriverLicense === false} onChange={() => setHasDriverLicense(false)} />
                      </RadioFieldset>
                      {hasDriverLicense === true ? (
                        <label className="flex flex-col gap-2 text-sm text-white/80">
                          Licence categories (for example CE, C1, BE)
                          <input
                            value={licenseCategories}
                            onChange={(event) => setLicenseCategories(event.target.value)}
                            className="min-h-[44px] rounded-[10px] border border-white/15 bg-[#0A0F18] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)]"
                            autoComplete="off"
                          />
                        </label>
                      ) : null}
                    </div>
                  ) : null}

                  {wizardStep === 7 ? (
                    <RadioFieldset legend="What housing setup do you prefer?">
                      {housingPrefs.map((value) => (
                        <RadioRow
                          key={value}
                          name="housing"
                          label={HOUSING_LABELS[value]}
                          checked={housing === value}
                          onChange={() => setHousing(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 8 ? (
                    <div className="space-y-5">
                      <p className="text-sm text-white/70">Paste a YouTube, Vimeo, or Loom link. We embed a preview below.</p>
                      <label className="flex flex-col gap-2 text-sm text-white/80">
                        Video link
                        <input
                          value={videoUrl}
                          onChange={(event) => setVideoUrl(event.target.value)}
                          placeholder="https://"
                          className="min-h-[44px] rounded-[10px] border border-white/15 bg-[#0A0F18] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)]"
                        />
                      </label>
                      <div className="rounded-[12px] border border-[rgba(201,168,76,0.18)] bg-[#0A0F18] p-4">
                        {!videoUrl.trim() ? (
                          <p className="text-sm text-white/55">Preview will appear here.</p>
                        ) : !isProbablyVideoUrl(videoUrl.trim()) ? (
                          <p className="text-sm text-white/60">Use a supported host: YouTube, Vimeo, or Loom.</p>
                        ) : (
                          <div className="aspect-video w-full overflow-hidden rounded-[10px] border border-white/10">
                            <iframe
                              title="Video intro preview"
                              className="h-full w-full"
                              src={buildEmbedSrc(videoUrl.trim()) ?? undefined}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {wizardStep === 9 ? (
                    <div className="space-y-5">
                      <RadioFieldset legend="Share profile with employers?">
                        <RadioRow
                          name="share"
                          label="Yes, share for hiring matches"
                          checked={shareWithEmployers === true}
                          onChange={() => setShareWithEmployers(true)}
                        />
                        <RadioRow
                          name="share"
                          label="No, browse only"
                          checked={shareWithEmployers === false}
                          onChange={() => setShareWithEmployers(false)}
                        />
                      </RadioFieldset>
                      <p className="text-xs text-white/50">
                        YES enables applications and employer matching. NO still saves your profile, but keeps browsing read-only.
                      </p>
                      {saveStatus === "error" ? <p className="text-sm text-red-300">{saveMessage}</p> : null}
                      {saveStatus === "saving" ? <p className="text-sm text-white/70">Saving…</p> : null}
                      {saveStatus === "done" ? (
                        <div className="flex flex-col items-center gap-3 py-2 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.12)]">
                            <Check className="h-7 w-7 text-[#C9A84C]" />
                          </div>
                          <p className="text-sm text-white/70">
                            Redirecting you to jobs{shareWithEmployers ? "" : " in browse mode"}.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              {wizardStep !== 9 || saveStatus !== "done" ? (
                <div className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={goBack}
                    className="min-h-[48px] w-full touch-manipulation rounded-[12px] border border-white/18 px-5 text-sm font-semibold text-white/80 transition-colors hover:border-[#C9A84C]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:w-auto sm:min-w-[120px]"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={saveStatus === "saving" || (wizardStep === 9 && shareWithEmployers === null)}
                    className="min-h-[48px] w-full touch-manipulation rounded-[12px] bg-[#C9A84C] px-6 text-sm font-bold text-[#0D1B2A] shadow-[0_8px_24px_rgba(201,168,76,0.22)] transition-colors hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A] disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:min-w-[180px]"
                  >
                    {wizardStep === 9 ? (saveStatus === "saving" ? "Saving…" : "Confirm & Next") : "Confirm & Next"}
                  </button>
                </div>
              ) : null}
            </form>
          </motion.div>
        ) : null}
      </div>

      <AnimatePresence>
        {mode === "wizard" && showGdprEntry ? (
          <motion.div
            className="fixed inset-0 z-[280] flex items-end justify-center bg-[rgba(13,27,42,0.9)] px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8 backdrop-blur-md sm:items-center sm:px-4 sm:pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            role="presentation"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                /* do not close on backdrop — must use Cancel */
              }
            }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={transition}
              className="max-h-[min(88dvh,720px)] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-[20px] border border-[#C9A84C]/28 border-t-2 border-t-[#C9A84C] bg-[#0A0F18] p-5 shadow-[0_-12px_48px_rgba(0,0,0,0.45)] sm:rounded-[18px] sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-labelledby="am-candidate-gdpr-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)]">
                  <Shield className="h-5 w-5 text-[#C9A84C]" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">GDPR</p>
                  <h2 id="am-candidate-gdpr-title" className="text-lg font-bold sm:text-xl">
                    Privacy first
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                We process your data to operate recruitment matching for Norwegian employers. You can withdraw consent later by
                contacting{" "}
                <a className="text-[#C9A84C] hover:underline" href="mailto:support@arbeidmatch.no">
                  support@arbeidmatch.no
                </a>
                .
              </p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <GdprInput label="First name" value={firstName} onChange={setFirstName} autoComplete="given-name" />
                <GdprInput label="Last name" value={lastName} onChange={setLastName} autoComplete="family-name" />
                <GdprInput label="Email" type="email" value={email} onChange={setEmail} className="sm:col-span-2" autoComplete="email" />

                <label className="flex flex-col gap-2 text-sm text-white/80 sm:col-span-2">
                  <span className="font-medium text-white">Country of residence</span>
                  <span className="text-xs font-normal leading-snug text-white/55">
                    Candidate registration on ArbeidMatch is for people who live in the EU or EEA.
                  </span>
                  <select
                    value={currentCountry}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCurrentCountry(v);
                      if (v !== OUTSIDE_EEA_RESIDENCE_VALUE) setOutsideRedirectPending(false);
                    }}
                    className="min-h-[48px] w-full rounded-[10px] border border-white/15 bg-[#0D1B2A] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)]"
                    autoComplete="country"
                  >
                    <option value="">Select your country</option>
                    {eeaDialOptionsSortedByCountry().map((c) => (
                      <option key={c.iso} value={c.country}>
                        {c.country}
                      </option>
                    ))}
                    <option value={OUTSIDE_EEA_RESIDENCE_VALUE}>I live outside the EU / EEA</option>
                  </select>
                </label>

                {currentCountry === OUTSIDE_EEA_RESIDENCE_VALUE ? (
                  <div className="space-y-4 rounded-[12px] border border-amber-400/35 bg-amber-500/[0.09] p-4 sm:col-span-2">
                    <p className="text-sm leading-relaxed text-white/90">
                      Thank you for your interest. This candidate path is reserved for residents inside the EU or European
                      Economic Area. In a moment we will open a page with DSB-focused guides that explain how international
                      hiring and compliance work in Norway.
                    </p>
                    {outsideRedirectPending ? (
                      <p className="text-sm font-medium text-[#C9A84C]" role="status" aria-live="polite">
                        Taking you to the international candidate page…
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={startOutsideEeaRedirect}
                        className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] shadow-[0_8px_22px_rgba(201,168,76,0.25)] transition-colors hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F18]"
                      >
                        Continue to international information
                      </button>
                    )}
                  </div>
                ) : currentCountry ? (
                  <>
                    <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-stretch">
                      <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm text-white/80">
                        <span className="font-medium text-white">Phone (EU / EEA prefix)</span>
                        <select
                          value={phoneDial}
                          onChange={(e) => setPhoneDial(e.target.value)}
                          className="min-h-[48px] w-full rounded-[10px] border border-white/15 bg-[#0D1B2A] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)]"
                        >
                          {eeaDialOptionsSortedByCountry().map((c) => (
                            <option key={`dial-${c.iso}`} value={c.dial}>
                              {c.dial} · {c.country}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex min-w-0 flex-[1.4] flex-col gap-2 text-sm text-white/80">
                        <span className="font-medium text-white">Mobile number</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          value={phoneNational}
                          onChange={(e) => setPhoneNational(e.target.value.replace(/\D/g, ""))}
                          placeholder="Digits only, no leading 0"
                          className="min-h-[48px] w-full rounded-[10px] border border-white/15 bg-[#0D1B2A] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[rgba(201,168,76,0.45)]"
                        />
                      </label>
                    </div>
                    <GdprInput label="City" value={city} onChange={setCity} className="sm:col-span-2" autoComplete="address-level2" />
                  </>
                ) : null}
              </div>

              {currentCountry && currentCountry !== OUTSIDE_EEA_RESIDENCE_VALUE ? (
                <label className="mt-5 flex min-h-[48px] cursor-pointer items-start gap-3 rounded-[12px] border border-white/12 bg-[#0D1B2A] p-4 text-sm text-white/75 focus-within:ring-2 focus-within:ring-[#C9A84C]/45">
                  <input
                    type="checkbox"
                    checked={gdprEntryAccepted}
                    onChange={(event) => setGdprEntryAccepted(event.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 rounded border-white/30 accent-[#C9A84C] focus-visible:outline-none"
                  />
                  <span>
                    I agree to the processing of my personal data according to the{" "}
                    <Link href="/privacy" className="font-semibold text-[#C9A84C] hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              ) : null}
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setMode("choose");
                    setShowGdprEntry(false);
                    setOutsideRedirectPending(false);
                    setCurrentCountry("");
                    setPhoneDial(DEFAULT_EEA_DIAL_PREFIX);
                    setPhoneNational("");
                  }}
                  className="min-h-[48px] w-full touch-manipulation rounded-[12px] border border-white/18 px-5 text-sm font-semibold text-white/80 hover:border-[#C9A84C]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 sm:w-auto"
                >
                  Cancel
                </button>
                {currentCountry !== OUTSIDE_EEA_RESIDENCE_VALUE ? (
                  <button
                    type="button"
                    disabled={!gdprFormValid()}
                    onClick={dismissGdpr}
                    className="min-h-[48px] w-full touch-manipulation rounded-[12px] bg-[#C9A84C] px-6 text-sm font-bold text-[#0D1B2A] shadow-[0_8px_22px_rgba(201,168,76,0.25)] hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F18] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
                  >
                    Continue
                  </button>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function GdprInput({
  label,
  value,
  onChange,
  type = "text",
  className = "",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  className?: string;
  autoComplete?: string;
}) {
  return (
    <label className={`flex flex-col gap-2 text-sm text-white/80 ${className}`}>
      {label}
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[44px] rounded-[10px] border border-white/15 bg-[#0D1B2A] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)]"
      />
    </label>
  );
}

function RadioFieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-0 p-0">
      <legend className="mb-4 text-lg font-semibold text-white">{legend}</legend>
      <div className="space-y-2">{children}</div>
    </fieldset>
  );
}

function RadioRow({
  name,
  label,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const id = `${name}-${label.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "")}`;
  return (
    <label
      htmlFor={id}
      className={`flex min-h-[48px] cursor-pointer touch-manipulation items-center gap-3 rounded-[12px] border px-4 py-3.5 text-sm transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#C9A84C]/50 focus-within:ring-offset-2 focus-within:ring-offset-[#0D1B2A] ${
        checked ? "border-[#C9A84C]/55 bg-[rgba(201,168,76,0.14)] text-white shadow-[0_0_0_1px_rgba(201,168,76,0.12)]" : "border-white/12 text-white/78 hover:border-[#C9A84C]/35"
      }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-[18px] w-[18px] shrink-0 accent-[#C9A84C] focus:outline-none"
      />
      <span className="leading-snug">{label}</span>
    </label>
  );
}
