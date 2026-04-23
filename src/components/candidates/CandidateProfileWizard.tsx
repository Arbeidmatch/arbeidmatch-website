"use client";

import Link from "next/link";
import { Children, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CheckCircle, Lightbulb, Shield, Upload, X } from "lucide-react";

import { sanitizeApplyReturnPath } from "@/lib/candidates/applyReturnPath";
import { jobsBoardAbsoluteUrl } from "@/lib/jobs/jobsBoardOrigin";
import { buildCandidateProfilePayload, buildJobPreferences } from "@/lib/candidates/linearProfilePayload";
import type { CandidateProfilePayload, JobPreferencesPayload } from "@/lib/candidates/profileSchema";
import {
  experienceBands,
  housingPrefs,
  jobTypes,
  hoursPrefs,
  normalizeCandidateVideoUrlInput,
  resolveWorkTypeFromCategoryString,
  rotationHumanLabels,
  rotationPrefs,
  salaryHourlyHumanLabels,
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
import MobileCardPager from "@/components/ui/MobileCardPager";

type Mode = "choose" | "wizard";

/** Ensures URL() can parse (adds https if missing). */
function normalizeVideoUrlInput(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

function parseYouTubeEmbed(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./i, "").toLowerCase();
  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = u.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
    const parts = u.pathname.split("/").filter(Boolean);
    const embedIdx = parts.indexOf("embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      return `https://www.youtube.com/embed/${encodeURIComponent(parts[embedIdx + 1])}`;
    }
    const shortsIdx = parts.indexOf("shorts");
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) {
      return `https://www.youtube.com/embed/${encodeURIComponent(parts[shortsIdx + 1])}`;
    }
  }
  return null;
}

function parseVimeoEmbed(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!u.hostname.toLowerCase().includes("vimeo.com")) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const videoIdx = parts.indexOf("video");
  if (videoIdx >= 0 && parts[videoIdx + 1] && /^\d+$/.test(parts[videoIdx + 1])) {
    return `https://player.vimeo.com/video/${parts[videoIdx + 1]}`;
  }
  for (const p of parts) {
    if (/^\d+$/.test(p)) return `https://player.vimeo.com/video/${p}`;
  }
  return null;
}

