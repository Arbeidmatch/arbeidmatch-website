"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

type TokenData = {
  company: string;
  email: string;
  job_summary: string;
  org_number?: string;
  full_name?: string;
  phone?: string;
};

type RequestForm = {
  jobTitle: string;
  industry: string;
  numberOfPositions: string;
  contractType: string;
  hoursUnit: "" | "Per day" | "Per week" | "Per month";
  hoursAmount: string;
  salaryType: "" | "Per hour" | "Per month";
  salaryMin: string;
  salaryMax: string;
  overtime: "" | "Yes" | "Occasionally" | "No";
  rotation: "" | "No rotation" | "4 weeks on 2 home" | "6 weeks on 2 home" | "Other";
  rotationOther: string;
  location: string;
  startDate: string;
  duration: string;
  requiredExperience: string;
  languageRequirements: string[];
  languageOther: string;
  accommodation: "" | "Yes" | "No" | "Negotiable";
  transport: "" | "Yes" | "No" | "Negotiable";
  notes: string;
};

const TOTAL_CARDS = 5;
const GOLD = "#C9A84C";

const initialData: RequestForm = {
  jobTitle: "",
  industry: "",
  numberOfPositions: "",
  contractType: "",
  hoursUnit: "",
  hoursAmount: "",
  salaryType: "",
  salaryMin: "",
  salaryMax: "",
  overtime: "",
  rotation: "",
  rotationOther: "",
  location: "",
  startDate: "",
  duration: "",
  requiredExperience: "",
  languageRequirements: [],
  languageOther: "",
  accommodation: "",
  transport: "",
  notes: "",
};

const inputClass =
  "w-full rounded-[10px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[rgba(201,168,76,0.5)] focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(201,168,76,0.08)]";
const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-white/50";
const selectChevron = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
);
const selectStyle = { backgroundImage: `url("data:image/svg+xml,${selectChevron}")` };

function cardIsComplete(formData: RequestForm, cardIndex: number): boolean {
  if (cardIndex === 1) {
    return !!(formData.jobTitle.trim() && formData.industry && Number(formData.numberOfPositions) >= 1);
  }
  if (cardIndex === 2) {
    return !!(
      formData.contractType &&
      formData.hoursUnit &&
      formData.hoursAmount &&
      formData.salaryType &&
      formData.salaryMin &&
      formData.salaryMax &&
      formData.overtime &&
      formData.rotation &&
      (formData.rotation !== "Other" || formData.rotationOther.trim())
    );
  }
  if (cardIndex === 3) {
    return !!(formData.location.trim() && formData.startDate.trim());
  }
  if (cardIndex === 4) {
    return !!(
      formData.requiredExperience.trim() &&
      formData.languageRequirements.length > 0 &&
      (!formData.languageRequirements.includes("Other") || formData.languageOther.trim()) &&
      formData.accommodation &&
      formData.transport
    );
  }
  if (cardIndex === 5) return true;
  return false;
}

function getCurrentStep(completedCards: number) {
  if (completedCards >= TOTAL_CARDS) return TOTAL_CARDS;
  return Math.min(completedCards + 1, TOTAL_CARDS);
}

function Card({
  number,
  title,
  isVisible,
  reducedMotion,
  delayMs,
  children,
}: {
  number: string;
  title: string;
  isVisible: boolean;
  reducedMotion: boolean;
  delayMs: number;
  children: ReactNode;
}) {
  return (
    <div
      className="group relative mx-auto mb-4 w-full max-w-[720px] overflow-hidden rounded-[20px] border border-[rgba(201,168,76,0.12)] bg-white/[0.03] p-6 transition-all duration-250 hover:border-[rgba(201,168,76,0.3)] hover:bg-white/[0.04] md:p-8"
      style={{
        opacity: reducedMotion ? 1 : isVisible ? 1 : 0,
        transform: reducedMotion ? "none" : isVisible ? "translateY(0)" : "translateY(20px)",
        transitionDuration: reducedMotion ? "0ms" : "400ms",
        transitionTimingFunction: "ease-out",
        transitionDelay: reducedMotion ? "0ms" : `${delayMs}ms`,
      }}
    >
      <div className="absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent)]" />
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(201,168,76,0.1)] text-xs font-bold text-[#C9A84C]">
          {number}
        </span>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      <div className="mb-6 border-b border-white/10" />
      {children}
    </div>
  );
}

