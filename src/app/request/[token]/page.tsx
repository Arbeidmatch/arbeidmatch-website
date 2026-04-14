"use client";

import { FormEvent, useState, useEffect } from "react";
import { useParams } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

type TokenData = {
  company: string;
  email: string;
  job_summary: string;
  org_number?: string;
};

type RequestForm = {
  full_name: string;
  phone: string;
  hiringType: string;
  category: string;
  position: string;
  positionOther: string;
  numberOfPositions: string;
  qualification: string;
  experience: string;
  norwegianLevel: string;
  driverLicense: string;
  dNumber: string;
  englishLevel: string;
  requirements: string;
  contractType: string;
  paslagPercent: string;
  salary: string;
  fullTime: string;
  hours: string;
  accommodationCost: string;
  rotation: string;
  overtime: string;
  travel: string;
  accommodation: string;
  equipment: string;
  tools: string;
  city: string;
  startDate: string;
  howDidYouHear: string;
  socialMediaPlatform: string;
  socialMediaOther: string;
  howDidYouHearOther: string;
  subscribe: string;
  notes: string;
};

const rolesByCategory: Record<string, string[]> = {
  Construction: [
    "Carpenter",
    "Bricklayer",
    "Tile layer",
    "Painter",
    "Plasterer",
    "Roofer",
    "Concrete worker",
    "Steel fixer",
    "Scaffolder",
    "Insulation worker",
    "Floor layer",
    "Window installer",
    "Demolition worker",
  ],
  "Anlegg (Civil Engineering)": [
    "Excavator operator",
    "Pipelayer",
    "Road worker",
    "Asphalt worker",
    "Crane operator",
    "Survey technician",
  ],
  "Industry & Logistics": [
    "Forklift operator",
    "Warehouse worker",
    "Machine operator",
    "Welder",
    "CNC operator",
    "Quality inspector",
    "Packer",
    "Driver",
    "Production worker",
  ],
  "Cleaning & Facility": ["Cleaner", "Janitor", "Facility technician", "Window cleaner"],
  "Electrical & Mechanical": [
    "Electrician",
    "Plumber",
    "HVAC technician",
    "Mechanic",
    "Refrigeration technician",
  ],
  Other: [],
};

