"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  availabilityOptions,
  drivingLicenceOptions,
  englishLevels,
  experienceOptions,
  jobApplicationSchema,
  norwegianLevels,
  workAuthorizationOptions,
  type JobApplicationFormData,
} from "@/lib/jobs/application";
import type { JobRecord } from "@/lib/jobs/types";
import type { CandidateProfilePayload } from "@/lib/candidates/profileSchema";
import { computeEmployerBoardMatch } from "@/lib/employer-flow/employerBoardMatch";
import { computeJobMatchScore } from "@/lib/candidates/jobMatchScore";

type FormErrors = Partial<Record<keyof JobApplicationFormData, string>>;
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentCountry: string;
  city: string;
  workAuthorization: (typeof workAuthorizationOptions)[number];
  yearsExperience: (typeof experienceOptions)[number];
  trade: string;
  englishLevel: (typeof englishLevels)[number];
  norwegianLevel: (typeof norwegianLevels)[number];
  drivingLicence: (typeof drivingLicenceOptions)[number];
  availability: (typeof availabilityOptions)[number];
  cvFile: File | undefined;
  behavioralStory: string;
  behavioralSafety: string;
  message: string;
  gdprConsent: boolean;
};

const tradeOptions = [
  "Industrial Electrician",
  "TIG Welder",
  "Pipefitter",
  "Truck Driver",
  "Carpenter",
  "Concrete Worker",
  "Industrial Painter",
];

/** User-facing copy for the numeric compatibility signal (internal logic still uses score). */
function compatibilityTierLabel(percent: number): string {
  if (percent >= 85) return "Strong compatibility";
  if (percent >= 70) return "Good compatibility";
  return "Low compatibility";
}

const LOW_COMPATIBILITY_APPLY_ERROR = "This job may not be the right fit for you";
const LEGACY_LOW_COMPATIBILITY_APPLY_ERROR = "Not ideal match, adjust your profile";

const totalSteps = 3;
const inputClassName =
  "input-premium--dark min-h-[44px] rounded-md border border-white/15 bg-[#0A0F18] px-3 text-sm text-white placeholder:text-white/40";

