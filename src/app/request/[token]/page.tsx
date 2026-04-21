"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Bolt,
  Factory,
  HardHat,
  HeartPulse,
  LucideIcon,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

type TokenData = {
  company: string;
  email: string;
  job_summary: string;
  org_number?: string;
  full_name?: string;
  phone?: string;
  gdpr_consent?: boolean;
};

type RequestForm = {
  industry: string;
  workerType: string;
  trade: string;
  tradeOther: string;
  experience: string;
  certification: string[];
  certificationsOther: string;
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
  "Plumbing and HVAC (VVS)",
  "Construction",
  "Welding and Metal",
  "Logistics",
  "Industry and Production",
  "Cleaning",
  "HoReCa",
  "Healthcare",
];

const WORKER_TYPES_BY_INDUSTRY: Record<string, string[]> = {
  Electrical: [
    "Electrician",
    "Industrial electrician",
    "Automation technician",
    "Service technician",
    "Low voltage technician",
    "Fiber optic technician",
    "Telecom technician",
    "Solar installer",
    "Other",
  ],
  "Plumbing and HVAC (VVS)": [
    "Plumber",
    "HVAC technician",
    "Ventilation installer",
    "Refrigeration technician",
    "Pipe fitter",
    "Sprinkler installer",
    "Other",
  ],
  Construction: [
    "Carpenter",
    "Formworker",
    "Concrete worker",
    "Steel fixer",
    "Construction worker",
    "Bricklayer",
    "Roofer",
    "Scaffolder",
    "Drywall installer",
    "Painter",
    "Tile layer",
    "Floor layer",
    "Insulation worker",
    "Plasterer",
    "Demolition worker",
    "General construction laborer",
    "Other",
  ],
  "Welding and Metal": [
    "Welder",
    "TIG welder",
    "MIG/MAG welder",
    "Industrial mechanic",
    "CNC operator",
    "Metal fabricator",
    "Pipe welder",
    "Plate worker",
    "Sheet metal worker",
    "Maintenance mechanic",
    "Turner",
    "Mill operator",
    "Other",
  ],
  Logistics: [
    "Truck driver",
    "Driver",
    "Forklift operator",
    "Warehouse worker",
    "Delivery driver",
    "Terminal worker",
    "Picker/Packer",
    "Logistics coordinator",
    "Bus driver",
    "Van driver",
    "Crane operator",
    "Other",
  ],
  "Industry and Production": [
    "Machine operator",
    "Production worker",
    "Industrial worker",
    "Process operator",
    "Assembly worker",
    "Packaging operator",
    "Factory worker",
    "Excavator operator",
    "Wheel loader operator",
    "Road worker",
    "Asphalt worker",
    "Tunnel worker",
    "Other",
  ],
  Cleaning: [
    "Cleaner",
    "Industrial cleaner",
    "Housekeeping staff",
    "Janitor",
    "Window cleaner",
    "Facility technician",
    "Special cleaning operator",
    "Other",
  ],
  HoReCa: [
    "Chef",
    "Cook",
    "Sous chef",
    "Pizza chef",
    "Baker",
    "Kitchen assistant",
    "Waiter",
    "Dishwasher",
    "Bartender",
    "Hotel receptionist",
    "Pastry chef",
    "Other",
  ],
  Healthcare: [
    "Nurse",
    "Practical nurse",
    "Healthcare assistant",
    "Care worker",
    "Elderly care worker",
    "Personal assistant",
    "Physiotherapist",
    "Other",
  ],
};

