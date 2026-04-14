"use client";

import { FormEvent, useState, useEffect } from "react";
import { useParams } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-border px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-gold";

type TokenData = {
  company: string;
  email: string;
  job_summary: string;
};

type FormDataState = {
  full_name: string;
  phone: string;
  hiringType: string;
  position: string;
  qualification: string;
  numberOfPositions: string;
  experience: string;
  driverLicense: string;
  englishLevel: string;
  dNumber: string;
  requirements: string;
  contractType: string;
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
  subscribe: string;
  notes: string;
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
  const [formData, setFormData] = useState<FormDataState>({
    full_name: "",
    phone: "",
    hiringType: "",
    position: "Carpenter",
    qualification: "",
    numberOfPositions: "",
    experience: "",
    driverLicense: "",
    englishLevel: "",
    dNumber: "",
    requirements: "",
    contractType: "",
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

  const updateField = (name: keyof FormDataState, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const stepCount = 6;
  const progress = ((step + 1) / stepCount) * 100;

  const validateStep = (currentStep: number) => {
    if (currentStep === 0 && (!formData.full_name || !formData.phone)) return false;
    if (currentStep === 1 && !formData.hiringType) return false;
    if (
      currentStep === 2 &&
      (!formData.position ||
        !formData.qualification ||
        !formData.numberOfPositions ||
        !formData.experience)
    ) {
      return false;
    }
    if (currentStep === 3 && (!formData.driverLicense || !formData.englishLevel || !formData.dNumber)) {
      return false;
    }
    if (
      currentStep === 4 &&
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
    if (currentStep === 5 && (!formData.city || !formData.startDate || !formData.subscribe)) return false;
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
    if (step < stepCount - 1) goToStep(step + 1);
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
      email: tokenData?.email ?? "",
      job_summary: tokenData?.job_summary ?? "",
    };

    try {
      const response = await fetch("/api/send-request-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Send request failed");

      setStatus("success");
      await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" });
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
        <p className="mt-3 text-text-secondary">
          Complete all steps to submit your candidate request.
        </p>

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
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Type of hire</h2>
                <div className="grid gap-3">
                  {["Candidate delivery", "Recruitment", "Staffing", "Job posting"].map((v) => (
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
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Position details</h2>
                <label className="block">
                  Position
                  <select
                    className={inputClass}
                    value={formData.position}
                    onChange={(e) => updateField("position", e.target.value)}
                  >
                    {["Carpenter","Tile layer","Painter","Concrete worker","Cleaner","Electrician","Mechanic","Forklift operator","Warehouse worker","Other"].map((v)=><option key={v}>{v}</option>)}
                  </select>
                </label>
                <div className="grid gap-3">
                  {["General workers","Experienced no certificate","Qualified with foreign certificate","With DSB approval"].map((v)=>(
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.qualification===v} onChange={()=>updateField("qualification", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label>Number of positions <input className={inputClass} value={formData.numberOfPositions} onChange={(e)=>updateField("numberOfPositions", e.target.value)} /></label>
                  <label>Experience <input className={inputClass} value={formData.experience} onChange={(e)=>updateField("experience", e.target.value)} /></label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Requirements</h2>
                {[
                  ["driverLicense", ["No", "B", "B+", "E", "C", "Other"]],
                  ["englishLevel", ["Basic", "Working level", "Fluent"]],
                  ["dNumber", ["No - company can help", "Yes", "Other"]],
                ].map(([name, options]) => (
                  <div key={name as string} className="grid gap-3">
                    {(options as string[]).map((v) => (
                      <label key={v} className="rounded-md border border-border p-3">
                        <input
                          type="radio"
                          className="mr-2"
                          checked={formData[name as keyof FormDataState] === v}
                          onChange={() => updateField(name as keyof FormDataState, v)}
                        />
                        {v}
                      </label>
                    ))}
                  </div>
                ))}
                <label>Requirements (optional)<textarea className={inputClass} rows={3} value={formData.requirements} onChange={(e)=>updateField("requirements", e.target.value)} /></label>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Contract & Conditions</h2>
                <div className="grid gap-3">
                  {["Permanent", "Staffing", "Self-employed", "Other"].map((v)=>(
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.contractType===v} onChange={()=>updateField("contractType", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  <label>Salary (NOK/hour)<input className={inputClass} value={formData.salary} onChange={(e)=>updateField("salary", e.target.value)} /></label>
                  <label>Full-time %<input className={inputClass} value={formData.fullTime} onChange={(e)=>updateField("fullTime", e.target.value)} /></label>
                  <label>Hours<input className={inputClass} value={formData.hours} onChange={(e)=>updateField("hours", e.target.value)} /></label>
                  <label>Accommodation cost (0 if free)<input className={inputClass} value={formData.accommodationCost} onChange={(e)=>updateField("accommodationCost", e.target.value)} /></label>
                </div>
                {[
                  ["rotation", ["None", "4 weeks on 2 off", "6 weeks on 2 off", "Other"]],
                  ["overtime", ["Yes", "No", "Other"]],
                  ["travel", ["Yes", "No", "Other"]],
                  ["accommodation", ["Free", "Not included", "We help find", "Other"]],
                  ["equipment", ["Yes", "No"]],
                  ["tools", ["Yes", "No", "Not required"]],
                ].map(([name, options]) => (
                  <div key={name as string} className="grid gap-3">
                    {(options as string[]).map((v) => (
                      <label key={v} className="rounded-md border border-border p-3">
                        <input type="radio" className="mr-2" checked={formData[name as keyof FormDataState]===v} onChange={()=>updateField(name as keyof FormDataState, v)} />
                        {v}
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-[#0D1B2A]">Almost done!</h2>
                <label>City*<input className={inputClass} value={formData.city} onChange={(e)=>updateField("city", e.target.value)} /></label>
                <div className="grid gap-3">
                  {["ASAP", "1-2 weeks", "1 month", "Flexible", "Other"].map((v)=>(
                    <label key={v} className="rounded-md border border-border p-3">
                      <input type="radio" className="mr-2" checked={formData.startDate===v} onChange={()=>updateField("startDate", v)} />
                      {v}
                    </label>
                  ))}
                </div>
                <div className="grid gap-3">
                  {["Yes", "No"].map((v)=>(
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
