"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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
  industry: string;
  workerType: string;
  trade: string;
  tradeOther: string;
  experience: string;
  certification: string[];
  candidates: number;
  contractType: string;
  salary: string;
  salaryPeriod: "per hour" | "per month";
  overtime: string;
  accommodation: string;
  accommodationSupport: string;
  internationalTransport: string;
  localTransport: string;
  urgency: string;
  city: string;
  locations: string[];
  region: string;
  startDate: string;
  notes: string;
};

const TOTAL_STEPS = 6;

const CITY_OPTIONS = [
  "Oslo", "Bergen", "Trondheim", "Stavanger", "Kristiansand", "Drammen", "Tromso", "Fredrikstad",
  "Sandnes", "Sarpsborg", "Bodo", "Sandefjord", "Alesund", "Porsgrunn", "Haugesund", "Arendal",
  "Tonsberg", "Moss", "Hamar", "Lillehammer", "Molde", "Harstad", "Gjovik", "Halden", "Kongsberg",
  "Larvik", "Skien", "Horten", "Askoy", "Jessheim", "Alta", "Narvik", "Kongsvinger", "Mo i Rana",
  "Steinkjer", "Namsos", "Levanger", "Verdal", "Elverum", "Brumunddal", "Ringerike", "Honefoss",
];

const INDUSTRY_OPTIONS = [
  "Electrical",
  "Welding and Metal",
  "Construction",
  "Logistics",
  "Industry and Production",
  "Cleaning",
  "HoReCa",
  "Healthcare",
  "Other",
];

const WORKER_TYPES_BY_INDUSTRY: Record<string, string[]> = {
  Electrical: [
    "Electrician (DSB authorized)",
    "Electrical installer",
    "Industrial electrician",
    "Electrician",
    "Plumber",
    "HVAC technician",
    "Mechanic",
  ],
  "Welding and Metal": ["Welder (ISO certified)", "Welder", "Pipe welder", "Plate welder"],
  Construction: [
    "Construction worker",
    "Carpenter",
    "Bricklayer",
    "Tile layer",
    "Painter",
    "Plasterer",
    "Roofer",
    "Concrete worker",
  ],
  Logistics: [
    "Logistics / Driver",
    "Driver",
    "Warehouse operator",
    "Warehouse worker",
    "Forklift operator",
    "Crane operator",
    "Excavator operator",
    "Road worker",
    "Asphalt worker",
  ],
  "Industry and Production": ["Industrial worker", "Machine operator", "CNC operator", "Assembly worker"],
  Cleaning: ["Cleaning staff", "Cleaner", "Janitor", "Industrial cleaner", "Facility cleaner", "Facility technician"],
  HoReCa: ["HoReCa / Kitchen", "Chef", "Kitchen assistant"],
  Healthcare: ["Healthcare worker", "Nurse assistant", "Caregiver"],
  Other: ["Other"],
};

const CERTIFICATIONS_BY_WORKER_TYPE: Record<string, string[]> = {
  "Electrician (DSB authorized)": ["DSB authorization", "Trade certificate"],
  "Electrical installer": ["DSB authorization", "Trade certificate"],
  "Industrial electrician": ["DSB authorization", "Trade certificate"],
  "Welder (ISO certified)": ["ISO 9606", "NDT Level II"],
  "Pipe welder": ["ISO 9606", "NDT Level II"],
  "Plate welder": ["ISO 9606", "NDT Level II"],
  "Construction worker": ["Trade certificate"],
  Carpenter: ["Trade certificate"],
  "Concrete worker": ["Trade certificate"],
  "Logistics / Driver": ["Driver's license CE"],
  "Warehouse operator": ["Forklift certificate"],
  "Forklift operator": ["Forklift certificate"],
  "Industrial worker": ["ATEX/EX"],
  "CNC operator": ["Trade certificate"],
  "Assembly worker": ["None required"],
  "Cleaning staff": ["None required"],
  "Industrial cleaner": ["None required"],
  "Facility cleaner": ["None required"],
  "HoReCa / Kitchen": ["Food safety certificate"],
  Chef: ["Food safety certificate"],
  "Kitchen assistant": ["Food safety certificate"],
  "Healthcare worker": ["Healthcare authorization"],
  "Nurse assistant": ["Healthcare authorization"],
  Caregiver: ["Healthcare authorization"],
  Other: ["None required"],
};