export default function JobApplicationForm({ job }: { job: JobRecord }) {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errors, setErrors] = useState<FormErrors>({});
  const [cvFileName, setCvFileName] = useState("");
  const [profileSnapshot, setProfileSnapshot] = useState<CandidateProfilePayload | null>(null);
  const [matchPreview, setMatchPreview] = useState<{ score: number; summary: string } | null>(null);
  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentCountry: "",
    city: "",
    workAuthorization: workAuthorizationOptions[0],
    yearsExperience: experienceOptions[0],
    trade: job.trade ?? "",
    englishLevel: englishLevels[1],
    norwegianLevel: norwegianLevels[0],
    drivingLicence: drivingLicenceOptions[0],
    availability: availabilityOptions[0],
    cvFile: undefined as File | undefined,
    behavioralStory: "",
    behavioralSafety: "",
    message: "",
    gdprConsent: false,
  });

  const progressLabel = useMemo(() => `Step ${step} of ${totalSteps}`, [step]);
  const progressValue = useMemo(() => (step / totalSteps) * 100, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email = formData.email.trim().toLowerCase();
    if (!email.includes("@")) {
      setProfileSnapshot(null);
      setMatchPreview(null);
      return;
    }

    try {
      const raw = window.localStorage.getItem("am_candidate_profile_json");
      if (!raw) {
        setProfileSnapshot(null);
        setMatchPreview(null);
        return;
      }
      const parsed = JSON.parse(raw) as CandidateProfilePayload;
      if (!parsed?.email || parsed.email.trim().toLowerCase() !== email) {
        setProfileSnapshot(null);
        setMatchPreview(null);
        return;
      }
      setProfileSnapshot(parsed);
      if (job.source === "employer_board" && job.employerBoardMeta) {
        const boardMatch = computeEmployerBoardMatch(job.employerBoardMeta, parsed);
        setMatchPreview({
          score: Math.round(boardMatch.percent),
          summary: boardMatch.breakdown.slice(0, 3).join(" "),
        });
      } else {
        const match = computeJobMatchScore(job, parsed);
        setMatchPreview({ score: match.score, summary: match.reasons.slice(0, 2).join(" ") });
      }
    } catch {
      setProfileSnapshot(null);
      setMatchPreview(null);
    }
  }, [formData.email, job]);

  function updateField<Key extends keyof typeof formData>(key: Key, value: (typeof formData)[Key]) {
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function validateCurrentStep(): boolean {
    const partialErrors: FormErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) partialErrors.firstName = "First name is required.";
      if (!formData.lastName.trim()) partialErrors.lastName = "Last name is required.";
      if (!formData.email.trim()) partialErrors.email = "Email is required.";
      if (!formData.phone.trim()) partialErrors.phone = "Phone is required.";
      if (!formData.currentCountry.trim()) partialErrors.currentCountry = "Current country is required.";
      if (!formData.city.trim()) partialErrors.city = "City is required.";
    }

    if (step === 2) {
      if (!formData.trade.trim()) partialErrors.trade = "Trade is required.";
      if (!formData.cvFile) partialErrors.cvFile = "CV upload is required.";
    }

    if (Object.keys(partialErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...partialErrors }));
      return false;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrors({});

    const parsed = jobApplicationSchema.safeParse(formData);
    if (!parsed.success) {
      const nextErrors: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof JobApplicationFormData;
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      setStatus("idle");
      return;
    }

    const requestPayload = new FormData();
    requestPayload.set("jobSlug", job.slug);
    requestPayload.set("firstName", parsed.data.firstName);
    requestPayload.set("lastName", parsed.data.lastName);
    requestPayload.set("email", parsed.data.email);
    requestPayload.set("phone", parsed.data.phone);
    requestPayload.set("currentCountry", parsed.data.currentCountry);
    requestPayload.set("city", parsed.data.city);
    requestPayload.set("workAuthorization", parsed.data.workAuthorization);
    requestPayload.set("yearsExperience", parsed.data.yearsExperience);
    requestPayload.set("trade", parsed.data.trade);
    requestPayload.set("englishLevel", parsed.data.englishLevel);
    requestPayload.set("norwegianLevel", parsed.data.norwegianLevel);
    requestPayload.set("drivingLicence", parsed.data.drivingLicence);
    requestPayload.set("availability", parsed.data.availability);
    requestPayload.set("message", parsed.data.message ?? "");
    requestPayload.set("behavioralStory", parsed.data.behavioralStory);
    requestPayload.set("behavioralSafety", parsed.data.behavioralSafety);
    requestPayload.set("gdprConsent", "true");
    requestPayload.set("cvFile", parsed.data.cvFile);
    if (profileSnapshot) {
      requestPayload.set("profileJson", JSON.stringify(profileSnapshot));
    }

    const response = await fetch("/api/jobs/apply", {
      method: "POST",
      body: requestPayload,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string; matchScore?: number; matchSummary?: string };
      const isLowCompatibility =
        payload.error === LOW_COMPATIBILITY_APPLY_ERROR || payload.error === LEGACY_LOW_COMPATIBILITY_APPLY_ERROR;
      const message = isLowCompatibility
        ? typeof payload.matchScore === "number"
          ? `You are ${payload.matchScore}% compatible with this job. ${LOW_COMPATIBILITY_APPLY_ERROR}`
          : LOW_COMPATIBILITY_APPLY_ERROR
        : payload.error || "Submission failed. Please try again.";
      setErrors({ gdprConsent: message });
      setStatus("idle");
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    return (
      <section className="rounded-[20px] border border-[#C9A84C]/25 bg-white/[0.03] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Application submitted</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Thank you for applying</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/75">
          We received your profile for <strong>{job.title}</strong>. If your profile matches the agreed criteria, our team will contact you shortly.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/jobs/${job.slug}`}
            className="btn-outline-premium inline-flex min-h-[44px] items-center justify-center rounded-md border border-[#C9A84C]/35 px-4 py-2 text-sm font-semibold text-[#C9A84C]"
          >
            Back to job details
          </Link>
          <Link
            href="/jobs"
            className="btn-gold-premium inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Browse more jobs
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[20px] border border-[#C9A84C]/25 bg-white/[0.03] p-5 md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">{progressLabel}</p>
        <p className="text-xs text-white/60">{Math.round(progressValue)}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[#C9A84C] transition-all duration-300" style={{ width: `${progressValue}%` }} />
      </div>

      {step === 1 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="First name" error={errors.firstName}>
            <input
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Last name" error={errors.lastName}>
            <input
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputClassName} />
          </Field>
          <Field label="Current country" error={errors.currentCountry}>
            <input
              value={formData.currentCountry}
              onChange={(e) => updateField("currentCountry", e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="City" error={errors.city}>
            <input value={formData.city} onChange={(e) => updateField("city", e.target.value)} className={inputClassName} />
          </Field>

          {matchPreview ? (
            <div className="md:col-span-2 rounded-md border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.08)] px-4 py-3 text-sm text-white/80">
              <p className="font-semibold text-[#C9A84C]">{compatibilityTierLabel(matchPreview.score)}</p>
              <p className="mt-1 text-white/70">You are {matchPreview.score}% compatible with this job.</p>
              <p className="mt-1 text-white/70">{matchPreview.summary}</p>
              {matchPreview.score < 70 ? (
                <p className="mt-2 text-white/70">
                  Applications require good compatibility with this role (typically about 70% or higher on our scale).{" "}
                  <span className="font-semibold text-[#C9A84C]">
                    Use the secure link from your profile email to adjust details
                  </span>
                  .
                </p>
              ) : null}
              {profileSnapshot && job.source === "employer_board" && job.employerBoardMeta ? (
                <p className="mt-2 text-xs text-white/55">
                  Board roles use a 12-point employer fit model. The value reflects compatibility with that checklist.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="md:col-span-2 text-sm text-white/55">
              Tip: complete your{" "}
              <Link href="/for-candidates" className="font-semibold text-[#C9A84C] hover:underline">
                candidate overview
              </Link>{" "}
              to unlock compatibility insights and applications.
            </p>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField label="Work authorization" value={formData.workAuthorization} onChange={(value) => updateField("workAuthorization", value)}>
            {workAuthorizationOptions}
          </SelectField>
          <SelectField label="Years of experience" value={formData.yearsExperience} onChange={(value) => updateField("yearsExperience", value)}>
            {experienceOptions}
          </SelectField>
          <SelectField label="Trade / profession" value={formData.trade} onChange={(value) => updateField("trade", value)} error={errors.trade}>
            {tradeOptions}
          </SelectField>
          <SelectField label="English level" value={formData.englishLevel} onChange={(value) => updateField("englishLevel", value)}>
            {englishLevels}
          </SelectField>
          <SelectField label="Norwegian level" value={formData.norwegianLevel} onChange={(value) => updateField("norwegianLevel", value)}>
            {norwegianLevels}
          </SelectField>
          <SelectField label="Driving licence" value={formData.drivingLicence} onChange={(value) => updateField("drivingLicence", value)}>
            {drivingLicenceOptions}
          </SelectField>
          <SelectField label="Availability" value={formData.availability} onChange={(value) => updateField("availability", value)}>
            {availabilityOptions}
          </SelectField>
          <Field label="CV upload (PDF, DOC, DOCX)" error={errors.cvFile}>
            <label className="input-premium--dark flex min-h-[44px] cursor-pointer items-center rounded-md border border-dashed border-white/25 bg-[#0A0F18] px-3 text-sm text-white/80">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  updateField("cvFile", file);
                  setCvFileName(file?.name ?? "");
                }}
              />
              <span>{cvFileName || "Choose file"}</span>
            </label>
          </Field>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 space-y-4">
          <Field label="Describe a time you delivered under pressure" error={errors.behavioralStory}>
            <textarea
              value={formData.behavioralStory}
              onChange={(e) => updateField("behavioralStory", e.target.value)}
              placeholder="Concrete situation, your actions, and outcome."
              className={`${inputClassName} min-h-[100px] py-2.5`}
            />
          </Field>
          <Field label="How do you approach safety on site" error={errors.behavioralSafety}>
            <textarea
              value={formData.behavioralSafety}
              onChange={(e) => updateField("behavioralSafety", e.target.value)}
              placeholder="Habits, communication, PPE, and stopping work when needed."
              className={`${inputClassName} min-h-[100px] py-2.5`}
            />
          </Field>
          <Field label="Optional message" error={errors.message}>
            <textarea
              value={formData.message}
              onChange={(e) => updateField("message", e.target.value)}
              placeholder="Share details that help the recruiter understand your profile."
              className={`${inputClassName} min-h-[120px] py-2.5`}
            />
          </Field>

          <label className="flex items-start gap-2 rounded-md border border-white/15 bg-[#0A0F18] px-3 py-3 text-sm text-white/80">
            <input
              type="checkbox"
              checked={formData.gdprConsent}
              onChange={(event) => updateField("gdprConsent", event.target.checked)}
              className="mt-0.5"
            />
            <span>
              I agree to the processing of my personal data according to the{" "}
              <Link href="/privacy" className="link-text-premium text-[#C9A84C]">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.gdprConsent ? <p className="text-sm text-red-300">{errors.gdprConsent}</p> : null}
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          disabled={step === 1 || status === "submitting"}
          className="btn-outline-premium min-h-[44px] rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/75 disabled:opacity-45"
        >
          Previous
        </button>

        {step < totalSteps ? (
          <button
            type="button"
            onClick={() => {
              if (!validateCurrentStep()) return;
              setStep((current) => Math.min(totalSteps, current + 1));
            }}
            className="btn-gold-premium min-h-[44px] rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A]"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn-gold-premium min-h-[44px] rounded-md bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting..." : "Submit application"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-white/85">
      <span>{label}</span>
      {children}
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  children,
  error,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  children: readonly T[];
  error?: string;
}) {
  return (
    <Field label={label} error={error}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={`${inputClassName} select-premium`}
      >
        {children.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}