const CERTIFICATIONS_BY_WORKER_TYPE: Record<string, string[]> = {
  Electrician: ["DSB authorization", "Trade certificate", "Other"],
  "Industrial electrician": ["DSB authorization", "Trade certificate", "Other"],
  "Automation technician": ["Trade certificate", "Other"],
  "Service technician": ["Trade certificate", "Other"],
  "Low voltage technician": ["Trade certificate", "Other"],
  "Fiber optic technician": ["Trade certificate", "Other"],
  "Telecom technician": ["Trade certificate", "Other"],
  "Solar installer": ["Trade certificate", "Other"],
  Plumber: ["Trade certificate", "Other"],
  "HVAC technician": ["Trade certificate", "Other"],
  "Ventilation installer": ["Trade certificate", "Other"],
  "Refrigeration technician": ["Trade certificate", "Other"],
  "Pipe fitter": ["Trade certificate", "Other"],
  "Sprinkler installer": ["Trade certificate", "Other"],
  Carpenter: ["Trade certificate", "Other"],
  Formworker: ["Trade certificate", "Other"],
  "Concrete worker": ["Trade certificate", "Other"],
  "Steel fixer": ["Trade certificate", "Other"],
  "Construction worker": ["Trade certificate", "Other"],
  Bricklayer: ["Trade certificate", "Other"],
  Roofer: ["Trade certificate", "Other"],
  Scaffolder: ["Trade certificate", "Other"],
  "Drywall installer": ["Trade certificate", "Other"],
  Painter: ["Trade certificate", "Other"],
  "Tile layer": ["Trade certificate", "Other"],
  "Floor layer": ["Trade certificate", "Other"],
  "Insulation worker": ["Trade certificate", "Other"],
  Plasterer: ["Trade certificate", "Other"],
  "Demolition worker": ["Trade certificate", "Other"],
  "General construction laborer": ["None required", "Other"],
  Welder: ["ISO 9606", "NDT Level II", "Other"],
  "TIG welder": ["ISO 9606", "NDT Level II", "Other"],
  "MIG/MAG welder": ["ISO 9606", "NDT Level II", "Other"],
  "Industrial mechanic": ["Trade certificate", "Other"],
  "CNC operator": ["Trade certificate", "Other"],
  "Metal fabricator": ["Trade certificate", "Other"],
  "Pipe welder": ["ISO 9606", "NDT Level II", "Other"],
  "Plate worker": ["Trade certificate", "Other"],
  "Sheet metal worker": ["Trade certificate", "Other"],
  "Maintenance mechanic": ["Trade certificate", "Other"],
  Turner: ["Trade certificate", "Other"],
  "Mill operator": ["Trade certificate", "Other"],
  "Truck driver": [
    "Driver's license C",
    "Driver's license CE",
    "Driver's license C1",
    "Driver's license C1E",
    "Professional competence certificate (YSK / Code 95)",
    "ADR certificate",
    "Digital tachograph card",
    "Other",
  ],
  Driver: [
    "Driver's license B",
    "Driver's license BE (trailer / remorca E)",
    "Driver's license C",
    "Driver's license C1",
    "Professional competence certificate (YSK / Code 95, where required)",
    "Other",
  ],
  "Forklift operator": ["Forklift certificate", "Other"],
  "Warehouse worker": ["Forklift certificate", "Other"],
  "Delivery driver": [
    "Driver's license B",
    "Driver's license BE (trailer / remorca E)",
    "Driver's license C1",
    "Driver's license C",
    "Professional competence certificate (YSK / Code 95, where required)",
    "Other",
  ],
  "Terminal worker": ["Forklift certificate", "Other"],
  "Picker/Packer": ["None required", "Other"],
  "Logistics coordinator": ["None required", "Other"],
  "Bus driver": [
    "Driver's license D",
    "Driver's license DE",
    "Professional competence certificate (YSK / Code 95)",
    "Passenger transport qualification (YKB, where required)",
    "Other",
  ],
  "Van driver": [
    "Driver's license B",
    "Driver's license BE (trailer / remorca E)",
    "Driver's license C1",
    "Professional competence certificate (YSK / Code 95, where required)",
    "Other",
  ],
  "Crane operator": ["Crane operator certificate", "Other"],
  "Machine operator": ["Trade certificate", "Other"],
  "Production worker": ["None required", "Other"],
  "Industrial worker": ["ATEX/EX", "Other"],
  "Process operator": ["Trade certificate", "Other"],
  "Assembly worker": ["None required", "Other"],
  "Packaging operator": ["None required", "Other"],
  "Factory worker": ["None required", "Other"],
  "Excavator operator": ["Machine operator certificate", "Other"],
  "Wheel loader operator": ["Machine operator certificate", "Other"],
  "Road worker": ["None required", "Other"],
  "Asphalt worker": ["None required", "Other"],
  "Tunnel worker": ["None required", "Other"],
  Cleaner: ["None required", "Other"],
  "Industrial cleaner": ["None required", "Other"],
  "Housekeeping staff": ["None required", "Other"],
  Janitor: ["None required", "Other"],
  "Window cleaner": ["None required", "Other"],
  "Facility technician": ["None required", "Other"],
  "Special cleaning operator": ["None required", "Other"],
  Chef: ["Food safety certificate", "Other"],
  Cook: ["Food safety certificate", "Other"],
  "Sous chef": ["Food safety certificate", "Other"],
  "Pizza chef": ["Food safety certificate", "Other"],
  Baker: ["Food safety certificate", "Other"],
  "Kitchen assistant": ["Food safety certificate", "Other"],
  Waiter: ["Food safety certificate", "Other"],
  Dishwasher: ["Food safety certificate", "Other"],
  Bartender: ["Food safety certificate", "Other"],
  "Hotel receptionist": ["None required", "Other"],
  "Pastry chef": ["Food safety certificate", "Other"],
  Nurse: ["Healthcare authorization", "Other"],
  "Practical nurse": ["Healthcare authorization", "Other"],
  "Healthcare assistant": ["Healthcare authorization", "Other"],
  "Care worker": ["Healthcare authorization", "Other"],
  "Elderly care worker": ["Healthcare authorization", "Other"],
  "Personal assistant": ["Healthcare authorization", "Other"],
  Physiotherapist: ["Healthcare authorization", "Other"],
  Other: ["None required", "Other"],
};