const initialForm: RequestForm = {
  industry: "",
  workerType: "",
  trade: "",
  tradeOther: "",
  experience: "",
  certification: [],
  candidates: 1,
  contractType: "",
  salary: "",
  salaryPeriod: "per hour",
  overtime: "",
  accommodation: "",
  accommodationSupport: "",
  internationalTransport: "",
  localTransport: "",
  urgency: "",
  city: "",
  locations: [],
  region: "",
  startDate: "",
  notes: "",
};

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]";
const inputClass =
  "w-full rounded-[12px] border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[rgba(201,168,76,0.5)]";

function OptionCard({
  label,
  sublabel,
  selected,
  onClick,
  icon,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-left transition-all duration-180 ${
        selected
          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)] text-[#C9A84C]"
          : "border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className="block text-sm font-semibold">{label}</span>
          {sublabel ? <span className="block text-xs text-white/50">{sublabel}</span> : null}
        </span>
      </span>
      <span
        className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
          selected ? "border-[#C9A84C] bg-[#C9A84C]" : "border-white/20"
        }`}
      >
        {selected ? (
          <svg viewBox="0 0 20 20" className="h-[10px] w-[10px] text-[#0f1923]" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 10l4 4 8-8" />
          </svg>
        ) : null}
      </span>
    </button>
  );
}

function ProgressDot({ index, step }: { index: number; step: number }) {
  const state = index === step ? "active" : index < step ? "completed" : "inactive";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full transition-all duration-300 ${
        state === "active"
          ? "scale-125 bg-[#C9A84C]"
          : state === "completed"
            ? "bg-[rgba(201,168,76,0.4)]"
            : "bg-white/20"
      }`}
    />
  );
}