function RadioCard({
  name,
  value,
  selected,
  onChange,
}: {
  name: string;
  value: string;
  selected: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 transition-all duration-180 ${
        selected
          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)] text-[#C9A84C]"
          : "border-white/10 bg-white/[0.03] text-white/80"
      }`}
    >
      <input type="radio" className="sr-only" name={name} checked={selected} onChange={() => onChange(value)} />
      <span
        className={`relative h-[18px] w-[18px] rounded-full border-2 ${
          selected ? "border-[#C9A84C]" : "border-white/20"
        }`}
      >
        {selected && <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C9A84C]" />}
      </span>
      <span className="text-sm">{value}</span>
    </label>
  );
}

export default function DetailedRequestPage() {
  const { token } = useParams<{ token: string }>();
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [formData, setFormData] = useState<RequestForm>(initialData);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const completedCards = useMemo(
    () => [1, 2, 3, 4, 5].filter((card) => cardIsComplete(formData, card)).length,
    [formData],
  );
  const currentStep = getCurrentStep(completedCards);
  const progress = (completedCards / TOTAL_CARDS) * 100;

  const updateField = <K extends keyof RequestForm>(key: K, value: RequestForm[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languageRequirements: prev.languageRequirements.includes(lang)
        ? prev.languageRequirements.filter((item) => item !== lang)
        : [...prev.languageRequirements, lang],
    }));
  };

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const verify = async () => {
      try {
        const verifyRes = await fetch(`/api/verify-token?token=${token}`).then((r) => r.json());
        if (!verifyRes.valid) return setTokenStatus("invalid");

        const dataRes = await fetch(`/api/token-data/${token}`).then((r) => r.json());
        if (!dataRes.success || !dataRes.data) return setTokenStatus("invalid");

        setTokenData(dataRes.data as TokenData);
        setTokenStatus("valid");
      } catch {
        setTokenStatus("invalid");
      }
    };

    if (token) void verify();
    else setTokenStatus("invalid");
  }, [token]);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCards([0, 1, 2, 3, 4]);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = cardRefs.current.findIndex((element) => element === entry.target);
          if (index >= 0) {
            setVisibleCards((prev) => (prev.includes(index) ? prev : [...prev, index]));
          }
        });
      },
      { threshold: 0.16 },
    );

    cardRefs.current.forEach((element) => {
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [reducedMotion]);

  const submitFeedback = async () => {
    if (feedbackScore === null || feedbackStatus === "sending") return;
    setFeedbackStatus("sending");
    try {
      const response = await fetch("/api/confirmation-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "request-details",
          purpose: "Employer feedback after detailed request submission",
          pageUrl: `/request/${token}`,
          score: feedbackScore,
          note: feedbackNote.trim(),
          email: tokenData?.email ?? "",
          website: "",
        }),
      });
      if (!response.ok) throw new Error("Failed");
      setFeedbackStatus("sent");
    } catch {
      setFeedbackStatus("error");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (completedCards < 4) {
      setSubmitStatus("error");
      setSubmitError("Please complete all required fields before submitting.");
      return;
    }

    setSubmitError("");
    setSubmitStatus("idle");
    setIsSubmitting(true);

    const salary = `${formData.salaryType}: ${formData.salaryMin} - ${formData.salaryMax} NOK`;
    const roleValue = formData.jobTitle.trim() || "General role";
    const payload = {
      token,
      company: tokenData?.company ?? "",
      orgNumber: tokenData?.org_number ?? "",
      email: tokenData?.email ?? "",
      full_name: tokenData?.full_name ?? "Contact person",
      phonePrefix: "",
      phoneNumber: "",
      phone: tokenData?.phone ?? "",
      job_summary: tokenData?.job_summary ?? "",
      hiringType: "Recruitment of personnel for companies",
      category: formData.industry,
      position: roleValue,
      positionOther: "",
      numberOfPositions: formData.numberOfPositions,
      qualification: "Some experience",
      certifications: "",
      certificationsOther: "",
      experience: "",
      norwegianLevel: formData.languageRequirements.includes("Norwegian") ? "Required" : "Not required",
      englishLevel: formData.languageRequirements.includes("English") ? "Required" : "Not required",
      driverLicense: "",
      driverLicenseOther: "",
      dNumber: "",
      dNumberOther: "",
      requirements: formData.requiredExperience,
      contractType: formData.contractType,
      salaryPeriod: formData.salaryType,
      salaryMode: "Range",
      salary,
      salaryAmount: "",
      salaryFrom: formData.salaryMin,
      salaryTo: formData.salaryMax,
      hoursUnit: formData.hoursUnit,
      hoursAmount: formData.hoursAmount,
      overtime: formData.overtime,
      maxOvertimeHours: "",
      hasRotation: formData.rotation,
      rotationWeeksOn: "",
      rotationWeeksOff: "",
      internationalTravel: "",
      localTravel: formData.transport,
      localTravelOther: "",
      accommodation: formData.accommodation,
      accommodationCost: "",
      accommodationOther: "",
      equipment: "",
      equipmentOther: "",
      tools: "",
      toolsOther: "",
      city: formData.location,
      startDate: formData.startDate,
      startDateOther: "",
      howDidYouHear: "",
      socialMediaPlatform: "",
      socialMediaOther: "",
      howDidYouHearOther: "",
      referralCompanyName: "",
      referralOrgNumber: "",
      referralEmail: "",
      subscribe: "Yes - send me candidate updates",
      notes: [formData.duration ? `Duration: ${formData.duration}` : "", formData.notes].filter(Boolean).join("\n"),
    };

    try {
      const saveRes = await fetch("/api/save-employer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) throw new Error("save-employer-request");

      await fetch("/api/send-request-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);

      await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" }).catch(() => null);
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Failed to send email notifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenStatus === "checking") {
    return (
      <section className="min-h-screen bg-[#0a0f18] px-4 py-10 text-center text-white/70">
        Verifying your access...
      </section>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <section className="min-h-screen bg-[#0a0f18] px-4 py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-white">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-white/60">Please start a new request.</p>
        </div>
      </section>
    );
  }

  if (submitStatus === "success") {
    return (
      <section className="min-h-screen bg-[#0a0f18] px-4 py-10">
        <div className="mx-auto w-full max-w-2xl text-center">
          <div className="rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-white/[0.03] p-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C] text-3xl font-bold text-[#0a0f18]">
              ✓
            </div>
            <h1 className="mt-4 text-3xl font-bold text-white">Request submitted successfully!</h1>
            <p className="mt-2 text-sm text-white/60">
              Thank you, {tokenData?.full_name || "there"}. We will review your request and be in touch with you soon.
            </p>
            <div className="mx-auto mt-6 max-w-xl rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left">
              <p className="text-sm font-semibold text-white">How was your form experience?</p>
              <p className="mt-1 text-xs text-white/60">Rate from 1 to 10 so we can improve your experience.</p>
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
                        ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)] text-[#C9A84C]"
                        : "border-white/10 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <label className="mt-3 block text-xs font-medium text-white/70">What can we improve? (optional)</label>
              <textarea
                rows={3}
                className={`${inputClass} mt-1`}
                placeholder="Tell us what to change for a smoother experience..."
                value={feedbackNote}
                onChange={(e) => {
                  setFeedbackNote(e.target.value);
                  if (feedbackStatus !== "idle") setFeedbackStatus("idle");
                }}
              />
              <button
                type="button"
                onClick={() => void submitFeedback()}
                disabled={feedbackScore === null || feedbackStatus === "sending" || feedbackStatus === "sent"}
                className="mt-3 rounded-[10px] border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {feedbackStatus === "sending"
                  ? "Sending feedback..."
                  : feedbackStatus === "sent"
                    ? "Feedback sent"
                    : "Send feedback"}
              </button>
              {feedbackStatus === "error" && <p className="mt-2 text-xs text-red-400">Could not send feedback. Please try again.</p>}
              {feedbackStatus === "sent" && <p className="mt-2 text-xs text-[#7cd6b5]">Thank you! Your feedback was received.</p>}
            </div>
            <Link
              href="/"
              className="mt-5 inline-flex rounded-[10px] bg-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#0a0f18] transition hover:bg-[#b8953f]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#0a0f18] px-4 py-6 md:px-6 md:py-10">
      <div className="mx-auto mb-10 w-full max-w-[720px]">
        <p className="mb-6 text-xl font-semibold text-white">
          <span className="text-[#C9A84C]">ArbeidMatch</span> Norge
        </p>
        <h1 className="text-[28px] font-extrabold text-white">Candidate Request Details</h1>
        <p className="mt-2 text-sm text-white/50">Complete all steps to submit your candidate request.</p>
        <div className="mt-5 h-1 w-full rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#C9A84C,#e8c96a)] transition-all duration-[400ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-xs text-white/40">{`Step ${currentStep} of ${TOTAL_CARDS}`}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          ref={(element) => {
            cardRefs.current[0] = element;
          }}
        >
          <Card number="01" title="Job Information" isVisible={visibleCards.includes(0)} reducedMotion={reducedMotion} delayMs={0}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Job title / Role</label>
                <input className={inputClass} value={formData.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Industry / Sector</label>
                <select
                  className={`${inputClass} appearance-none bg-no-repeat pr-10 [background-position:right_14px_center]`}
                  style={selectStyle}
                  value={formData.industry}
                  onChange={(e) => updateField("industry", e.target.value)}
                >
                  <option value="">Select industry</option>
                  <option>Construction</option>
                  <option>Civil Engineering</option>
                  <option>Electrical & Mechanical</option>
                  <option>Industry & Logistics</option>
                  <option>Cleaning & Facility</option>
                  <option>Offshore</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Number of positions needed</label>
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={formData.numberOfPositions}
                  onChange={(e) => updateField("numberOfPositions", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div
          ref={(element) => {
            cardRefs.current[1] = element;
          }}
        >
          <Card number="02" title="Contract & Pay" isVisible={visibleCards.includes(1)} reducedMotion={reducedMotion} delayMs={100}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Contract type</label>
                <select
                  className={`${inputClass} appearance-none bg-no-repeat pr-10 [background-position:right_14px_center]`}
                  style={selectStyle}
                  value={formData.contractType}
                  onChange={(e) => updateField("contractType", e.target.value)}
                >
                  <option value="">Select contract type</option>
                  <option>Permanent employment</option>
                  <option>Temporary hire</option>
                  <option>Staffing / Innleie</option>
                  <option>Project-based</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Working hours</label>
                <div className="flex flex-wrap gap-2">
                  {(["Per day", "Per week", "Per month"] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => updateField("hoursUnit", unit)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-180 ${
                        formData.hoursUnit === unit
                          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                          : "border-white/10 bg-white/5 text-white/60"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  placeholder="Hours amount"
                  className={`${inputClass} mt-3`}
                  value={formData.hoursAmount}
                  onChange={(e) => updateField("hoursAmount", e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Salary type</label>
                <div className="grid gap-2 md:grid-cols-2">
                  {(["Per hour", "Per month"] as const).map((option) => (
                    <RadioCard
                      key={option}
                      name="salaryType"
                      value={option}
                      selected={formData.salaryType === option}
                      onChange={(value) => updateField("salaryType", value as RequestForm["salaryType"])}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Salary range min (NOK)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={formData.salaryMin}
                    onChange={(e) => updateField("salaryMin", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Salary range max (NOK)</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={formData.salaryMax}
                    onChange={(e) => updateField("salaryMax", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Overtime</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {(["Yes", "Occasionally", "No"] as const).map((option) => (
                    <RadioCard
                      key={option}
                      name="overtime"
                      value={option}
                      selected={formData.overtime === option}
                      onChange={(value) => updateField("overtime", value as RequestForm["overtime"])}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Rotation schedule</label>
                <div className="grid gap-2 md:grid-cols-2">
                  {(["No rotation", "4 weeks on 2 home", "6 weeks on 2 home", "Other"] as const).map((option) => (
                    <RadioCard
                      key={option}
                      name="rotation"
                      value={option}
                      selected={formData.rotation === option}
                      onChange={(value) => updateField("rotation", value as RequestForm["rotation"])}
                    />
                  ))}
                </div>
                {formData.rotation === "Other" && (
                  <input
                    className={`${inputClass} mt-3`}
                    placeholder="Describe other rotation schedule"
                    value={formData.rotationOther}
                    onChange={(e) => updateField("rotationOther", e.target.value)}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>

        <div
          ref={(element) => {
            cardRefs.current[2] = element;
          }}
        >
          <Card number="03" title="Location & Timeline" isVisible={visibleCards.includes(2)} reducedMotion={reducedMotion} delayMs={200}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Work location in Norway</label>
                <input
                  className={inputClass}
                  placeholder="City or region"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Start date</label>
                <input
                  className={inputClass}
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Duration</label>
                <input
                  className={inputClass}
                  placeholder="Expected duration"
                  value={formData.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                />
              </div>
            </div>
          </Card>
        </div>

        <div
          ref={(element) => {
            cardRefs.current[3] = element;
          }}
        >
          <Card number="04" title="Candidate Requirements" isVisible={visibleCards.includes(3)} reducedMotion={reducedMotion} delayMs={300}>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Required experience</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  placeholder="Describe required skills, certifications, and experience"
                  value={formData.requiredExperience}
                  onChange={(e) => updateField("requiredExperience", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Language requirements</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {["English", "Norwegian", "Other"].map((language) => (
                    <label
                      key={language}
                      className={`flex cursor-pointer items-center gap-3 rounded-[10px] border px-4 py-3 text-sm transition-all duration-180 ${
                        formData.languageRequirements.includes(language)
                          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)] text-[#C9A84C]"
                          : "border-white/10 bg-white/[0.03] text-white/70"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#C9A84C]"
                        checked={formData.languageRequirements.includes(language)}
                        onChange={() => toggleLanguage(language)}
                      />
                      {language}
                    </label>
                  ))}
                </div>
                {formData.languageRequirements.includes("Other") && (
                  <input
                    className={`${inputClass} mt-3`}
                    placeholder="Specify other language requirement"
                    value={formData.languageOther}
                    onChange={(e) => updateField("languageOther", e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className={labelClass}>Accommodation needed</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {(["Yes", "No", "Negotiable"] as const).map((option) => (
                    <RadioCard
                      key={option}
                      name="accommodation"
                      value={option}
                      selected={formData.accommodation === option}
                      onChange={(value) => updateField("accommodation", value as RequestForm["accommodation"])}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Transport covered</label>
                <div className="grid gap-2 md:grid-cols-3">
                  {(["Yes", "No", "Negotiable"] as const).map((option) => (
                    <RadioCard
                      key={option}
                      name="transport"
                      value={option}
                      selected={formData.transport === option}
                      onChange={(value) => updateField("transport", value as RequestForm["transport"])}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div
          ref={(element) => {
            cardRefs.current[4] = element;
          }}
        >
          <Card number="05" title="Additional Information" isVisible={visibleCards.includes(4)} reducedMotion={reducedMotion} delayMs={400}>
            <div>
              <label className={labelClass}>Additional notes</label>
              <textarea
                rows={4}
                className={inputClass}
                placeholder="Any other requirements or information"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>
          </Card>
        </div>

        <div className="mx-auto w-full max-w-[720px] pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A84C] px-12 py-[18px] text-base font-bold text-[#0a0f18] transition-all duration-200 hover:scale-[1.02] hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0a0f18]/40 border-t-[#0a0f18]" />
                Submitting...
              </>
            ) : (
              "Submit Candidate Request"
            )}
          </button>
          <p className="mt-3 text-center text-xs text-white/30">
            Your request will be reviewed by our team within 1 to 2 business days.
          </p>
          {submitStatus === "error" && (
            <p className="mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {submitError || "Something went wrong."}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