export default function DetailedRequestPage() {
  const params = useParams();
  const token = params.token as string;

  const [tokenStatus, setTokenStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [stepError, setStepError] = useState("");
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [formData, setFormData] = useState<RequestForm>({
    full_name: "",
    phone: "",
    hiringType: "",
    category: "",
    position: "",
    positionOther: "",
    numberOfPositions: "",
    qualification: "",
    experience: "",
    norwegianLevel: "",
    driverLicense: "",
    dNumber: "",
    englishLevel: "",
    requirements: "",
    contractType: "",
    paslagPercent: "",
    salary: "",
    fullTime: "",
    hours: "",
    accommodationCost: "",
    rotation: "",
    overtime: "",
    travel: "",
    accommodation: "",
    equipment: "",
    tools: "",
    city: "",
    startDate: "",
    howDidYouHear: "Google search",
    socialMediaPlatform: "Facebook",
    socialMediaOther: "",
    howDidYouHearOther: "",
    subscribe: "",
    notes: "",
  });

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        const verifyResponse = await fetch(`/api/verify-token?token=${token}`);
        const verifyData = await verifyResponse.json();

        if (!verifyData.valid) {
          setTokenStatus("invalid");
          return;
        }

        const tokenDataResponse = await fetch(`/api/token-data/${token}`);
        const tokenDataResult = await tokenDataResponse.json();

        if (!tokenDataResponse.ok || !tokenDataResult.success || !tokenDataResult.data) {
          setTokenStatus("invalid");
          return;
        }

        setTokenData(tokenDataResult.data);
        setTokenStatus("valid");
      } catch {
        setTokenStatus("invalid");
      }
    };

    if (token) verifyAndLoad();
    else setTokenStatus("invalid");
  }, [token]);

  const updateField = (name: keyof RequestForm, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const stepCount = 8;
  const progress = ((step + 1) / stepCount) * 100;
  const currentRoles = rolesByCategory[formData.category] ?? [];
  const needsPaslag =
    formData.contractType.includes("bemanningsbyrå") || formData.contractType.includes("Innleie");

  const validateStep = (currentStep: number) => {
    if (currentStep === 0 && (!formData.full_name || !formData.phone)) return false;
    if (currentStep === 1 && !formData.hiringType) return false;
    if (currentStep === 2 && (!formData.category || (!formData.position && !formData.positionOther)))
      return false;
    if (
      currentStep === 3 &&
      (!formData.numberOfPositions ||
        !formData.qualification ||
        !formData.experience ||
        !formData.norwegianLevel)
    ) {
      return false;
    }
    if (currentStep === 4 && (!formData.driverLicense || !formData.dNumber || !formData.englishLevel)) {
      return false;
    }
    if (
      currentStep === 5 &&
      (!formData.contractType ||
        !formData.salary ||
        !formData.fullTime ||
        !formData.hours ||
        !formData.accommodationCost ||
        !formData.rotation ||
        !formData.overtime ||
        !formData.travel ||
        !formData.accommodation ||
        !formData.equipment ||
        !formData.tools)
    ) {
      return false;
    }
    if (currentStep === 5 && needsPaslag && !formData.paslagPercent) return false;
    if (currentStep === 6 && (!formData.overtime || !formData.travel || !formData.accommodation || !formData.equipment || !formData.tools)) return false;
    if (currentStep === 7 && (!formData.city || !formData.startDate || !formData.subscribe))
      return false;
    if (currentStep === 7 && formData.howDidYouHear === "Social media" && !formData.socialMediaPlatform)
      return false;
    if (
      currentStep === 7 &&
      formData.howDidYouHear === "Social media" &&
      formData.socialMediaPlatform === "Other" &&
      !formData.socialMediaOther
    )
      return false;
    if (currentStep === 7 && formData.howDidYouHear === "Other" && !formData.howDidYouHearOther)
      return false;
    return true;
  };

  const goToStep = (targetStep: number) => {
    setVisible(false);
    setTimeout(() => {
      setStep(targetStep);
      setVisible(true);
    }, 300);
  };

  const nextStep = () => {
    if (!validateStep(step)) {
      setStepError("Please complete all required fields in this section.");
      return;
    }
    setStepError("");
    if (step < stepCount - 1) {
      window.scrollTo({ top: 0, behavior: "auto" });
      goToStep(step + 1);
    }
  };

  const prevStep = () => {
    setStepError("");
    if (step > 0) goToStep(step - 1);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateStep(step)) {
      setStepError("Please complete all required fields in this section.");
      return;
    }

    setStatus("idle");
    setIsSubmitting(true);

    const payload = {
      ...formData,
      token,
      company: tokenData?.company ?? "",
      orgNumber: tokenData?.org_number ?? "",
      email: tokenData?.email ?? "",
      job_summary: tokenData?.job_summary ?? "",
    };

    try {
      const emailResponse = await fetch("/api/send-request-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!emailResponse.ok) throw new Error("Email send failed");

      const saveResponse = await fetch("/api/save-employer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!saveResponse.ok) throw new Error("Save request failed");

      await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" });
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenStatus === "checking") {
    return (
      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <p className="text-text-secondary">Verifying your access...</p>
        </div>
      </section>
    );
  }

  if (tokenStatus === "invalid") {
    return (
      <section className="bg-surface py-16">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <h1 className="text-3xl font-bold text-navy">Link expired or invalid</h1>
          <p className="mt-4 text-text-secondary">
            This link has expired or is no longer valid. Please{" "}
            <a href="/request" className="font-semibold text-gold">
              start a new request →
            </a>
          </p>
        </div>
      </section>
    );
  }

  if (status === "success") {
    return (
      <section className="bg-surface py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h1 className="text-3xl font-bold text-navy">Request sent successfully</h1>
            <p className="mt-3 text-text-secondary">
              Thank you. Our team will review your request and contact you within 24 hours.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const cardClass = `rounded-2xl bg-white p-8 shadow-[0_10px_30px_rgba(13,27,42,0.08)] transition-opacity duration-300 ${
    visible ? "opacity-100" : "opacity-0"
  }`;

  return (
    <section className="bg-surface py-16">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-4xl font-bold text-[#0D1B2A]">Candidate Request — Details</h1>
        <p className="mt-3 text-text-secondary">Complete all steps to submit your candidate request.</p>

        <div className="mt-8 h-2 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full bg-[#C9A84C] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className={cardClass}>
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Who should we contact?</h2>
                <label className="block">
                  Full name*
                  <input
                    className={inputClass}
                    value={formData.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                  />
                </label>
                <label className="block">
                  Phone*
                  <input
                    className={inputClass}
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Type of engagement</h2>
                <p className="text-text-secondary">What kind of working arrangement are you looking for?</p>
                <div className="grid gap-3">
                  {["Candidate delivery", "Recruitment", "Staffing"].map((v) => (
                    <label key={v} className="rounded-md border border-border p-3">
                      <input
                        type="radio"
                        className="mr-2"
                        checked={formData.hiringType === v}
                        onChange={() => updateField("hiringType", v)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Sector & Role</h2>
                <p className="text-text-secondary">Select the sector and the specific role you need</p>
                <label className="block">
                  Category
                  <select
                    className={inputClass}
                    value={formData.category}
                    onChange={(e) => {
                      updateField("category", e.target.value);
                      updateField("position", "");
                      updateField("positionOther", "");
                    }}
                  >
                    <option value="">Select category</option>
                    {Object.keys(rolesByCategory).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                {formData.category && formData.category !== "Other" && (
                  <label className="block">
                    Role
                    <select
                      className={inputClass}
                      value={formData.position}
                      onChange={(e) => updateField("position", e.target.value)}
                    >
                      <option value="">Select role</option>
                      {currentRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {formData.category === "Other" && (
                  <label className="block">
                    Position (other)
                    <input
                      className={inputClass}
                      value={formData.positionOther}
                      onChange={(e) => updateField("positionOther", e.target.value)}
                    />
                  </label>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Qualification level</h2>
                <p className="text-text-secondary">
                  This helps us match the right candidate — from entry level to fully certified
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <label>
                    Number of candidates needed
                    <input type="number" min={1} max={99} className={inputClass} value={formData.numberOfPositions} onChange={(e)=>updateField("numberOfPositions", e.target.value)} />
                  </label>
                  <label>
                    Minimum years of experience
                    <input type="number" min={0} max={40} className={inputClass} value={formData.experience} onChange={(e)=>updateField("experience", e.target.value)} />
                  </label>
                </div>
                <div className="grid gap-3">
                  {[
                    "No experience needed — General workers, entry level",
                    "Some experience — Experienced but no formal certificate",
                    "Certified (foreign) — Qualified with foreign trade certificate",
                    "Fully certified (Norway) — Norwegian or DSB-approved certificate",
                  ].map((v) => (
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.qualification===v} onChange={()=>updateField("qualification", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <div className="grid gap-3">
                  {["Not required", "Basic", "Working level"].map((v) => (
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.norwegianLevel===v} onChange={()=>updateField("norwegianLevel", v)} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Requirements</h2>
                <p className="text-text-secondary">Your non-negotiable criteria</p>
                {[
                  ["driverLicense", ["No", "B", "B+", "C", "E", "Other"]],
                  ["dNumber", ["Not required — we can help arrange", "Yes — required before start", "Other"]],
                  ["englishLevel", ["Basic", "Working level", "Fluent"]],
                ].map(([name, values]) => (
                  <div key={name as string} className="grid gap-3">
                    {(values as string[]).map((v) => (
                      <label key={v} className="rounded-md border border-border p-3">
                        <input type="radio" className="mr-2" checked={formData[name as keyof RequestForm]===v} onChange={()=>updateField(name as keyof RequestForm, v)} />
                        {v}
                      </label>
                    ))}
                  </div>
                ))}
                <label>
                  Deal breakers (optional)
                  <textarea rows={3} className={inputClass} value={formData.requirements} onChange={(e)=>updateField("requirements", e.target.value)} />
                </label>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Contract & Pay</h2>
                <p className="text-text-secondary">Norwegian legal contract types — select what applies</p>
                <div className="grid gap-3">
                  {[
                    "Fast ansettelse — direkte hos klient",
                    "Fast ansettelse — via bemanningsbyrå",
                    "Midlertidig ansettelse — direkte hos klient",
                    "Midlertidig ansettelse — via bemanningsbyrå",
                    "Innleie fra bemanningsbyrå",
                    "Selvstendig oppdragstaker",
                    "Sesongarbeid",
                  ].map((v) => (
                    <label key={v} className="rounded-md border border-border p-3">
                      <input
                        type="radio"
                        className="mr-2"
                        checked={formData.contractType === v}
                        onChange={() => updateField("contractType", v)}
                      />
                      {v}
                    </label>
                  ))}
                </div>
                {needsPaslag && (
                  <label>
                    Margin/påslag bemanningsbyrå %
                    <input type="number" className={inputClass} value={formData.paslagPercent} onChange={(e)=>updateField("paslagPercent", e.target.value)} />
                  </label>
                )}
                <div className="grid gap-5 md:grid-cols-2">
                  <label>Starting salary (NOK/hour)<input className={inputClass} value={formData.salary} onChange={(e)=>updateField("salary", e.target.value)} /></label>
                  <label>Position % (100 = full time)<input className={inputClass} value={formData.fullTime} onChange={(e)=>updateField("fullTime", e.target.value)} /></label>
                  <label>Hours per day/week<input className={inputClass} value={formData.hours} onChange={(e)=>updateField("hours", e.target.value)} /></label>
                  <label>Accommodation cost NOK/month (0 if free)<input className={inputClass} value={formData.accommodationCost} onChange={(e)=>updateField("accommodationCost", e.target.value)} /></label>
                </div>
                <div className="grid gap-3">
                  {["None", "4 weeks on / 2 off", "6 weeks on / 2 off", "Other"].map((v)=>(
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.rotation===v} onChange={()=>updateField("rotation", v)} />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Working conditions</h2>
                <p className="text-text-secondary">What does the working environment look like?</p>
                {[
                  ["overtime", ["Yes — regular", "Occasionally", "No"]],
                  ["travel", ["Yes — fully covered", "Partially covered", "Not covered"]],
                  ["accommodation", ["Free accommodation provided", "Not included", "We help find it", "Other"]],
                  ["equipment", ["Yes — provided", "No — worker must bring own"]],
                  ["tools", ["Yes — provided", "No — worker must bring own", "Not required"]],
                ].map(([name, values]) => (
                  <div key={name as string} className="grid gap-3">
                    {(values as string[]).map((v)=>(
                      <label key={v} className="rounded-md border border-border p-3">
                        <input type="radio" className="mr-2" checked={formData[name as keyof RequestForm]===v} onChange={()=>updateField(name as keyof RequestForm, v)} />
                        {v}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {step === 7 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Final details</h2>
                <p className="text-text-secondary">Almost there</p>
                <label>Work location / city*<input className={inputClass} value={formData.city} onChange={(e)=>updateField("city", e.target.value)} /></label>
                <div className="grid gap-3">
                  {["ASAP", "1–2 weeks", "Within 1 month", "Flexible"].map((v)=>(
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.startDate===v} onChange={()=>updateField("startDate", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <label>
                  How did you hear about us?
                  <select
                    className={inputClass}
                    value={formData.howDidYouHear}
                    onChange={(e) => {
                      updateField("howDidYouHear", e.target.value);
                      updateField("socialMediaOther", "");
                      updateField("howDidYouHearOther", "");
                    }}
                  >
                    {[
                      "Google search",
                      "Referral from another company",
                      "Referral from a friend",
                      "Social media",
                      "Other",
                    ].map((v)=>(
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </label>
                {formData.howDidYouHear === "Social media" && (
                  <label>
                    Social media platform
                    <select
                      className={inputClass}
                      value={formData.socialMediaPlatform}
                      onChange={(e) => {
                        updateField("socialMediaPlatform", e.target.value);
                        updateField("socialMediaOther", "");
                      }}
                    >
                      {[
                        "Facebook",
                        "Instagram",
                        "LinkedIn",
                        "TikTok",
                        "YouTube",
                        "Twitter/X",
                        "Snapchat",
                        "Pinterest",
                        "Reddit",
                        "WhatsApp",
                        "Other",
                      ].map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {formData.howDidYouHear === "Social media" && formData.socialMediaPlatform === "Other" && (
                  <label>
                    Other social media platform
                    <input
                      className={inputClass}
                      value={formData.socialMediaOther}
                      onChange={(e) => updateField("socialMediaOther", e.target.value)}
                    />
                  </label>
                )}
                {formData.howDidYouHear === "Other" && (
                  <label>
                    Please specify
                    <input
                      className={inputClass}
                      value={formData.howDidYouHearOther}
                      onChange={(e) => updateField("howDidYouHearOther", e.target.value)}
                    />
                  </label>
                )}
                <div className="grid gap-3">
                  {["Yes — keep me updated on available candidates", "No thanks"].map((v)=>(
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.subscribe===v} onChange={()=>updateField("subscribe", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <label>Additional notes (optional)<textarea rows={3} className={inputClass} value={formData.notes} onChange={(e)=>updateField("notes", e.target.value)} /></label>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md bg-[#C9A84C] py-4 text-lg font-medium text-white hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Submit request"}
                </button>
              </div>
            )}
          </div>

          {stepError && <p className="text-sm text-red-600">{stepError}</p>}
          {status === "error" && (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
              Something went wrong. Please email post@arbeidmatch.no
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="rounded-md border border-[#0D1B2A] px-6 py-2.5 text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            {step < stepCount - 1 && (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-md bg-[#C9A84C] px-6 py-2.5 font-medium text-white hover:bg-gold-hover"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