const initialForm: RequestForm = {
  industry: "",
  workerType: "",
  trade: "",
  tradeOther: "",
  experience: "",
  certification: [],
  certificationsOther: "",
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

const CHECK_ROLE_GROUPS: Array<{ industry: string; icon: LucideIcon; roles: string[] }> = [
  {
    industry: "Construction & Civil",
    icon: HardHat,
    roles: [
      "Site Manager",
      "Carpenter",
      "Bricklayer",
      "Concrete Worker",
      "Scaffolder",
      "Painter",
      "Roofer",
      "Demolition Worker",
      "Civil Engineer",
      "Surveyor",
    ],
  },
  {
    industry: "Electrical & Technical",
    icon: Bolt,
    roles: [
      "Electrician",
      "DSB Authorized Electrician",
      "Plumber",
      "HVAC Technician",
      "Automation Engineer",
      "Instrumentation Tech",
      "Cable Layer",
      "Welder",
      "Pipefitter",
    ],
  },
  {
    industry: "Logistics & Transport",
    icon: Truck,
    roles: [
      "Truck Driver",
      "Forklift Operator",
      "Warehouse Worker",
      "Logistics Coordinator",
      "Bus Driver",
      "Heavy Vehicle Driver",
      "Crane Operator",
      "Port Worker",
    ],
  },
  {
    industry: "Industry & Production",
    icon: Factory,
    roles: [
      "Machine Operator",
      "CNC Operator",
      "Steel Worker",
      "Insulation Worker",
      "Quality Inspector",
      "Maintenance Technician",
      "Production Worker",
      "Offshore Worker",
      "Mechanic",
    ],
  },
  {
    industry: "Cleaning & Facility",
    icon: Sparkles,
    roles: ["Cleaner", "Facility Manager", "Window Cleaner", "Industrial Cleaner", "Waste Handler"],
  },
  {
    industry: "Hospitality & Healthcare",
    icon: HeartPulse,
    roles: ["Kitchen Staff", "Chef", "Hotel Staff", "Healthcare Assistant", "Care Worker", "Cook"],
  },
];

function OptionCard({
  label,
  sublabel,
  selected,
  onClick,
  icon,
  className,
  labelClassName,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-left transition-all duration-180 ${
        selected
          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)] text-[#C9A84C]"
          : "border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.05]"
      } ${className || ""}`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className={`block text-sm font-semibold ${labelClassName || ""}`}>{label}</span>
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
  const SEARCH_MESSAGES = [
    "Connecting to candidate database...",
    "Searching registered profiles...",
    "Matching role requirements...",
    "Analyzing availability...",
    "Cross-referencing location data...",
    "Finalizing results...",
    "Almost ready...",
  ] as const;

  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [form, setForm] = useState<RequestForm>(initialForm);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [tokenGate, setTokenGate] = useState<"loading" | "ready" | "blocked" | "error">("loading");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showChoice, setShowChoice] = useState(true);
  const [showCheckFlow, setShowCheckFlow] = useState(false);
  const [choiceMode, setChoiceMode] = useState<"cards" | "check">("cards");
  const [checkState, setCheckState] = useState<"idle" | "searching" | "result">("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [roleQuery, setRoleQuery] = useState("");
  const [searchMessageIndex, setSearchMessageIndex] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [showInstantPanel, setShowInstantPanel] = useState(false);

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!token) return;
    void fetch(`/api/token-data/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success || !data?.data) {
          setTokenGate("error");
          return;
        }
        const row = data.data as TokenData;
        if (row.gdpr_consent !== true) {
          setTokenGate("blocked");
          return;
        }
        setTokenData(row);
        setTokenGate("ready");
      })
      .catch(() => {
        setTokenGate("error");
      });
  }, [token]);

  const goTo = (next: number) => {
    if (next < 0 || next > TOTAL_STEPS - 1 || animating) return;
    if (reducedMotion) {
      setStep(next);
      scrollToTop();
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
      scrollToTop();
    }, 180);
  };

  useEffect(() => {
    if (submitStatus === "success") {
      scrollToTop();
    }
  }, [submitStatus]);

  const toggleCert = (value: string) => {
    setForm((prev) => {
      const exists = prev.certification.includes(value);
      const nextCertifications = exists
        ? prev.certification.filter((item) => item !== value)
        : [...prev.certification, value];
      return {
        ...prev,
        certification: nextCertifications,
        certificationsOther: nextCertifications.includes("Other") ? prev.certificationsOther : "",
      };
    });
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
    if (value === 1) {
      if (form.workerType === "Other" && !form.tradeOther.trim()) return false;
      return !!(form.workerType && form.experience && form.candidates >= 1);
    }
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
    setSubmitNotice("");
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
      certificationsOther: form.certification.includes("Other") ? form.certificationsOther.trim() : "",
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
      overtime:
        form.overtime.toLowerCase() === "yes"
          ? true
          : form.overtime.toLowerCase() === "no"
            ? false
            : null,
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

      try {
        const emailRes = await fetch("/api/send-request-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!emailRes.ok) {
          throw new Error("send-request-email");
        }
      } catch {
        setSubmitNotice("Request saved, but we could not send the confirmation email right now.");
      }

      await fetch(`/api/verify-token?token=${token}`, { method: "DELETE" }).catch(() => null);
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
      setSubmitError("Could not submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (checkState !== "searching") return;
    const interval = setInterval(() => {
      setSearchMessageIndex((prev) => (prev + 1) % SEARCH_MESSAGES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkState, SEARCH_MESSAGES.length]);

  const runCandidateSearch = async (roleInput?: string) => {
    const role = (roleInput ?? searchTerm).trim();
    if (role.length < 2) return;
    if (roleInput !== undefined) setSearchTerm(roleInput);
    setCheckState("searching");
    setSearchMessageIndex(0);
    setShowInstantPanel(false);
    const waitMs = reducedMotion ? 2000 : 10000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    try {
      const response = await fetch(`/api/check-candidates?role=${encodeURIComponent(role)}`);
      const payload = (await response.json()) as { count?: number };
      setCheckCount(typeof payload.count === "number" ? payload.count : 0);
    } catch {
      setCheckCount(0);
    } finally {
      setCheckState("result");
    }
  };

  const filteredRoles = useMemo(() => {
    if (!selectedIndustry) return [];
    const group = CHECK_ROLE_GROUPS.find((item) => item.industry === selectedIndustry);
    if (!group) return [];
    const query = roleQuery.trim().toLowerCase();
    if (!query) return group.roles.slice(0, 8);
    const startsWith = group.roles.filter((role) => role.toLowerCase().startsWith(query));
    const contains = group.roles.filter(
      (role) => role.toLowerCase().includes(query) && !role.toLowerCase().startsWith(query),
    );
    return [...startsWith, ...contains].slice(0, 8);
  }, [roleQuery, selectedIndustry]);

  if (submitStatus === "success") {
    const successCompanyName = tokenData?.company?.trim() || "your company";
    const successAnimationStyle = reducedMotion
      ? undefined
      : ({ animation: "successFadeIn 0.4s ease forwards", opacity: 0 } as const);

    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl items-center justify-center text-center">
          <div style={successAnimationStyle}>
            <div className="mx-auto h-[2px] w-[60px] bg-[#C9A84C]" />
            <svg
              className="mx-auto mt-6 h-12 w-12"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M10 25L20 35L38 14"
                stroke="#C9A84C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h1 className="mt-6 text-[2rem] font-bold tracking-[-0.02em] text-white">Request Received</h1>
            <p className="mt-3 text-base font-normal text-[#C9A84C]">
              Thank you, {successCompanyName}. We will be in touch within 1 business day.
            </p>
            {submitNotice ? <p className="mt-3 text-xs text-amber-300">{submitNotice}</p> : null}

            <div className="mx-auto mt-8 w-[320px] border-t border-[rgba(201,168,76,0.15)]" />

            <div className="mt-8 space-y-3 text-sm text-white">
              <p>Your request has been reviewed by our team</p>
              <p>We will match your requirements with available candidates</p>
              <p>You will receive a shortlist within 3-5 business days</p>
            </div>

            <div className="mx-auto mt-8 w-[320px] border-t border-[rgba(201,168,76,0.15)]" />

            <p className="mt-8 text-sm text-white">
              Questions? Contact us at{" "}
              <a href="mailto:post@arbeidmatch.no" className="text-[#C9A84C] hover:underline">
                post@arbeidmatch.no
              </a>
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-[8px] border border-[rgba(201,168,76,0.3)] px-7 py-2.5 text-sm font-medium text-white transition-colors hover:border-[#C9A84C]"
            >
              Back to home
            </Link>
          </div>
        </div>
        <style jsx>{`
          @keyframes successFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>
      </section>
    );
  }

  if (!showChoice && tokenGate === "loading") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-4 py-20 text-center text-white">
        <p className="text-[rgba(255,255,255,0.65)]">Loading…</p>
      </section>
    );
  }

  if (!showChoice && tokenGate === "blocked") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-4 py-16 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-8 py-10 text-center">
          <div className="mx-auto h-[2px] w-10 bg-[#C9A84C]" aria-hidden />
          <p className="mt-6 text-lg font-medium text-white">Please complete the initial request form first.</p>
          <Link
            href="/request"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3 text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            Go to request form
          </Link>
        </div>
      </section>
    );
  }

  if (!showChoice && tokenGate === "error") {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-4 py-16 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-8 py-10 text-center">
          <p className="text-lg text-[rgba(255,255,255,0.85)]">We could not load this request link.</p>
          <Link
            href="/request"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-[#C9A84C]"
          >
            Start from the request form
          </Link>
        </div>
      </section>
    );
  }

  if (showChoice) {
    return (
      <div className="min-h-dvh bg-[#0a0f18] px-4 py-10 text-white md:px-6">
        <div className="mx-auto w-full max-w-[980px]">
          {!showCheckFlow ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-9 transition-colors hover:border-[rgba(201,168,76,0.45)]">
                <svg className="mb-5 h-9 w-9 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M7 3h7l5 5v13H7V3Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M14 3v5h5M10 12h6M10 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <h2 className="text-2xl font-bold">I know what I need</h2>
                <p className="mt-3 text-sm text-white/65">
                  Submit your full requirements and we will match you with the right candidates.
                </p>
                <button
                  type="button"
                  onClick={() => setShowChoice(false)}
                  className="mt-6 rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                >
                  Start request
                </button>
              </div>
              <div className="rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-9 transition-colors hover:border-[rgba(201,168,76,0.45)]">
                <svg className="mb-5 h-9 w-9 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <h2 className="text-2xl font-bold">Check candidate availability</h2>
                <p className="mt-3 text-sm text-white/65">
                  See how many candidates we have registered for a specific role before committing.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckFlow(true);
                    setChoiceMode("check");
                  }}
                  className="mt-6 rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                >
                  Check now
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-9">
              {checkState === "idle" && (
                <>
                  <h2 className="text-2xl font-bold">What role are you looking for?</h2>
                  {!selectedIndustry ? (
                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                      {CHECK_ROLE_GROUPS.map(({ industry, icon: Icon }) => (
                        <button
                          key={industry}
                          type="button"
                          onClick={() => {
                            setSelectedIndustry(industry);
                            setRoleQuery("");
                          }}
                          className={`cursor-pointer rounded-[12px] border bg-[rgba(255,255,255,0.04)] px-5 py-4 text-left transition-all duration-200 ease-in-out hover:border-[rgba(201,168,76,0.45)] hover:bg-[rgba(255,255,255,0.07)] ${
                            selectedIndustry === industry
                              ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)]"
                              : "border-[rgba(201,168,76,0.2)]"
                          }`}
                        >
                          <Icon className="mb-2 h-5 w-5 text-[#C9A84C]" />
                          <p className="text-sm font-semibold text-white">{industry}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#C9A84C] bg-[rgba(201,168,76,0.08)] px-3 py-1 text-xs font-semibold text-[#C9A84C]">
                        <span>{selectedIndustry}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIndustry("");
                            setRoleQuery("");
                          }}
                          className="inline-flex items-center justify-center text-[#C9A84C]"
                          aria-label="Clear selected industry"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.4)]">Type to search or select from the list</p>
                      <input
                        value={roleQuery}
                        onChange={(event) => setRoleQuery(event.target.value)}
                        placeholder="Search for a role..."
                        className="mt-4 w-full rounded-[12px] border border-[rgba(201,168,76,0.6)] bg-[#0D1B2A] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none"
                      />
                      {filteredRoles.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-[10px]">
                          {filteredRoles.map((role) => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => void runCandidateSearch(role)}
                              className="inline-flex cursor-pointer rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[10px] text-[14px] text-[rgba(255,255,255,0.8)] transition-all duration-200 ease-in-out hover:border-[rgba(201,168,76,0.45)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-[rgba(255,255,255,0.4)]">No roles found. Try a different search.</p>
                      )}
                    </>
                  )}
                </>
              )}
              {checkState === "searching" && (
                <div className="flex flex-col items-center py-10 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Searching for</p>
                  <p className="mb-6 mt-1 text-[1.1rem] font-bold text-white">{searchTerm}</p>
                  <span className={`h-12 w-12 rounded-full border-[3px] border-[rgba(201,168,76,0.2)] border-t-[#C9A84C] ${reducedMotion ? "" : "animate-[spin_1s_linear_infinite]"}`} />
                  <p className="mt-5 text-sm text-[rgba(255,255,255,0.7)]">{SEARCH_MESSAGES[searchMessageIndex]}</p>
                  <div className="mx-auto mt-5 h-px w-[120px] bg-[rgba(201,168,76,0.1)]" />
                  <p className="mt-5 text-center text-[12px] text-[rgba(255,255,255,0.35)]">This search takes a moment.</p>
                  <button
                    type="button"
                    onClick={() => setShowInstantPanel(true)}
                    className="mt-2 cursor-pointer text-[13px] font-semibold text-[#C9A84C] underline"
                  >
                    Get instant results
                  </button>
                  {showInstantPanel && (
                    <div className="relative mt-4 w-full rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-5 text-left">
                      <button
                        type="button"
                        onClick={() => setShowInstantPanel(false)}
                        className="absolute right-4 top-4 text-white/60"
                        aria-label="Close instant search panel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-[15px] font-bold text-white">Instant candidate search</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/70">
                        Instant search is available for ArbeidMatch partners and Premium members. Partners get priority access to our full candidate database with real-time results.
                      </p>
                      <div className="mt-4 flex gap-3">
                        <Link
                          href="/contact"
                          className="rounded-[10px] bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0D1B2A]"
                        >
                          Become a Partner
                        </Link>
                        <Link
                          href="/premium"
                          className="rounded-[10px] border border-[rgba(201,168,76,0.35)] px-4 py-2 text-xs font-semibold text-white"
                        >
                          Upgrade to Premium
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {checkState === "result" && (
                <div className="text-center">
                  {checkCount > 0 ? (
                    <>
                      <p className="text-[3rem] font-extrabold text-[#C9A84C]">{checkCount}</p>
                      <p className="text-base text-white">candidates currently registered for {searchTerm.trim()}</p>
                      <p className="mt-3 text-sm text-white/65">
                        Ready to proceed? Complete your full request and we will present matching profiles.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowChoice(false)}
                        className="mt-6 rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                      >
                        Start full request
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-white">
                        No candidates currently registered for {searchTerm.trim()}.
                      </p>
                      <p className="mt-3 text-sm text-white/65">
                        We are actively sourcing. Submit your request and we will notify you when candidates become available.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowChoice(false)}
                        className="mt-6 rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                      >
                        Submit request anyway
                      </button>
                    </>
                  )}
                  <div className="mx-auto mt-8 h-px w-full max-w-[420px] bg-[rgba(201,168,76,0.18)]" />
                  <p className="mt-5 text-xs text-[rgba(255,255,255,0.4)]">Want faster results?</p>
                  <Link href="/premium" className="mt-2 inline-block text-sm font-semibold text-[#C9A84C]">
                    Upgrade to Premium
                  </Link>
                  <p className="mt-2 text-[11px] text-[rgba(255,255,255,0.3)]">
                    Premium members get priority candidate matching and faster response times.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckState("idle");
                      setSearchTerm("");
                      setCheckCount(0);
                    }}
                    className="mt-6 text-sm text-white/70 underline underline-offset-4"
                  >
                    Search another role
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
                      className="md:h-[52px] md:items-center"
                      labelClassName="md:text-[13px] md:whitespace-nowrap"
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
                {!form.industry && (
                  <p className="mb-2 text-right text-[12px] text-[rgba(255,255,255,0.4)]">Select an industry to continue</p>
                )}
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
                  {form.certification.includes("Other") && (
                    <input
                      className={`${inputClass} mt-3`}
                      placeholder="Specify other certification or authorization"
                      value={form.certificationsOther}
                      onChange={(e) => setForm((prev) => ({ ...prev, certificationsOther: e.target.value }))}
                    />
                  )}
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
                            ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
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
                          ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)] text-[#C9A84C]"
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
                    {["Specific start date", "After notice period", "Flexible start window", "To be agreed"].map((option) => (
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
                  if (step === 1 && form.workerType === "Other" && !form.tradeOther.trim()) {
                    setSubmitStatus("error");
                    setSubmitError("Please specify the trade type.");
                    return;
                  }
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
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