function parseLoomEmbed(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!u.hostname.toLowerCase().includes("loom.com")) return null;
  const m = u.pathname.match(/\/(?:share|embed)\/([^/?#]+)/);
  if (m?.[1]) return `https://www.loom.com/embed/${m[1]}`;
  return null;
}

function parseTikTokEmbed(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (!u.hostname.toLowerCase().endsWith("tiktok.com")) return null;
  const m = u.pathname.match(/\/video\/(\d+)/);
  if (m?.[1]) return `https://www.tiktok.com/embed/v2/${m[1]}`;
  return null;
}

/** Resolves a public video URL to an iframe-safe embed URL, or null if unsupported / invalid. */
function getEmbedUrl(raw: string): string | null {
  const normalized = normalizeVideoUrlInput(raw);
  if (!normalized) return null;
  try {
    return (
      parseYouTubeEmbed(normalized) ?? parseVimeoEmbed(normalized) ?? parseLoomEmbed(normalized) ?? parseTikTokEmbed(normalized)
    );
  } catch {
    return null;
  }
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
const MAX_CV_UPLOAD_BYTES = 5 * 1024 * 1024;

type CvExtractResult = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  current_location: string | null;
  job_categories: string[] | null;
  years_experience: string | number | null;
  skills: string[] | null;
  languages: { language: string; level?: string | null }[] | null;
  education: string[] | null;
  certifications: string[] | null;
  driving_license: string[] | null;
};

const STEP_TITLES = [
  "Work type",
  "Experience",
  "Expected hourly rate",
  "Hours per week",
  "Preferred rotation",
  "Driving licence",
  "Housing",
  "Video intro",
  "Data Privacy & Consent",
] as const;

const EXPERIENCE_LABELS: Record<(typeof experienceBands)[number], string> = {
  "0_2": "0 to 2 years",
  "2_5": "2 to 5 years",
  "5_10": "5 to 10 years",
  "10_plus": "10+ years",
};

const SALARY_LABELS = salaryHourlyHumanLabels;

const HOURS_LABELS: Record<(typeof hoursPrefs)[number], string> = {
  "37.5": "37.5 hours per week (standard legal limit)",
  "48": "48 hours per week (maximum with overtime)",
  "54_plus": "54+ hours per week (exceptional circumstances)",
};

const ROTATION_LABELS = rotationHumanLabels;

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

  const [videoHintTimerReady, setVideoHintTimerReady] = useState(false);
  const [videoHintClosedByUser, setVideoHintClosedByUser] = useState(false);
  const [videoHintManualOpen, setVideoHintManualOpen] = useState(false);

  const [shareWithEmployers, setShareWithEmployers] = useState<boolean | null>(null);
  const [gdprConsentProcessing, setGdprConsentProcessing] = useState(false);
  const [gdprConsentShareProfile, setGdprConsentShareProfile] = useState(false);
  const [gdprConsentMarketing, setGdprConsentMarketing] = useState(false);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [cvUploadStatus, setCvUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [cvUploadMessage, setCvUploadMessage] = useState("");
  const [cvUploaded, setCvUploaded] = useState(false);
  const [extractedCertifications, setExtractedCertifications] = useState<string[]>([]);
  const [extractedEnglishLevel, setExtractedEnglishLevel] = useState<string | null>(null);

  const tokenTrim = resumeToken?.trim() ?? "";
  const [resumeBoot, setResumeBoot] = useState<"loading" | "ok" | "error">(() =>
    entryMode === "complete-only" && tokenTrim ? "loading" : "ok",
  );
  const [prefilledFields, setPrefilledFields] = useState<Record<string, boolean>>({});
  const [showResumeAnalyzedBanner, setShowResumeAnalyzedBanner] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [welcomeBackStatus, setWelcomeBackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [welcomeBackMessage, setWelcomeBackMessage] = useState("");

  const progress = useMemo(() => Math.round((wizardStep / TOTAL_STEPS) * 100), [wizardStep]);

  const videoEmbedSrc = useMemo(() => {
    const v = videoUrl.trim();
    return v ? getEmbedUrl(v) : null;
  }, [videoUrl]);

  useEffect(() => {
    if (wizardStep !== 8) {
      queueMicrotask(() => {
        setVideoHintTimerReady(false);
        setVideoHintClosedByUser(false);
        setVideoHintManualOpen(false);
      });
      return;
    }
    if (videoUrl.trim()) {
      queueMicrotask(() => {
        setVideoHintTimerReady(false);
        setVideoHintManualOpen(false);
      });
      return;
    }
    if (videoHintManualOpen) return;
    if (videoHintClosedByUser) return;
    const id = window.setTimeout(() => setVideoHintTimerReady(true), 3000);
    return () => window.clearTimeout(id);
  }, [wizardStep, videoUrl, videoHintClosedByUser, videoHintManualOpen]);

  const showVideoHintCard =
    wizardStep === 8 &&
    !videoUrl.trim() &&
    (videoHintManualOpen || (videoHintTimerReady && !videoHintClosedByUser));

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const };

  const markPrefilled = useCallback((field: string) => {
    setPrefilledFields((prev) => ({ ...prev, [field]: true }));
  }, []);

  const isPrefilled = useCallback((field: string) => Boolean(prefilledFields[field]), [prefilledFields]);

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
      videoUrl: (() => {
        const v = videoUrl.trim();
        if (!v) return "";
        return normalizeVideoUrlInput(v) ?? v;
      })(),
      shareWithEmployers,
      gdprMarketing: gdprConsentMarketing,
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
    gdprConsentMarketing,
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
    setVideoHintTimerReady(false);
    setVideoHintClosedByUser(false);
    setVideoHintManualOpen(false);
    setShareWithEmployers(null);
    setGdprConsentProcessing(false);
    setGdprConsentShareProfile(false);
    setGdprConsentMarketing(false);
    setPrefilledFields({});
    setShowResumeAnalyzedBanner(false);
    setSaveStatus("idle");
    setSaveMessage("");
    setCvUploadStatus("idle");
    setCvUploadMessage("");
    setCvUploaded(false);
    setExtractedCertifications([]);
    setExtractedEnglishLevel(null);
  }

  function startMatchedFlow() {
    setMode("wizard");
    resetWizard();
  }

  function mapYearsExperienceToBand(value: string | number | null): JobPreferencesPayload["experienceBand"] | null {
    if (value === null || value === undefined) return null;
    const raw = typeof value === "number" ? String(value) : value.trim();
    const match = raw.match(/\d+(\.\d+)?/);
    const numericYears = match ? Number.parseFloat(match[0]) : Number.NaN;
    if (Number.isNaN(numericYears)) return null;
    if (numericYears < 2) return "0_2";
    if (numericYears < 5) return "2_5";
    if (numericYears < 10) return "5_10";
    return "10_plus";
  }

  async function applyExtractedCvFields(extracted: CvExtractResult) {
    let appliedAny = false;
    const applyWithDelay = async (field: string, apply: () => void) => {
      apply();
      markPrefilled(field);
      appliedAny = true;
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    };

    if (extracted.full_name) {
      const parts = extracted.full_name.trim().split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        await applyWithDelay("firstName", () => setFirstName(parts[0]));
        await applyWithDelay("lastName", () => setLastName(parts.slice(1).join(" ")));
      }
    }

    if (extracted.email && extracted.email.includes("@")) {
      const emailValue = extracted.email.trim().toLowerCase();
      await applyWithDelay("email", () => setEmail(emailValue));
    }

    if (extracted.phone && isEeaCandidatePhone(extracted.phone)) {
      const parts = splitEeaPhoneToParts(extracted.phone);
      await applyWithDelay("phone", () => {
        setPhoneDial(parts.dial);
        setPhoneNational(parts.nationalDigits);
      });
    }

    const locationCandidate = (extracted.current_location || extracted.nationality || "").trim();
    if (locationCandidate && isEeaResidenceCountryName(locationCandidate)) {
      await applyWithDelay("currentCountry", () => setCurrentCountry(locationCandidate));
    }

    if (extracted.job_categories?.length) {
      const mapped = extracted.job_categories
        .map((category) => resolveWorkTypeFromCategoryString(category))
        .find((value): value is JobPreferencesPayload["jobType"] => value !== null);
      if (mapped) await applyWithDelay("jobType", () => setJobType(mapped));
    }

    const experienceMapped = mapYearsExperienceToBand(extracted.years_experience);
    if (experienceMapped) await applyWithDelay("experienceBand", () => setExperienceBand(experienceMapped));

    if (extracted.driving_license?.length) {
      const licenseList = extracted.driving_license.join(", ");
      await applyWithDelay("hasDriverLicense", () => setHasDriverLicense(true));
      await applyWithDelay("licenseCategories", () => setLicenseCategories(licenseList));
    }

    if (Array.isArray(extracted.certifications) && extracted.certifications.length > 0) {
      setExtractedCertifications(extracted.certifications);
    }
    if (Array.isArray(extracted.languages) && extracted.languages.length > 0) {
      const english = extracted.languages.find((item) => /english/i.test(item.language || ""));
      if (english?.level?.trim()) setExtractedEnglishLevel(english.level.trim());
    }

    setShowResumeAnalyzedBanner(appliedAny);
  }

  async function uploadCvForExtraction(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "doc", "docx"].includes(extension)) {
      setCvUploadStatus("error");
      setCvUploadMessage("Invalid file format. Please upload PDF, DOC, or DOCX.");
      return;
    }
    if (file.size > MAX_CV_UPLOAD_BYTES) {
      setCvUploadStatus("error");
      setCvUploadMessage("File too large. Maximum allowed size is 5MB.");
      return;
    }

    setCvUploadStatus("uploading");
    setCvUploadMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/candidate-profile/resume", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; extracted?: CvExtractResult };
      if (!response.ok || !data.extracted) {
        setCvUploadStatus("error");
        setCvUploadMessage(data.error || "Could not extract CV details right now.");
        return;
      }
      await applyExtractedCvFields(data.extracted);
      setCvUploaded(true);
      setCvUploadStatus("success");
      setCvUploadMessage("CV uploaded. We pre-filled the profile fields we could extract.");
      setMode("wizard");
      setShowGdprEntry(true);
    } catch {
      setCvUploadStatus("error");
      setCvUploadMessage("Unexpected error while uploading your CV.");
    }
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
    const gdprConsent = gdprConsentProcessing && gdprConsentShareProfile;
    if (
      !gdprEntryAccepted ||
      !gdprConsent ||
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

    const resolvedVideoUrl = (() => {
      const v = videoUrl.trim();
      if (!v) return "";
      const n = normalizeCandidateVideoUrlInput(v);
      return typeof n === "string" ? n.trim() : "";
    })();

    const payload: CandidateProfilePayload = buildCandidateProfilePayload({
      email: email.trim(),
      firstName,
      lastName,
      phone: fullPhone,
      currentCountry,
      city,
      preferences,
      videoUrl: resolvedVideoUrl,
      shareWithEmployers: gdprConsentShareProfile,
    });
    payload.cvUploaded = cvUploaded;
    if (extractedCertifications.length > 0) payload.extractedCertifications = extractedCertifications;
    if (extractedEnglishLevel) payload.englishLevel = extractedEnglishLevel;

    setSaveStatus("saving");
    setSaveMessage("");

    try {
      window.localStorage.setItem("am_candidate_profile_json", JSON.stringify(payload));
      window.localStorage.setItem("am_candidate_profile_email", payload.email.toLowerCase());
      window.localStorage.setItem("am_candidate_share_employers", gdprConsentShareProfile ? "yes" : "no");

      const response = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          gdpr_consent: gdprConsent,
          gdpr_marketing: gdprConsentMarketing,
          gdpr_version: "1.0",
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { hint?: string; error?: string };
        setSaveStatus("error");
        setSaveMessage(body.hint || body.error || "Could not save profile to database yet.");
        return;
      }

      const body = (await response.json().catch(() => ({}))) as { candidateId?: string };
      if (body.candidateId) {
        await fetch("/api/candidates/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate_id: body.candidateId }),
        }).catch(() => null);
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
    queueMicrotask(() => {
      setMode("wizard");
      resetWizard();
    });
  }, [entryMode, tokenTrim]);

  useEffect(() => {
    if (tokenTrim) return;
    if (!initialEmailHint || !initialEmailHint.includes("@")) return;
    setEmail(initialEmailHint.trim().toLowerCase());
    setShowWelcomeBackModal(true);
  }, [initialEmailHint, tokenTrim]);

  async function continueWithEmailMagicLink() {
    const emailKey = email.trim().toLowerCase();
    if (!emailKey.includes("@")) return;
    setWelcomeBackStatus("sending");
    setWelcomeBackMessage("");
    try {
      const continueRes = await fetch("/api/candidate-profile/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailKey, mode: "continue_url" }),
      });
      const continueJson = (await continueRes.json().catch(() => ({}))) as { continueUrl?: string };
      if (continueRes.ok && continueJson.continueUrl) {
        window.location.assign(continueJson.continueUrl);
        return;
      }

      const sendRes = await fetch("/api/candidate-profile/reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailKey, mode: "send_email" }),
      });
      if (!sendRes.ok) {
        setWelcomeBackStatus("error");
        setWelcomeBackMessage("Could not send login link right now. Please try again.");
        return;
      }
      setWelcomeBackStatus("sent");
      setWelcomeBackMessage("We sent you a secure login link by email.");
    } catch {
      setWelcomeBackStatus("error");
      setWelcomeBackMessage("Could not send login link right now. Please try again.");
    }
  }

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
        if (typeof d.jobType === "string") {
          const coerced = resolveWorkTypeFromCategoryString(d.jobType);
          if (coerced) setJobType(coerced);
        }
        if (experienceBands.includes(d.experienceBand as JobPreferencesPayload["experienceBand"])) {
          setExperienceBand(d.experienceBand as JobPreferencesPayload["experienceBand"]);
        }
        const draftSalary = d.salaryHourly;
        const salaryNormalized =
          typeof draftSalary === "string" && draftSalary.trim() === "400_500"
            ? "400_450"
            : typeof draftSalary === "string" && draftSalary.trim() === "500_600"
              ? "500_550"
              : draftSalary;
        if (salaryHourlyOptions.includes(salaryNormalized as JobPreferencesPayload["salaryHourly"])) {
          setSalaryHourly(salaryNormalized as JobPreferencesPayload["salaryHourly"]);
        }
        const draftHours = d.hoursPerWeek;
        const hoursNormalized =
          draftHours === 37.5 || draftHours === "37,5"
            ? "37.5"
            : draftHours === 48
              ? "48"
              : typeof draftHours === "string" && (draftHours.trim() === "54+" || draftHours.trim() === "54 +")
                ? "54_plus"
                : draftHours;
        if (hoursPrefs.includes(hoursNormalized as JobPreferencesPayload["hoursPerWeek"])) {
          setHoursPerWeek(hoursNormalized as JobPreferencesPayload["hoursPerWeek"]);
        }
        const draftRot = d.rotation;
        const rotationNormalized =
          typeof draftRot === "string" && draftRot.trim() === "4_weeks_on_2_weeks_off"
            ? "4on_2off"
            : typeof draftRot === "string" && draftRot.trim() === "6_weeks_on_2_weeks_off"
              ? "6on_2off"
              : typeof draftRot === "string" && (draftRot.trim() === "1_2" || draftRot.trim() === "2_4" || draftRot.trim() === "flexible")
                ? "4on_2off"
                : draftRot;
        if (rotationPrefs.includes(rotationNormalized as JobPreferencesPayload["rotation"])) {
          setRotation(rotationNormalized as JobPreferencesPayload["rotation"]);
        }
        if (typeof d.hasPermit === "boolean") {
          setHasDriverLicense(d.hasPermit);
        }
        if (typeof d.permitCategories === "string") setLicenseCategories(d.permitCategories);
        if (housingPrefs.includes(d.housing as JobPreferencesPayload["housing"])) {
          setHousing(d.housing as JobPreferencesPayload["housing"]);
        }
        if (typeof d.shareWithEmployers === "boolean") {
          setShareWithEmployers(d.shareWithEmployers);
          setGdprConsentShareProfile(d.shareWithEmployers);
          setGdprConsentProcessing(d.shareWithEmployers);
        }
        if (typeof d.gdprMarketing === "boolean") {
          setGdprConsentMarketing(d.gdprMarketing);
        }
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
        // Only require Yes/No. Categories are optional in the schema; a min-length
        // rule here wrongly blocked valid single-letter classes (e.g. B, C, T).
        return hasDriverLicense !== null;
      case 7:
        return housing !== null;
      case 8: {
        const v = String(normalizeCandidateVideoUrlInput(videoUrl.trim()) ?? "").trim();
        return Boolean(v && getEmbedUrl(v));
      }
      case 9:
        return gdprConsentProcessing && gdprConsentShareProfile;
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
                Find Your Next Job in Norway
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/75 sm:mt-5 sm:text-base">
                Browse open positions or create your profile for personalised job matching.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:gap-4">
                <a
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] bg-[#C9A84C] px-5 py-3.5 text-sm font-bold text-[#0D1B2A] transition-all duration-300 hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1B2A] md:min-h-[52px]"
                >
                  Browse Jobs
                </a>
                <button
                  type="button"
                  onClick={startMatchedFlow}
                  className="group inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] border border-[rgba(201,168,76,0.4)] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-[rgba(201,168,76,0.6)] hover:bg-[rgba(201,168,76,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/55 md:min-h-[52px]"
                >
                  {entryMode === "complete-only" ? "Complete Profile" : "Create My Profile"}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
                </button>
              </div>

              <div className="mt-5 rounded-[12px] border border-white/12 bg-[rgba(255,255,255,0.03)] p-4">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[rgba(201,168,76,0.4)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(201,168,76,0.08)]">
                  <Upload className="h-4 w-4 text-[#C9A84C]" aria-hidden />
                  <span>{cvUploadStatus === "uploading" ? "Uploading CV..." : "Upload CV (PDF, DOC, DOCX, max 5MB)"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    disabled={cvUploadStatus === "uploading"}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      void uploadCvForExtraction(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
                {cvUploadMessage ? (
                  <p className={`mt-3 text-xs ${cvUploadStatus === "error" ? "text-red-300" : "text-white/70"}`}>{cvUploadMessage}</p>
                ) : null}
              </div>

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
            {showResumeAnalyzedBanner ? (
              <div className="mb-4 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/10 p-4 text-sm text-white/80 md:mb-6">
                Your CV has been analysed. Please review and complete the fields below.
              </div>
            ) : null}
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
                          prefilled={isPrefilled("jobType") && jobType === value}
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
                          prefilled={isPrefilled("experienceBand") && experienceBand === value}
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
                          prefilled={isPrefilled("salaryHourly") && salaryHourly === value}
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
                          prefilled={isPrefilled("hoursPerWeek") && hoursPerWeek === value}
                          onChange={() => setHoursPerWeek(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 5 ? (
                    <div className="space-y-3">
                      <RadioFieldset legend="What rotation rhythm do you prefer?">
                        {rotationPrefs.map((value) => (
                          <RadioRow
                            key={value}
                            name="rotation"
                            label={ROTATION_LABELS[value]}
                            checked={rotation === value}
                            prefilled={isPrefilled("rotation") && rotation === value}
                            onChange={() => setRotation(value)}
                          />
                        ))}
                      </RadioFieldset>
                      <p className="text-sm leading-relaxed text-white/55">
                        Currently these are the available rotation patterns. More options will be added soon.
                      </p>
                    </div>
                  ) : null}

                  {wizardStep === 6 ? (
                    <div className="space-y-5">
                      <RadioFieldset legend="Do you hold a valid driving licence for work in Norway?">
                        <RadioRow
                          name="dl"
                          label="Yes"
                          checked={hasDriverLicense === true}
                          prefilled={isPrefilled("hasDriverLicense") && hasDriverLicense === true}
                          onChange={() => setHasDriverLicense(true)}
                        />
                        <RadioRow
                          name="dl"
                          label="No"
                          checked={hasDriverLicense === false}
                          prefilled={isPrefilled("hasDriverLicense") && hasDriverLicense === false}
                          onChange={() => setHasDriverLicense(false)}
                        />
                      </RadioFieldset>
                      {hasDriverLicense === true ? (
                        <label className="flex flex-col gap-2 text-sm text-white/80">
                          Licence categories (for example CE, C1, BE)
                          <div className="relative">
                            <input
                              value={licenseCategories}
                              onChange={(event) => setLicenseCategories(event.target.value)}
                              className={`min-h-[44px] w-full rounded-[10px] border bg-[#0A0F18] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)] ${
                                isPrefilled("licenseCategories") ? "border-[#C9A84C]/40 pr-10" : "border-white/15"
                              }`}
                              autoComplete="off"
                            />
                            {isPrefilled("licenseCategories") ? (
                              <CheckCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
                            ) : null}
                          </div>
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
                          prefilled={isPrefilled("housing") && housing === value}
                          onChange={() => setHousing(value)}
                        />
                      ))}
                    </RadioFieldset>
                  ) : null}

                  {wizardStep === 8 ? (
                    <div className="space-y-5">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-white/75">
                        {`Record a short video CV — introduce yourself in English.
Tell us your name, your trade, your experience, and what
kind of role you are looking for in Norway. Keep it under
2 minutes. Paste the link below.`}
                      </p>
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-white/80">Video link</span>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              id="candidate-video-url"
                              aria-describedby="video-platforms-hint video-filming-tip"
                              value={videoUrl}
                              onChange={(event) => setVideoUrl(event.target.value)}
                              placeholder="https://"
                              className={`min-h-[44px] w-full rounded-[10px] border bg-[#0A0F18] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)] ${
                                isPrefilled("videoUrl") ? "border-[#C9A84C]/40 pr-10" : "border-white/15"
                              }`}
                            />
                            {isPrefilled("videoUrl") ? (
                              <CheckCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.45)] text-sm font-semibold text-[#C9A84C] transition hover:bg-[rgba(201,168,76,0.1)]"
                            aria-label="Show video script help"
                            onClick={() => {
                              setVideoHintClosedByUser(false);
                              setVideoHintManualOpen(true);
                              setVideoHintTimerReady(true);
                            }}
                          >
                            ?
                          </button>
                        </div>
                      </div>
                      <p id="video-platforms-hint" className="text-xs leading-relaxed text-white/50">
                        Accepted platforms: YouTube, Vimeo, Loom, TikTok
                      </p>
                      <p id="video-filming-tip" className="text-[11px] leading-relaxed text-white/42">
                        Tip: Film in a quiet place with good lighting. Speak clearly and professionally.
                      </p>
                      <AnimatePresence>
                        {showVideoHintCard ? (
                          <motion.div
                            key="video-intro-hint"
                            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                            transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] as const }}
                            className="relative rounded-xl border border-[rgba(201,168,76,0.38)] bg-[#0D1B2A]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                          >
                            <button
                              type="button"
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
                              aria-label="Dismiss help"
                              onClick={() => {
                                setVideoHintClosedByUser(true);
                                setVideoHintManualOpen(false);
                                setVideoHintTimerReady(false);
                              }}
                            >
                              <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                            </button>
                            <div className="flex gap-3 pr-8">
                              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
                              <div className="min-w-0 space-y-2">
                                <p className="text-sm font-semibold text-[#C9A84C]">Need help? Here&apos;s what to say:</p>
                                <p className="whitespace-pre-line text-xs leading-relaxed text-white/70">
                                  {`Hi, my name is [your name]. I am a [your trade] with [X] years of experience. I have worked in [country/company type].
I am looking for work in Norway, preferably in [region].
I am available from [date] and I am open to [rotation type].
I speak [languages]. Thank you for watching.`}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                      <div className="rounded-[12px] border border-[rgba(201,168,76,0.18)] bg-[#0A0F18] p-4">
                        {!videoUrl.trim() ? (
                          <p className="text-sm text-white/55">Preview will appear here.</p>
                        ) : !videoEmbedSrc ? (
                          <p className="text-sm text-amber-200/85">Invalid video link</p>
                        ) : (
                          <div className="aspect-video w-full overflow-hidden rounded-[10px] border border-[rgba(201,168,76,0.35)] shadow-[inset_0_0_0_1px_rgba(201,168,76,0.12)]">
                            <iframe
                              title="Video intro preview"
                              className="h-full w-full border-0"
                              src={videoEmbedSrc}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                              allowFullScreen
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {wizardStep === 9 ? (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-[#C9A84C]/30 bg-[linear-gradient(165deg,rgba(13,27,42,0.9),rgba(10,15,24,0.95))] p-5 md:p-6">
                        <h3 className="text-xl font-bold text-white">Data Privacy & Consent</h3>
                        <p className="mt-3 text-sm leading-relaxed text-white/75">
                          ArbeidMatch collects your profile data, contact details, work preferences, and video introduction to match
                          you with relevant opportunities. We use this data for recruitment processes and communication with relevant
                          employers. Your profile data is retained for up to 2 years, and you can request correction or deletion at
                          any time by contacting support@arbeidmatch.no.
                        </p>
                        <div className="mt-5 space-y-3">
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.02] p-4">
                            <input
                              type="checkbox"
                              checked={gdprConsentProcessing}
                              onChange={(event) => setGdprConsentProcessing(event.target.checked)}
                              className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded border border-[#C9A84C]/55 bg-transparent checked:bg-[#C9A84C] checked:shadow-[inset_0_0_0_2px_#0D1B2A]"
                            />
                            <span className="text-sm leading-relaxed text-white/80">
                              I consent to ArbeidMatch storing and processing my personal data for recruitment purposes.
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.02] p-4">
                            <input
                              type="checkbox"
                              checked={gdprConsentShareProfile}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setGdprConsentShareProfile(checked);
                                setShareWithEmployers(checked);
                              }}
                              className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded border border-[#C9A84C]/55 bg-transparent checked:bg-[#C9A84C] checked:shadow-[inset_0_0_0_2px_#0D1B2A]"
                            />
                            <span className="text-sm leading-relaxed text-white/80">
                              I consent to my profile being shared with Norwegian employers relevant to my skills.
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/12 bg-white/[0.02] p-4">
                            <input
                              type="checkbox"
                              checked={gdprConsentMarketing}
                              onChange={(event) => setGdprConsentMarketing(event.target.checked)}
                              className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded border border-[#C9A84C]/55 bg-transparent checked:bg-[#C9A84C] checked:shadow-[inset_0_0_0_2px_#0D1B2A]"
                            />
                            <span className="text-sm leading-relaxed text-white/80">I agree to receive relevant job notifications by email.</span>
                          </label>
                        </div>
                      </div>
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
                    disabled={saveStatus === "saving" || (wizardStep === 9 && !(gdprConsentProcessing && gdprConsentShareProfile))}
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
                <GdprInput
                  label="First name"
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                  prefilled={isPrefilled("firstName")}
                />
                <GdprInput
                  label="Last name"
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                  prefilled={isPrefilled("lastName")}
                />
                <GdprInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  className="sm:col-span-2"
                  autoComplete="email"
                  prefilled={isPrefilled("email")}
                />

                <label className="flex flex-col gap-2 text-sm text-white/80 sm:col-span-2">
                  <span className="font-medium text-white">Country of residence</span>
                  <span className="text-xs font-normal leading-snug text-white/55">
                    Candidate registration on ArbeidMatch is for people who live in the EU or EEA.
                  </span>
                  <div className="relative">
                    <select
                      value={currentCountry}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCurrentCountry(v);
                        if (v !== OUTSIDE_EEA_RESIDENCE_VALUE) setOutsideRedirectPending(false);
                      }}
                      className={`min-h-[48px] w-full rounded-[10px] border bg-[#0D1B2A] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)] ${
                        isPrefilled("currentCountry") ? "border-[#C9A84C]/40 pr-10" : "border-white/15"
                      }`}
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
                    {isPrefilled("currentCountry") ? (
                      <CheckCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
                    ) : null}
                  </div>
                </label>

                {currentCountry === OUTSIDE_EEA_RESIDENCE_VALUE ? (
                  <div className="space-y-4 rounded-[12px] border border-amber-400/35 bg-amber-500/[0.09] p-4 sm:col-span-2">
                    <p className="text-sm leading-relaxed text-white/90">
                      Thank you for your interest. Candidate registration on ArbeidMatch is only for people who live in
                      the EU or European Economic Area. We do not have job placements for residents outside the EU/EEA. The
                      next page explains this clearly and points to our guides if you want to understand Norwegian
                      requirements and processes.
                    </p>
                    {outsideRedirectPending ? (
                      <p className="text-sm font-medium text-[#C9A84C]" role="status" aria-live="polite">
                        Opening information for people outside the EU/EEA…
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={startOutsideEeaRedirect}
                        className="inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center rounded-[12px] bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] shadow-[0_8px_22px_rgba(201,168,76,0.25)] transition-colors hover:bg-[#b8953f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F18]"
                      >
                        Continue to outside EU/EEA information
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
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            value={phoneNational}
                            onChange={(e) => setPhoneNational(e.target.value.replace(/\D/g, ""))}
                            placeholder="Digits only, no leading 0"
                            className={`min-h-[48px] w-full rounded-[10px] border bg-[#0D1B2A] px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[rgba(201,168,76,0.45)] ${
                              isPrefilled("phone") ? "border-[#C9A84C]/40 pr-10" : "border-white/15"
                            }`}
                          />
                          {isPrefilled("phone") ? (
                            <CheckCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
                          ) : null}
                        </div>
                      </label>
                    </div>
                    <GdprInput
                      label="City"
                      value={city}
                      onChange={setCity}
                      className="sm:col-span-2"
                      autoComplete="address-level2"
                      prefilled={isPrefilled("city")}
                    />
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

      <AnimatePresence>
        {showWelcomeBackModal ? (
          <motion.div
            className="fixed inset-0 z-[290] flex items-center justify-center bg-[rgba(13,27,42,0.85)] px-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
              transition={transition}
              className="w-full max-w-md rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[#0A0F18] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.5)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="candidate-welcome-back-title"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">Candidates</p>
              <h2 id="candidate-welcome-back-title" className="mt-2 text-2xl font-bold text-white">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Continue with <span className="font-semibold text-white">{email.trim().toLowerCase()}</span>.
              </p>
              <button
                type="button"
                onClick={() => void continueWithEmailMagicLink()}
                disabled={welcomeBackStatus === "sending"}
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#C9A84C] px-6 text-sm font-bold text-[#0D1B2A] disabled:opacity-60"
              >
                {welcomeBackStatus === "sending" ? "Sending..." : "Continue with Email"}
              </button>
              {welcomeBackMessage ? (
                <p className={`mt-3 text-xs ${welcomeBackStatus === "error" ? "text-red-300" : "text-white/70"}`}>
                  {welcomeBackMessage}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setShowWelcomeBackModal(false)}
                className="mt-4 w-full text-center text-xs text-white/50 hover:text-white/75"
              >
                Continue without email link
              </button>
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
  prefilled = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  className?: string;
  autoComplete?: string;
  prefilled?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-2 text-sm text-white/80 ${className}`}>
      {label}
      <div className="relative">
        <input
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className={`min-h-[44px] w-full rounded-[10px] border bg-[#0D1B2A] px-3 text-sm text-white outline-none focus:border-[rgba(201,168,76,0.45)] ${
            prefilled ? "border-[#C9A84C]/40 pr-10" : "border-white/15"
          }`}
        />
        {prefilled ? (
          <CheckCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C9A84C]" />
        ) : null}
      </div>
    </label>
  );
}

function RadioFieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <fieldset className="space-y-3 border-0 p-0">
      <legend className="mb-4 text-lg font-semibold text-white">{legend}</legend>
      <MobileCardPager
        items={rows}
        pageSize={4}
        getKey={(_, index) => `radio-row-${index}`}
        renderItem={(row) => row}
        desktopClassName="space-y-2"
        mobileClassName="space-y-2 px-0"
        dotsClassName="mt-3"
      />
    </fieldset>
  );
}

function RadioRow({
  name,
  label,
  checked,
  prefilled = false,
  onChange,
}: {
  name: string;
  label: string;
  checked: boolean;
  prefilled?: boolean;
  onChange: () => void;
}) {
  const id = `${name}-${label.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "")}`;
  return (
    <label
      htmlFor={id}
      className={`flex min-h-[56px] cursor-pointer touch-manipulation items-center gap-3 rounded-[12px] border p-4 text-sm transition-all duration-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-[#C9A84C]/50 focus-within:ring-offset-2 focus-within:ring-offset-[#0D1B2A] md:min-h-[48px] md:px-4 md:py-3.5 ${
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
      <span className="flex flex-1 items-center justify-between gap-3 leading-snug">
        <span>{label}</span>
        {prefilled ? <CheckCircle className="h-4 w-4 shrink-0 text-[#C9A84C]" /> : null}
      </span>
    </label>
  );
}