export default function RequestTokenPage() {
  const { token } = useParams<{ token: string }>();

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/token-data/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.data) setTokenData(data.data as TokenData);
      })
      .catch(() => null);
  }, [token]);

  const goTo = (next: number) => {
    if (next < 0 || next > TOTAL_STEPS - 1 || animating) return;
    if (reducedMotion) {
      setStep(next);
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  };

  const toggleCert = (value: string) => {
    setForm((prev) => ({
      ...prev,
      certification: prev.certification.includes(value)
        ? prev.certification.filter((item) => item !== value)
        : [...prev.certification, value],
    }));
  };

  const filteredCities = useMemo(() => {
    const query = citySearch.trim().toLowerCase();
    if (!query) return CITY_OPTIONS;
    return CITY_OPTIONS.filter((city) => city.toLowerCase().includes(query));
  }, [citySearch]);

  const workerTypeOptions = useMemo(() => {
    if (!form.industry) return [];
    return WORKER_TYPES_BY_INDUSTRY[form.industry] || [];
  }, [form.industry]);

  const certificationOptions = useMemo(() => {
    if (!form.workerType) return [];
    return CERTIFICATIONS_BY_WORKER_TYPE[form.workerType] || ["None required"];
  }, [form.workerType]);

  const toggleLocation = (value: string) => {
    setForm((prev) => {
      const exists = prev.locations.includes(value);
      const nextLocations = exists ? prev.locations.filter((item) => item !== value) : [...prev.locations, value];
      return {
        ...prev,
        locations: nextLocations,
        city: nextLocations.join(", "),
      };
    });
  };

  const isStepValid = (value: number) => {
    if (value === 0) return !!form.industry;
    if (value === 1) return !!(form.workerType && form.experience && form.candidates >= 1);
    if (value === 2) return !!form.urgency;
    if (value === 3) return !!(form.contractType && form.salary.trim());
    if (value === 4) return form.locations.length > 0;
    if (value === 5) {
      if (!form.accommodation) return false;
      if (form.accommodation === "Not provided" && !form.accommodationSupport) return false;
      return !!(form.internationalTransport && form.localTransport);
    }
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) goTo(step + 1);
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    setSubmitError("");
    setSubmitStatus("idle");
    setIsSubmitting(true);

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
      category: form.industry,
      position: form.workerType === "Other" ? form.tradeOther : form.workerType,
      positionOther: form.workerType === "Other" ? form.tradeOther : "",
      numberOfPositions: String(form.candidates),
      qualification: form.experience || "No minimum",
      certifications: form.certification.join(", "),
      certificationsOther: "",
      experience: "",
      norwegianLevel: "",
      englishLevel: "",
      driverLicense: "",
      driverLicenseOther: "",
      dNumber: "",
      dNumberOther: "",
      requirements: "",
      contractType: form.contractType,
      salaryPeriod: form.salaryPeriod === "per hour" ? "Per hour" : "Per month",
      salaryMode: "Range",
      salary: form.salary,
      salaryAmount: "",
      salaryFrom: "",
      salaryTo: "",
      hoursUnit: "",
      hoursAmount: "",
      overtime: form.overtime,
      maxOvertimeHours: "",
      hasRotation: "",
      rotationWeeksOn: "",
      rotationWeeksOff: "",
      internationalTravel: form.internationalTransport,
      localTravel: form.localTransport,
      localTravelOther: "",
      accommodation:
        form.accommodation === "Not provided" && form.accommodationSupport
          ? `${form.accommodation} (${form.accommodationSupport})`
          : form.accommodation,
      accommodationCost: "",
      accommodationOther: form.accommodationSupport,
      equipment: "",
      equipmentOther: "",
      tools: "",
      toolsOther: "",
      city: form.locations.join(", "),
      startDate: form.startDate,
      startDateOther: "",
      howDidYouHear: "",
      socialMediaPlatform: "",
      socialMediaOther: "",
      howDidYouHearOther: "",
      referralCompanyName: "",
      referralOrgNumber: "",
      referralEmail: "",
      subscribe: "Yes - send me candidate updates",
      notes: form.notes,
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
      setSubmitError("Could not submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <div className="min-h-dvh bg-[#0a0f18] text-white">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[rgba(10,15,24,0.95)] px-4 backdrop-blur-[12px] md:h-16 md:px-6">
        <p className="text-base font-bold">
          <span className="text-[#C9A84C]">Arbeid</span>Match
        </p>
        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, index) => (
            <ProgressDot key={index} index={index} step={step} />
          ))}
        </div>
        <p className="text-xs text-white/40">{`${step + 1} / ${TOTAL_STEPS}`}</p>
      </header>

      <main className="flex min-h-dvh items-center justify-center px-4 pt-[72px] md:px-6 md:pt-[80px]">
        <form onSubmit={handleSubmit} className="w-full max-w-[560px]">
          <div
            key={step}
            className={`relative overflow-hidden rounded-[24px] border border-[rgba(201,168,76,0.15)] bg-white/[0.03] px-5 py-6 md:px-9 md:py-10 ${
              animating ? "card-exit" : "card-enter"
            }`}
            style={reducedMotion ? { opacity: 1, transform: "translateX(0)" } : undefined}
          >
            <div className="absolute left-[10%] right-[10%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)]" />

            {step === 0 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 1 of 6</p>
                <h2 className="text-2xl font-extrabold">Which industry is this request for?</h2>
                <p className="text-sm text-white/50">Select the primary industry first.</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {INDUSTRY_OPTIONS.map((option) => (
                    <OptionCard
                      key={option}
                      label={option}
                      selected={form.industry === option}
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          industry: option,
                          workerType: "",
                          tradeOther: "",
                          certification: [],
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 2 of 6</p>
                <h2 className="text-2xl font-extrabold">Worker type and requirements</h2>
                <p className="text-sm text-white/50">Worker roles and certifications depend on selected industry.</p>

                <div>
                  <p className={labelClass}>Worker type</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {workerTypeOptions.map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.workerType === option}
                        onClick={() => setForm((prev) => ({ ...prev, workerType: option, certification: [] }))}
                      />
                    ))}
                  </div>
                </div>

                {form.workerType === "Other" && (
                  <input
                    className={inputClass}
                    placeholder="Describe the role"
                    value={form.tradeOther}
                    onChange={(e) => setForm((prev) => ({ ...prev, tradeOther: e.target.value }))}
                  />
                )}

                <div>
                  <p className={labelClass}>Minimum experience</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {["No minimum", "1 to 2 years", "3 to 5 years", "5+ years"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.experience === option}
                        onClick={() => setForm((prev) => ({ ...prev, experience: option }))}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Certifications required</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {certificationOptions.map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.certification.includes(option)}
                        onClick={() => toggleCert(option)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Number of candidates</p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="h-9 w-9 rounded-lg border border-[#C9A84C] text-[#C9A84C]"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, candidates: Math.max(1, prev.candidates - 1) }))
                      }
                    >
                      -
                    </button>
                    <span className="min-w-12 text-center text-2xl font-bold">{form.candidates}</span>
                    <button
                      type="button"
                      className="h-9 w-9 rounded-lg border border-[#C9A84C] text-[#C9A84C]"
                      onClick={() => setForm((prev) => ({ ...prev, candidates: prev.candidates + 1 }))}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 3 of 6</p>
                <h2 className="text-2xl font-extrabold">How urgent is this request?</h2>
                <p className="text-sm text-white/50">This helps us prioritize your request.</p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { title: "Urgent", sub: "I need candidates within 1 to 2 weeks", icon: "⚡" },
                    { title: "Normal", sub: "I need candidates within 3 to 4 weeks", icon: "🕒" },
                    { title: "Planning ahead", sub: "I need candidates in 1 to 3 months", icon: "📅" },
                    { title: "Not sure yet", sub: "I need help estimating the timeline", icon: "?" },
                  ].map((item) => (
                    <OptionCard
                      key={item.title}
                      label={item.title}
                      sublabel={item.sub}
                      selected={form.urgency === item.title}
                      onClick={() => setForm((prev) => ({ ...prev, urgency: item.title }))}
                      icon={<span className="text-lg text-[#C9A84C]">{item.icon}</span>}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 4 of 6</p>
                <h2 className="text-2xl font-extrabold">What are you offering?</h2>
                <p className="text-sm text-white/50">Help candidates understand the conditions.</p>

                <div>
                  <p className={labelClass}>Contract type</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {["Permanent employment", "Temporary hire", "Staffing (innleie)", "Project-based"].map(
                      (option) => (
                        <OptionCard
                          key={option}
                          label={option}
                          selected={form.contractType === option}
                          onClick={() => setForm((prev) => ({ ...prev, contractType: option }))}
                        />
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Salary range</p>
                  <div className="mb-3 flex gap-2">
                    {(["per hour", "per month"] as const).map((period) => (
                      <button
                        key={period}
                        type="button"
                        className={`rounded-lg border px-4 py-2 text-sm transition ${
                          form.salaryPeriod === period
                            ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                            : "border-white/10 bg-white/[0.03] text-white/60"
                        }`}
                        onClick={() => setForm((prev) => ({ ...prev, salaryPeriod: period }))}
                      >
                        {period === "per hour" ? "Per hour" : "Per month"}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input
                      className={inputClass}
                      placeholder={
                        form.salaryPeriod === "per hour" ? "e.g. 280 to 330" : "e.g. 45000 to 55000"
                      }
                      value={form.salary}
                      onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">
                      NOK
                    </span>
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Overtime</p>
                  <div className="flex flex-wrap gap-2">
                    {["Yes", "Occasionally", "No"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.overtime === option}
                        onClick={() => setForm((prev) => ({ ...prev, overtime: option }))}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 5 of 6</p>
                <h2 className="text-2xl font-extrabold">Where will they work?</h2>
                <p className="text-sm text-white/50">Select one or multiple work locations in Norway.</p>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">⌕</span>
                  <input
                    className={`${inputClass} pl-10`}
                    placeholder="Search city or region..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                  />
                </div>

                <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleLocation(city)}
                      className={`w-full rounded-lg border px-4 py-2 text-left text-sm transition ${
                        form.locations.includes(city)
                          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.06)] text-[#C9A84C]"
                          : "border-white/10 bg-white/[0.03] text-white hover:border-white/20"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{city}</span>
                        {form.locations.includes(city) ? <span>✓</span> : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 6 of 6</p>
                <h2 className="text-2xl font-extrabold">Final details</h2>
                <p className="text-sm text-white/50">Almost done. A few last questions.</p>

                <div>
                  <p className={labelClass}>Accommodation</p>
                  <div className="flex flex-wrap gap-2">
                    {["Provided", "Not provided"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.accommodation === option}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            accommodation: option,
                            accommodationSupport: option === "Not provided" ? prev.accommodationSupport : "",
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>

                {form.accommodation === "Not provided" && (
                  <div>
                    <p className={labelClass}>If not provided, can you help candidate find accommodation?</p>
                    <div className="flex flex-wrap gap-2">
                      {["Can help candidate find accommodation", "Cannot help candidate find accommodation"].map(
                        (option) => (
                          <OptionCard
                            key={option}
                            label={option}
                            selected={form.accommodationSupport === option}
                            onClick={() => setForm((prev) => ({ ...prev, accommodationSupport: option }))}
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <p className={labelClass}>International transport</p>
                  <div className="flex flex-wrap gap-2">
                    {["Covered", "Not covered", "Negotiable"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.internationalTransport === option}
                        onClick={() => setForm((prev) => ({ ...prev, internationalTransport: option }))}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Local transport</p>
                  <div className="flex flex-wrap gap-2">
                    {["Covered", "Not covered", "Negotiable"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.localTransport === option}
                        onClick={() => setForm((prev) => ({ ...prev, localTransport: option }))}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>When do they start?</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["As soon as possible", "Within 1 month", "In 2 to 3 months", "Flexible"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.startDate === option}
                        onClick={() => setForm((prev) => ({ ...prev, startDate: option }))}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Anything else? (optional)</p>
                  <textarea
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Special requirements, shift patterns, language needs..."
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <div
              className={`mt-6 flex w-full items-center gap-3 border-t border-white/10 pt-5 ${
                step > 0 ? "justify-between" : "justify-end"
              }`}
            >
              <div>
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => goTo(step - 1)}
                    disabled={animating || isSubmitting}
                    className="rounded-[10px] border border-white/20 px-6 py-3 text-sm text-white/60 disabled:opacity-40"
                  >
                    Back
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (step < TOTAL_STEPS - 1) {
                    handleNext();
                  } else {
                    void handleSubmit();
                  }
                }}
                disabled={animating || isSubmitting || !isStepValid(step)}
                className="inline-flex min-w-[150px] items-center justify-center gap-2 rounded-[10px] bg-[#C9A84C] px-7 py-3 text-sm font-bold text-[#0f1923] transition-all duration-200 hover:scale-[1.02] hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0f1923]/40 border-t-[#0f1923]" />
                    Submitting...
                  </>
                ) : step === TOTAL_STEPS - 1 ? (
                  "Submit Request"
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {submitStatus === "error" && (
        <div className="fixed bottom-[88px] left-1/2 z-40 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 rounded-[10px] border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {submitError}
        </div>
      )}

      <style jsx>{`
        .card-enter {
          animation: cardIn ${reducedMotion ? "0ms" : "250ms"} ease-out forwards;
          animation-delay: ${reducedMotion ? "0ms" : "180ms"};
          opacity: ${reducedMotion ? "1" : "0"};
          transform: ${reducedMotion ? "translateX(0)" : "translateX(20px)"};
        }
        .card-exit {
          opacity: ${reducedMotion ? "1" : "0"};
          transform: ${reducedMotion ? "translateX(0)" : "translateX(-20px)"};
          transition: all ${reducedMotion ? "0ms" : "180ms"} ease;
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
