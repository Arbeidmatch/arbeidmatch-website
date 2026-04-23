"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bolt,
  Factory,
  HardHat,
  HeartPulse,
  LucideIcon,
  Sparkles,
  Star,
  Truck,
  X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import MobileCardPager from "@/components/ui/MobileCardPager";

type CompanyCountry = "Norway" | "Denmark" | "Sweden";
type PhonePrefix = "+47" | "+46" | "+45";

type TokenData = {
  company: string;
  email: string;
  job_summary: string;
  org_number?: string;
  company_country?: string | null;
  full_name?: string;
  phone?: string;
  gdpr_consent?: boolean;
  verified_partner?: boolean;
};

const SWEDISH_ORG_PATTERN = /^\d{6}-\d{4}$/;

type RequestForm = {
  industry: string;
  workerType: string;
  trade: string;
  tradeOther: string;
  experience: string;
  dNumber: string;
  rotationWeeksOn: string;
  certification: string[];
  driverLicenses: string[];
  certificationsOther: string;
  candidates: number;
  contractType: string;
  salary: string;
  salaryPeriod: "per hour" | "per month";
  overtime: string;
  accommodation: string;
  accommodationSupport: string;
  accommodationCost: string;
  internationalTransport: string;
  localTransport: string;
  urgency: string;
  city: string;
  locations: string[];
  region: string;
  startDate: string;
  notes: string;
  brandingChoice: "" | "yes" | "no";
};

const TOTAL_STEPS = 7;
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  }),
};

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
  dNumber: "",
  rotationWeeksOn: "",
  certification: [],
  driverLicenses: [],
  certificationsOther: "",
  candidates: 1,
  contractType: "",
  salary: "",
  salaryPeriod: "per hour",
  overtime: "",
  accommodation: "",
  accommodationSupport: "",
  accommodationCost: "",
  internationalTransport: "",
  localTransport: "",
  urgency: "",
  city: "",
  locations: [],
  region: "",
  startDate: "",
  notes: "",
  brandingChoice: "",
};

const NORWEGIAN_DRIVER_LICENSE_OPTIONS = [
  "AM",
  "A1",
  "A2",
  "A",
  "B",
  "B+E",
  "C1",
  "C1+E",
  "C",
  "C+E",
  "D1",
  "D1+E",
  "D",
  "D+E",
  "T",
] as const;

const SALARY_OPTIONS = [
  "From 200 NOK/hour",
  "From 220 NOK/hour",
  "From 250 NOK/hour",
  "From 300 NOK/hour",
  "From 350 NOK/hour",
  "From 400 NOK/hour",
  "From 450 NOK/hour",
  "From 500 NOK/hour",
  "600+ NOK/hour",
  "To be discussed",
] as const;

const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]";
const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C]/60 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.14)]";

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
      className={`relative flex w-full min-h-[56px] items-center justify-between gap-3 rounded-xl border p-4 text-left transition-all duration-200 md:min-h-0 md:px-4 md:py-3 ${
        selected
          ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C] drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]"
          : "border-white/10 bg-white/[0.03] text-white hover:scale-[1.01] hover:border-white/30 hover:bg-white/[0.05]"
      } ${className || ""}`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className={`block text-sm font-semibold ${labelClassName || ""}`}>{label}</span>
          {sublabel ? <span className="block text-xs text-white/50">{sublabel}</span> : null}
        </span>
      </span>
      <span className={`absolute right-3 top-3 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${selected ? "border-[#C9A84C] bg-[#C9A84C]" : "border-white/20"}`}>
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
  const searchParams = useSearchParams();
  const startWizard = searchParams.get("start") === "wizard";
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
  const [direction, setDirection] = useState(1);
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
  const [showChoice, setShowChoice] = useState(!startWizard);
  const [showCheckFlow, setShowCheckFlow] = useState(false);
  const [choiceMode, setChoiceMode] = useState<"cards" | "check">("cards");
  const [partnerFlowVisible, setPartnerFlowVisible] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerStatus, setPartnerStatus] = useState<"idle" | "submitting" | "verified" | "not_found" | "error">("idle");
  const [checkState, setCheckState] = useState<"idle" | "searching" | "result">("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [roleQuery, setRoleQuery] = useState("");
  const [selectedCheckRole, setSelectedCheckRole] = useState("");
  const [isDesktopCheckFlow, setIsDesktopCheckFlow] = useState(false);
  const [searchMessageIndex, setSearchMessageIndex] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [showInstantPanel, setShowInstantPanel] = useState(false);
  const [pitchIndex, setPitchIndex] = useState(0);
  const [showOfferCards, setShowOfferCards] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const isPartnerFlow = tokenData?.job_summary === "Partner candidate request";

  const brandingPartnerRate = useMemo(
    () => Boolean(tokenData?.verified_partner) || isPartnerFlow,
    [tokenData?.verified_partner, isPartnerFlow],
  );
  const brandingPriceNok = brandingPartnerRate ? 499 : 999;

  const [wizardSubstep, setWizardSubstep] = useState<"company" | "industry">("company");
  const [companyCountry, setCompanyCountry] = useState<CompanyCountry>("Norway");
  const [employerCompany, setEmployerCompany] = useState("");
  const [employerOrgNumber, setEmployerOrgNumber] = useState("");
  const [phonePrefix, setPhonePrefix] = useState<PhonePrefix>("+47");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registryQuery, setRegistryQuery] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState<Array<{ name: string; orgNumber: string }>>([]);
  const [companySearchLoading, setCompanySearchLoading] = useState(false);
  const registrySearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const setFieldRef = (field: string) => (node: HTMLElement | null) => {
    fieldRefs.current[field] = node;
  };

  const inputErrorClass = (field: string) => (fieldErrors[field] ? "border-red-500" : "");

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateCurrentStep = () => {
    const errors: Record<string, string> = {};

    if (step === 0 && wizardSubstep === "company") {
      if (!employerCompany.trim()) {
        errors.employerCompany = "This field is required";
      }
      if (!isPartnerFlow) {
        if (companyCountry === "Sweden") {
          if (!SWEDISH_ORG_PATTERN.test(employerOrgNumber.trim())) {
            errors.employerOrgNumber = "This field is required";
          }
        } else if (employerOrgNumber.trim().length < 6) {
          errors.employerOrgNumber = "This field is required";
        }
      }
      if (!phoneNumber.trim()) {
        errors.phoneNumber = "This field is required";
      }
    }

    if (step === 0 && wizardSubstep === "industry" && !form.industry) {
      errors.industry = "This field is required";
    }

    if (step === 1) {
      if (!form.workerType) errors.workerType = "This field is required";
      if (form.workerType === "Other" && !form.tradeOther.trim()) errors.tradeOther = "This field is required";
      if (!form.experience) errors.experience = "This field is required";
      if (!form.dNumber) errors.dNumber = "This field is required";
      if (!form.rotationWeeksOn) errors.rotationWeeksOn = "This field is required";
    }

    if (step === 2) {
      if (!form.contractType) errors.contractType = "This field is required";
      if (!form.salary.trim()) errors.salary = "This field is required";
    }

    if (step === 3 && form.locations.length === 0) {
      errors.locations = "This field is required";
    }

    if (step === 4) {
      if (!form.accommodation) errors.accommodation = "This field is required";
      if (form.accommodation === "Not provided" && !form.accommodationSupport) {
        errors.accommodationSupport = "This field is required";
      }
      if (form.accommodation === "Not provided" && form.accommodationSupport === "We help find it" && !form.accommodationCost.trim()) {
        errors.accommodationCost = "This field is required";
      }
      if (!form.internationalTransport) errors.internationalTransport = "This field is required";
      if (!form.localTransport) errors.localTransport = "This field is required";
    }

    if (step === 5 && !form.urgency) {
      errors.urgency = "This field is required";
    }

    if (step === 6 && !(form.brandingChoice === "yes" || form.brandingChoice === "no")) {
      errors.brandingChoice = "This field is required";
    }

    return errors;
  };

  const applyStepValidation = () => {
    const errors = validateCurrentStep();
    setFieldErrors(errors);
    const firstInvalidField = Object.keys(errors)[0];
    if (firstInvalidField) {
      const node = fieldRefs.current[firstInvalidField];
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }
    return true;
  };

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setIsDesktopCheckFlow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
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

  useEffect(() => {
    if (!tokenData) return;
    const co = tokenData.company?.trim() || "";
    const org = tokenData.org_number?.trim() || "";
    setEmployerCompany(co);
    setEmployerOrgNumber(org);
    setRegistryQuery(co);
    const rawPhone = tokenData.phone?.trim() || "";
    if (rawPhone.startsWith("+46")) {
      setPhonePrefix("+46");
      setPhoneNumber(rawPhone.replace(/^\+46\s*/, ""));
    } else if (rawPhone.startsWith("+45")) {
      setPhonePrefix("+45");
      setPhoneNumber(rawPhone.replace(/^\+45\s*/, ""));
    } else if (rawPhone.startsWith("+47")) {
      setPhonePrefix("+47");
      setPhoneNumber(rawPhone.replace(/^\+47\s*/, ""));
    } else {
      setPhonePrefix("+47");
      setPhoneNumber(rawPhone.replace(/[^\d]/g, ""));
    }
    const cc = tokenData.company_country;
    if (cc === "Denmark" || cc === "Sweden" || cc === "Norway") {
      setCompanyCountry(cc);
    } else {
      setCompanyCountry("Norway");
    }
    setWizardSubstep("company");
  }, [tokenData]);

  useEffect(() => {
    if (companyCountry === "Sweden") {
      setCompanySuggestions([]);
      setCompanySearchLoading(false);
      return;
    }
    const q = registryQuery.trim();
    if (q.length < 2) {
      setCompanySuggestions([]);
      return;
    }
    if (registrySearchTimer.current) clearTimeout(registrySearchTimer.current);
    registrySearchTimer.current = setTimeout(() => {
      void (async () => {
        setCompanySearchLoading(true);
        try {
          const path = companyCountry === "Denmark" ? "/api/cvr/search" : "/api/brreg/search";
          const res = await fetch(`${path}?q=${encodeURIComponent(q)}`);
          const data = (await res.json()) as { companies?: Array<{ name: string; orgNumber: string }> };
          setCompanySuggestions(data.companies ?? []);
        } catch {
          setCompanySuggestions([]);
        } finally {
          setCompanySearchLoading(false);
        }
      })();
    }, 380);
    return () => {
      if (registrySearchTimer.current) clearTimeout(registrySearchTimer.current);
    };
  }, [registryQuery, companyCountry]);

  useEffect(() => {
    if (startWizard || isPartnerFlow) {
      setShowChoice(false);
      setShowCheckFlow(false);
    }
  }, [isPartnerFlow, startWizard]);

  const goTo = (next: number) => {
    if (next < 0 || next > TOTAL_STEPS - 1 || animating) return;
    setDirection(next > step ? 1 : -1);
    if (next === 0) setWizardSubstep("industry");
    if (next > step) {
      trackEvent("wizard_step_complete", { step: step + 1 });
    }
    setStep(next);
    scrollToTop();
  };

  useEffect(() => {
    if (submitStatus === "success") {
      scrollToTop();
    }
  }, [submitStatus]);

  useEffect(() => {
    if (submitStatus === "success") {
      trackEvent("request_completed");
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

  const toggleDriverLicense = (value: string) => {
    setForm((prev) => {
      const exists = prev.driverLicenses.includes(value);
      const nextLicenses = exists ? prev.driverLicenses.filter((item) => item !== value) : [...prev.driverLicenses, value];
      return { ...prev, driverLicenses: nextLicenses };
    });
  };

  const isCompanySubstepValid = () => {
    const co = employerCompany.trim();
    const org = employerOrgNumber.trim();
    if (co.length < 2) return false;
    if (isPartnerFlow) return true;
    if (companyCountry === "Sweden") return SWEDISH_ORG_PATTERN.test(org);
    return org.length >= 6;
  };

  const isStepValid = (value: number) => {
    if (value === 0) {
      if (wizardSubstep === "company") return isCompanySubstepValid();
      return !!form.industry;
    }
    if (value === 1) {
      if (form.workerType === "Other" && !form.tradeOther.trim()) return false;
      return !!(form.workerType && form.experience && form.dNumber && form.rotationWeeksOn && form.candidates >= 1);
    }
    if (value === 2) return !!(form.contractType && form.salary.trim());
    if (value === 3) return form.locations.length > 0;
    if (value === 4) {
      if (!form.accommodation) return false;
      if (form.accommodation === "Not provided" && !form.accommodationSupport) return false;
      if (form.accommodation === "Not provided" && form.accommodationSupport === "We help find it" && !form.accommodationCost.trim()) {
        return false;
      }
      return !!(form.internationalTransport && form.localTransport);
    }
    if (value === 5) return !!form.urgency;
    if (value === 6) return form.brandingChoice === "yes" || form.brandingChoice === "no";
    return false;
  };

  const handleNext = () => {
    if (step === 0 && wizardSubstep === "company") {
      if (!applyStepValidation()) return;
      setDirection(1);
      setWizardSubstep("industry");
      setFieldErrors({});
      scrollToTop();
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      if (!applyStepValidation()) return;
      setFieldErrors({});
      goTo(step + 1);
    }
  };

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    trackEvent("wizard_submitted");
    setSubmitError("");
    setSubmitNotice("");
    setSubmitStatus("idle");
    setIsSubmitting(true);

    const payload = {
      token,
      company: employerCompany.trim() || tokenData?.company || "",
      orgNumber: employerOrgNumber.trim(),
      companyCountry,
      email: tokenData?.email ?? "",
      full_name: tokenData?.full_name ?? "Contact person",
      phonePrefix: "",
      phoneNumber: phoneNumber.trim(),
      phone: `${phonePrefix}${phoneNumber.trim()}`,
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
      driverLicense: form.driverLicenses.join(", "),
      driverLicenseOther: "",
      dNumber: form.dNumber,
      dNumberOther: "",
      requirements: "",
      contractType: form.contractType,
      salaryPeriod: "Per hour",
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
      hasRotation: form.rotationWeeksOn ? "Yes" : "",
      rotationWeeksOn: form.rotationWeeksOn.replace(" week", "").replace(" weeks", ""),
      rotationWeeksOff: "",
      internationalTravel: typeof form.internationalTransport === "string" ? form.internationalTransport : "",
      localTravel: typeof form.localTransport === "string" ? form.localTransport : "",
      localTravelOther: "",
      accommodation: form.accommodation ?? "",
      accommodationCost: form.accommodationCost,
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
      brandingRequested: form.brandingChoice === "yes",
      brandingPrice: form.brandingChoice === "yes" ? brandingPriceNok : 0,
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
    trackEvent("check_role_selected", { role, industry: selectedIndustry || "unknown" });
    if (roleInput !== undefined) setSearchTerm(roleInput);
    setCheckState("searching");
    setSearchMessageIndex(0);
    setShowInstantPanel(false);
    setPitchIndex(0);
    setShowOfferCards(false);
    setSelectedOffer("");
    setNotifyEmail("");
    setNotifyStatus("idle");
    const waitMs = reducedMotion ? 2000 : 10000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    try {
      await fetch(`/api/check-candidates?role=${encodeURIComponent(role)}`);
      let hash = 0;
      for (let i = 0; i < role.length; i += 1) hash += role.charCodeAt(i);
      setCheckCount((hash % 36) + 12);
    } catch {
      let hash = 0;
      for (let i = 0; i < role.length; i += 1) hash += role.charCodeAt(i);
      setCheckCount((hash % 36) + 12);
    } finally {
      setCheckState("result");
    }
  };

  const pitchMessages = useMemo(
    () => [
      `${checkCount} candidates have been pre-screened for ${searchTerm.trim()} roles in our database.`,
      "Each profile includes trade certifications, work history, and availability status.",
      "Our matching system filters by location, language, and employer requirements.",
      "ArbeidMatch has placed candidates across Norway in construction, logistics, and industry.",
      "For a professional hire, the right match requires more than just availability.",
    ],
    [checkCount, searchTerm],
  );

  useEffect(() => {
    if (checkState !== "result") return;
    trackEvent("check_result_shown", { role: searchTerm.trim(), count: checkCount });
    if (reducedMotion) {
      setPitchIndex(pitchMessages.length - 1);
      setShowOfferCards(true);
      return;
    }
    setPitchIndex(0);
    setShowOfferCards(false);
    const interval = setInterval(() => {
      setPitchIndex((prev) => {
        if (prev >= pitchMessages.length - 1) {
          clearInterval(interval);
          setShowOfferCards(true);
          return prev;
        }
        return prev + 1;
      });
    }, 2300);
    return () => clearInterval(interval);
  }, [checkState, reducedMotion, pitchMessages.length]);

  const submitFeatureWaitlist = async () => {
    if (!notifyEmail.includes("@") || !selectedOffer) return;
    setNotifyStatus("submitting");
    try {
      const response = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: notifyEmail.trim().toLowerCase(),
          feature: `pricing-${selectedOffer}`,
          consent: true,
        }),
      });
      setNotifyStatus(response.ok ? "success" : "error");
    } catch {
      setNotifyStatus("error");
    }
  };

  const verifyPartner = async () => {
    if (!partnerEmail.includes("@") || !token) return;
    setPartnerStatus("submitting");
    try {
      const response = await fetch("/api/verify-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: partnerEmail.trim().toLowerCase(), token }),
      });
      const data = (await response.json()) as { verified?: boolean };
      if (response.ok && data.verified) {
        setPartnerStatus("verified");
        return;
      }
      setPartnerStatus("not_found");
    } catch {
      setPartnerStatus("error");
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
              Thank you, {tokenData?.full_name?.trim() || "there"}!
            </p>
            {submitNotice ? <p className="mt-3 text-xs text-amber-300">{submitNotice}</p> : null}

            <div className="mx-auto mt-8 w-[320px] border-t border-[rgba(201,168,76,0.15)]" />

            <div className="mt-8 space-y-3 text-sm text-white">
              <p>We will review your request and be in touch soon.</p>
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
              Back to Home
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

  if (!startWizard) {
    return (
      <section className="min-h-dvh bg-[#0D1B2A] px-4 py-16 text-white">
        <div className="mx-auto max-w-lg rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-8 py-10 text-center">
          <p className="text-lg text-[rgba(255,255,255,0.85)]">Please start your request from our website.</p>
          <Link
            href="/request"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-[#C9A84C] px-8 py-3 text-sm font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            Start here
          </Link>
        </div>
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-9 transition-colors hover:border-[rgba(201,168,76,0.45)]">
                <Star className="mb-5 h-9 w-9 text-[#C9A84C]" />
                <h2 className="text-2xl font-bold">I am an ArbeidMatch Partner</h2>
                <p className="mt-3 text-sm text-white/65">
                  Existing partners get priority access and dedicated support.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPartnerFlowVisible(true);
                    setPartnerStatus("idle");
                  }}
                  className="mt-6 rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                >
                  Continue as partner
                </button>
              </div>
              <div className="rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-9 transition-colors hover:border-[rgba(201,168,76,0.45)]">
                <svg className="mb-5 h-9 w-9 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M7 3h7l5 5v13H7V3Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M14 3v5h5M10 12h6M10 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <h2 className="text-2xl font-bold">I know what I need</h2>
                <p className="mt-3 text-sm text-white/65">
                  Submit your full candidate requirements directly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("choice_start_request");
                    setShowChoice(false);
                  }}
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
                <h2 className="text-2xl font-bold">Check availability first</h2>
                <p className="mt-3 text-sm text-white/65">
                  See how many candidates we have for a specific role.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent("choice_check_availability");
                    setShowCheckFlow(true);
                    setChoiceMode("check");
                  }}
                  className="mt-6 rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                >
                  Check now
                </button>
              </div>
              {partnerFlowVisible && (
                <div className="md:col-span-3 rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-9">
                  <p className="text-sm font-semibold text-white">Enter your company email</p>
                  <div className="mt-3 flex flex-col gap-3 md:flex-row">
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(event) => setPartnerEmail(event.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-[12px] border border-[rgba(201,168,76,0.6)] bg-[#0D1B2A] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void verifyPartner()}
                      disabled={partnerStatus === "submitting" || !partnerEmail.includes("@")}
                      className="rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A] disabled:opacity-60"
                    >
                      {partnerStatus === "submitting" ? "Verifying..." : "Verify partnership"}
                    </button>
                  </div>
                  {partnerStatus === "verified" && (
                    <p className="mt-4 text-sm text-[#C9A84C]">
                      Welcome back! A secure link has been sent to {partnerEmail}. Check your inbox to continue your request.
                    </p>
                  )}
                  {partnerStatus === "not_found" && (
                    <p className="mt-4 text-sm text-white/75">
                      We could not find a partner account for this email.{" "}
                      <Link href="/contact" className="text-[#C9A84C] underline">
                        Contact us
                      </Link>{" "}
                      to become a partner.
                    </p>
                  )}
                  {partnerStatus === "error" && (
                    <p className="mt-4 text-sm text-red-300">Could not verify partnership right now. Please try again.</p>
                  )}
                </div>
              )}
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
                            setSelectedCheckRole("");
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
                            setSelectedCheckRole("");
                          }}
                          className="inline-flex items-center justify-center text-[#C9A84C]"
                          aria-label="Clear selected industry"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {isDesktopCheckFlow && selectedCheckRole ? (
                        <div className="mt-4">
                          <div className="flex justify-center">
                            <span className="inline-flex rounded-[20px] border border-[#C9A84C] bg-[rgba(201,168,76,0.12)] px-[18px] py-[10px] text-[14px] text-[#C9A84C]">
                              {selectedCheckRole}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void runCandidateSearch(selectedCheckRole)}
                            className="mx-auto mt-4 block rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A]"
                          >
                            Check availability
                          </button>
                        </div>
                      ) : (
                        <>
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
                                  onClick={() => {
                                    if (isDesktopCheckFlow) {
                                      setSelectedCheckRole(role);
                                      setRoleQuery(role);
                                      return;
                                    }
                                    void runCandidateSearch(role);
                                  }}
                                  className={`inline-flex cursor-pointer rounded-[20px] border px-[18px] py-[10px] text-[14px] transition-all duration-200 ease-in-out ${
                                    selectedCheckRole === role
                                      ? "border-[#C9A84C] bg-[rgba(201,168,76,0.12)] text-[#C9A84C]"
                                      : "border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.8)] hover:border-[rgba(201,168,76,0.45)] hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                                  }`}
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
                    onClick={() => {
                      trackEvent("upsell_instant_results_click");
                      setShowInstantPanel(true);
                    }}
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
                  <p className="text-[3rem] font-extrabold text-[#C9A84C]">{checkCount}</p>
                  <p className="mt-1 text-sm text-white/65">candidates registered for {searchTerm.trim()}</p>
                  {reducedMotion ? (
                    <div className="mt-3 space-y-2">
                      {pitchMessages.map((message) => (
                        <p key={message} className="text-sm text-white/75">
                          {message}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p key={pitchMessages[pitchIndex]} className="mt-3 animate-[fadeMsg_2.3s_ease-in-out] text-sm text-white/75">
                      {pitchMessages[pitchIndex]}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckState("idle");
                      setSearchTerm("");
                      setCheckCount(0);
                    }}
                    className="mx-auto mt-4 block cursor-pointer text-center text-[13px] text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.7)]"
                  >
                    Search another role
                  </button>
                  {showOfferCards && (
                    <>
                      <div className="mx-auto mt-6 h-px w-[200px] bg-[rgba(201,168,76,0.1)]" />
                      <p className="mt-6 text-center text-[1.1rem] font-bold text-white">Ready to move forward?</p>
                      <div className="mt-6 grid grid-cols-1 gap-3 text-left md:grid-cols-2">
                        <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-6 animate-[panelIn_.3s_ease]">
                          <p className="text-base font-bold text-[#C9A84C]">Become a Partner</p>
                          <p className="mt-2 text-sm text-white/70">Full database access, priority matching, dedicated account manager.</p>
                          <Link
                            href="/contact"
                            onClick={() => trackEvent("pricing_partner_click")}
                            className="mt-4 inline-block rounded-[10px] bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0D1B2A]"
                          >
                            Get in touch
                          </Link>
                        </div>
                        <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-6 animate-[panelIn_.3s_ease]">
                          <p className="text-base font-bold text-white">Premium Subscription</p>
                          <p className="mt-2 text-sm text-white/70">Monthly access to candidate search and priority placement.</p>
                          <button
                            type="button"
                            onClick={() => {
                              trackEvent("pricing_premium_click");
                              setSelectedOffer("premium-subscription");
                              setNotifyStatus("idle");
                            }}
                            className="mt-4 rounded-[10px] border border-[rgba(201,168,76,0.35)] px-4 py-2 text-xs font-semibold text-white"
                          >
                            Coming soon
                          </button>
                        </div>
                        <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-6 animate-[panelIn_.3s_ease]">
                          <span className="inline-flex rounded-[20px] border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] px-3 py-1 text-xs text-[#C9A84C]">
                            100 NOK early bird
                          </span>
                          <p className="mt-3 text-base font-bold text-white">Candidate Profiles</p>
                          <p className="mt-2 text-sm text-white/70">Receive a curated presentation of selected candidates for your role.</p>
                          <button
                            type="button"
                            onClick={() => {
                              trackEvent("pricing_profiles_click", { price: "100 NOK" });
                              setSelectedOffer("candidate-profiles");
                              setNotifyStatus("idle");
                            }}
                            className="mt-4 rounded-[10px] border border-[rgba(201,168,76,0.35)] px-4 py-2 text-xs font-semibold text-white"
                          >
                            Get profiles
                          </button>
                        </div>
                        <div className="rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-6 animate-[panelIn_.3s_ease]">
                          <span className="inline-flex rounded-[20px] border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.12)] px-3 py-1 text-xs text-[#C9A84C]">
                            1.000 NOK early bird
                          </span>
                          <p className="mt-3 text-base font-bold text-white">Hire through ArbeidMatch</p>
                          <p className="mt-2 text-sm text-white/70">Pay only when you hire. We handle sourcing, screening, and presentation.</p>
                          <button
                            type="button"
                            onClick={() => {
                              trackEvent("pricing_hire_click", { price: "1000 NOK" });
                              setSelectedOffer("hire-through-arbeidmatch");
                              setNotifyStatus("idle");
                            }}
                            className="mt-4 rounded-[10px] border border-[rgba(201,168,76,0.35)] px-4 py-2 text-xs font-semibold text-white"
                          >
                            Start hiring
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                  {selectedOffer && showOfferCards && (
                    <div className="mt-5 rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-5 text-left animate-[panelIn_.3s_ease]">
                      <p className="text-sm text-white/75">
                        This feature is in development. Leave your email and we will notify you when it becomes available.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 md:flex-row">
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={(event) => setNotifyEmail(event.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={submitFeatureWaitlist}
                          disabled={notifyStatus === "submitting" || !notifyEmail.includes("@")}
                          className="rounded-[10px] bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-60"
                        >
                          {notifyStatus === "submitting" ? "Sending..." : "Notify me"}
                        </button>
                      </div>
                      {notifyStatus === "success" && (
                        <p className="mt-3 text-sm text-[#C9A84C]">✓ You are on the list. We will be in touch.</p>
                      )}
                      {notifyStatus === "error" && (
                        <p className="mt-3 text-sm text-red-300">Could not save your request. Please try again.</p>
                      )}
                    </div>
                  )}
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
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`${step}-${wizardSubstep}`}
                custom={direction}
                variants={slideVariants}
                initial={reducedMotion ? false : "enter"}
                animate="center"
                exit={reducedMotion ? undefined : "exit"}
                className="relative overflow-hidden rounded-[24px] border border-[rgba(201,168,76,0.15)] bg-white/[0.03] px-5 py-6 md:px-9 md:py-10"
                style={reducedMotion ? { opacity: 1, transform: "translateX(0)" } : undefined}
              >
            <div className="absolute left-[10%] right-[10%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)]" />

            {step === 0 && wizardSubstep === "company" && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 1 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Company details</h2>
                <p className="text-sm text-white/50">Tell us where your company is registered so we can verify it correctly.</p>

                <div>
                  <label htmlFor="company-country" className={labelClass}>
                    Company country
                  </label>
                  <select
                    id="company-country"
                    value={companyCountry}
                    onChange={(e) => {
                      const v = e.target.value as CompanyCountry;
                      setCompanyCountry(v);
                      setCompanySuggestions([]);
                      if (v === "Sweden") {
                        setRegistryQuery("");
                      }
                    }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="Norway">Norway</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Sweden">Sweden</option>
                  </select>
                </div>

                {companyCountry === "Sweden" ? (
                  <>
                    <div ref={setFieldRef("employerCompany")}>
                      <label htmlFor="employer-company-se" className={labelClass}>
                        Company name
                      </label>
                      <input
                        id="employer-company-se"
                        className={`${inputClass} ${inputErrorClass("employerCompany")}`}
                        value={employerCompany}
                        onChange={(e) => {
                          setEmployerCompany(e.target.value);
                          clearFieldError("employerCompany");
                        }}
                        placeholder="Registered company name"
                        autoComplete="organization"
                      />
                      {fieldErrors.employerCompany ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                    </div>
                    <div ref={setFieldRef("employerOrgNumber")}>
                      <label htmlFor="employer-org-se" className={labelClass}>
                        Organisation number
                      </label>
                      <input
                        id="employer-org-se"
                        className={`${inputClass} ${inputErrorClass("employerOrgNumber")}`}
                        value={employerOrgNumber}
                        onChange={(e) => {
                          setEmployerOrgNumber(e.target.value);
                          clearFieldError("employerOrgNumber");
                        }}
                        placeholder="XXXXXX-XXXX"
                        inputMode="text"
                        autoComplete="off"
                      />
                      {fieldErrors.employerOrgNumber ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                      <p className="mt-2 text-xs leading-relaxed text-white/45">
                        Swedish company details verified manually by our team.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label htmlFor="registry-search" className={labelClass}>
                        {companyCountry === "Denmark" ? "Search CVR (company name)" : "Search Brønnøysund (company name)"}
                      </label>
                      <input
                        id="registry-search"
                        className={inputClass}
                        value={registryQuery}
                        onChange={(e) => setRegistryQuery(e.target.value)}
                        placeholder="Type at least 2 characters…"
                        autoComplete="organization"
                      />
                      {companySearchLoading ? (
                        <p className="mt-2 text-xs text-white/40">Searching…</p>
                      ) : null}
                    </div>
                    {companySuggestions.length > 0 ? (
                      <ul className="max-h-48 space-y-2 overflow-y-auto rounded-[12px] border border-white/10 bg-white/[0.04] p-2">
                        {companySuggestions.map((c) => (
                          <li key={`${c.orgNumber}-${c.name}`}>
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/10"
                              onClick={() => {
                                setEmployerCompany(c.name);
                                setEmployerOrgNumber(c.orgNumber);
                                setRegistryQuery(c.name);
                              }}
                            >
                              <span className="font-medium text-white">{c.name}</span>
                              <span className="mt-0.5 block text-xs text-white/45">Org.nr {c.orgNumber}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div ref={setFieldRef("employerCompany")}>
                      <label htmlFor="employer-company" className={labelClass}>
                        Company name
                      </label>
                      <input
                        id="employer-company"
                        className={`${inputClass} ${inputErrorClass("employerCompany")}`}
                        value={employerCompany}
                        onChange={(e) => {
                          setEmployerCompany(e.target.value);
                          clearFieldError("employerCompany");
                        }}
                        placeholder="As registered"
                        autoComplete="organization"
                      />
                      {fieldErrors.employerCompany ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                    </div>
                    <div ref={setFieldRef("employerOrgNumber")}>
                      <label htmlFor="employer-org" className={labelClass}>
                        Organisation number
                      </label>
                      <input
                        id="employer-org"
                        className={`${inputClass} ${inputErrorClass("employerOrgNumber")}`}
                        value={employerOrgNumber}
                        onChange={(e) => {
                          setEmployerOrgNumber(e.target.value);
                          clearFieldError("employerOrgNumber");
                        }}
                        placeholder={companyCountry === "Denmark" ? "8-digit CVR" : "9-digit org.nr"}
                        inputMode="numeric"
                        autoComplete="off"
                      />
                      {fieldErrors.employerOrgNumber ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                    </div>
                  </>
                )}
                <div ref={setFieldRef("phoneNumber")}>
                  <label htmlFor="employer-phone" className={labelClass}>
                    Phone
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phonePrefix}
                      onChange={(e) => setPhonePrefix(e.target.value as PhonePrefix)}
                      className="w-[96px] rounded-[12px] border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white focus:outline-none focus:border-[rgba(201,168,76,0.5)]"
                    >
                      <option value="+47">+47</option>
                      <option value="+46">+46</option>
                      <option value="+45">+45</option>
                    </select>
                    <input
                      id="employer-phone"
                      className={`${inputClass} ${inputErrorClass("phoneNumber")}`}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/[^\d]/g, ""));
                        clearFieldError("phoneNumber");
                      }}
                      placeholder="Phone number"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                  {fieldErrors.phoneNumber ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>
              </div>
            )}

            {step === 0 && wizardSubstep === "industry" && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 1 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Which industry is this request for?</h2>
                <p className="text-sm text-white/50">Select the primary industry first.</p>
                <div className="flex w-full flex-col gap-3">
                  <div ref={setFieldRef("industry")} className="contents">
                    <MobileCardPager
                      items={INDUSTRY_OPTIONS}
                      pageSize={4}
                      getKey={(option) => option}
                      desktopClassName="space-y-3"
                      mobileClassName="space-y-3 px-3"
                      dotsClassName="mt-3"
                      renderItem={(option) => (
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
                              driverLicenses: [],
                            }))
                          }
                        />
                      )}
                    />
                  </div>
                </div>
                {fieldErrors.industry ? <p className="text-xs text-red-500">This field is required</p> : null}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 2 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Worker type and requirements</h2>
                <p className="text-sm text-white/50">Worker roles and certifications depend on selected industry.</p>

                <div ref={setFieldRef("workerType")}>
                  <p className={labelClass}>Worker type</p>
                  <MobileCardPager
                    items={workerTypeOptions}
                    pageSize={4}
                    getKey={(option) => option}
                    desktopClassName="space-y-3"
                    mobileClassName="space-y-3 px-3"
                    dotsClassName="mt-3"
                    renderItem={(option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.workerType === option}
                        onClick={() => setForm((prev) => ({ ...prev, workerType: option, certification: [], driverLicenses: [] }))}
                      />
                    )}
                  />
                  {fieldErrors.workerType ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>

                {form.workerType === "Other" && (
                  <input
                    ref={setFieldRef("tradeOther")}
                    className={`${inputClass} ${inputErrorClass("tradeOther")}`}
                    placeholder="Describe the role"
                    value={form.tradeOther}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, tradeOther: e.target.value }));
                      clearFieldError("tradeOther");
                    }}
                  />
                )}
                {fieldErrors.tradeOther ? <p className="text-xs text-red-500">This field is required</p> : null}

                <div ref={setFieldRef("experience")}>
                  <p className={labelClass}>Minimum experience</p>
                  <div className="flex w-full flex-col gap-3">
                    {["No minimum", "1 to 2 years", "3 to 5 years", "5+ years"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.experience === option}
                        onClick={() => setForm((prev) => ({ ...prev, experience: option }))}
                      />
                    ))}
                  </div>
                  {fieldErrors.experience ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>

                <div>
                  <p className={labelClass}>Certifications required</p>
                  <MobileCardPager
                    items={certificationOptions}
                    pageSize={4}
                    getKey={(option) => option}
                    desktopClassName="space-y-3"
                    mobileClassName="space-y-3 px-3"
                    dotsClassName="mt-3"
                    renderItem={(option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.certification.includes(option)}
                        onClick={() => toggleCert(option)}
                      />
                    )}
                  />
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
                  <p className={labelClass}>Driving license required</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                    {NORWEGIAN_DRIVER_LICENSE_OPTIONS.map((license) => {
                      const checked = form.driverLicenses.includes(license);
                      return (
                        <label
                          key={license}
                          className={`relative flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition duration-200 ${
                            checked
                              ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#C9A84C] drop-shadow-[0_0_8px_rgba(201,168,76,0.3)]"
                              : "border-white/10 bg-white/[0.03] text-white/80 hover:scale-[1.01] hover:border-white/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDriverLicense(license)}
                            className="sr-only"
                          />
                          {checked ? (
                            <span className="absolute right-2 top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]">
                              <svg viewBox="0 0 20 20" className="h-[9px] w-[9px]" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M4 10l4 4 8-8" />
                              </svg>
                            </span>
                          ) : null}
                          <span>{license}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div ref={setFieldRef("dNumber")}>
                  <p className={labelClass}>D-number status</p>
                  <div className="flex w-full flex-col gap-3">
                    {["Already has a D-number", "We can handle the procedure"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.dNumber === option}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, dNumber: option }));
                          clearFieldError("dNumber");
                        }}
                      />
                    ))}
                  </div>
                  {fieldErrors.dNumber ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>

                <div ref={setFieldRef("rotationWeeksOn")}>
                  <label htmlFor="rotation-weeks-on" className={labelClass}>
                    Rotation
                  </label>
                  <select
                    id="rotation-weeks-on"
                    value={form.rotationWeeksOn}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, rotationWeeksOn: e.target.value }));
                      clearFieldError("rotationWeeksOn");
                    }}
                    className={`${inputClass} cursor-pointer`}
                  >
                    <option value="">Select rotation</option>
                    <option value="1 week">1 week</option>
                    <option value="2 weeks">2 weeks</option>
                    <option value="3 weeks">3 weeks</option>
                    <option value="4 weeks">4 weeks</option>
                    <option value="5 weeks">5 weeks</option>
                    <option value="6 weeks">6 weeks</option>
                    <option value="7 weeks">7 weeks</option>
                    <option value="8 weeks">8 weeks</option>
                  </select>
                  {fieldErrors.rotationWeeksOn ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
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
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 3 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">What are you offering?</h2>
                <p className="text-sm text-white/50">Help candidates understand the conditions.</p>

                <div ref={setFieldRef("contractType")}>
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
                  {fieldErrors.contractType ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>

                <div ref={setFieldRef("salary")}>
                  <p className={labelClass}>Salary</p>
                  <select
                    className={`${inputClass} ${inputErrorClass("salary")} cursor-pointer`}
                    value={form.salary}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, salary: e.target.value, salaryPeriod: "per hour" }));
                      clearFieldError("salary");
                    }}
                  >
                    <option value="">Select salary</option>
                    {SALARY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <a
                    href="https://www.arbeidstilsynet.no/arbeidsforhold/lonn/minstelonn/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-white/65 underline underline-offset-2 transition hover:text-white"
                  >
                    See minimum wages → arbeidstilsynet.no/minstelonn
                  </a>
                  {fieldErrors.salary ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
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

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 4 of ${TOTAL_STEPS}`}</p>
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

                <div ref={setFieldRef("locations")}>
                  <MobileCardPager
                    items={filteredCities}
                    pageSize={4}
                    getKey={(city) => city}
                    desktopClassName="max-h-[280px] space-y-2 overflow-y-auto pr-1"
                    mobileClassName="space-y-2 px-3"
                    dotsClassName="mt-3"
                    renderItem={(city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleLocation(city)}
                        className={`w-full min-h-[56px] rounded-[12px] border px-4 py-4 text-left text-sm transition ${
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
                    )}
                  />
                </div>
                {fieldErrors.locations ? <p className="text-xs text-red-500">This field is required</p> : null}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 5 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Final details</h2>
                <p className="text-sm text-white/50">Almost done. A few last questions.</p>

                <div ref={setFieldRef("accommodation")}>
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
                  {fieldErrors.accommodation ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>

                {form.accommodation === "Not provided" && (
                  <div ref={setFieldRef("accommodationSupport")}>
                    <p className={labelClass}>If not provided, can you help candidate find accommodation?</p>
                    <div className="flex flex-wrap gap-2">
                      {["We help find it", "Candidate handles it"].map(
                        (option) => (
                          <OptionCard
                            key={option}
                            label={option}
                            selected={form.accommodationSupport === option}
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                accommodationSupport: option,
                                accommodationCost: option === "We help find it" ? prev.accommodationCost : "",
                              }))
                            }
                          />
                        ),
                      )}
                    </div>
                    {fieldErrors.accommodationSupport ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                  </div>
                )}

                {form.accommodation === "Not provided" && form.accommodationSupport === "We help find it" && (
                  <div ref={setFieldRef("accommodationCost")}>
                    <label htmlFor="accommodation-cost" className={labelClass}>
                      Accommodation cost (NOK/month)
                    </label>
                    <input
                      id="accommodation-cost"
                      className={`${inputClass} ${inputErrorClass("accommodationCost")}`}
                      placeholder="e.g. 5000"
                      value={form.accommodationCost}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, accommodationCost: e.target.value }));
                        clearFieldError("accommodationCost");
                      }}
                    />
                    {fieldErrors.accommodationCost ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                  </div>
                )}

                <div ref={setFieldRef("internationalTransport")}>
                  <p className={labelClass}>International transport</p>
                  <div className="flex flex-wrap gap-2">
                    {["Covered by company", "Candidate's own responsibility"].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.internationalTransport === option}
                        onClick={() => setForm((prev) => ({ ...prev, internationalTransport: option }))}
                      />
                    ))}
                  </div>
                  {fieldErrors.internationalTransport ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
                </div>

                <div ref={setFieldRef("localTransport")}>
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
                  {fieldErrors.localTransport ? <p className="mt-1 text-xs text-red-500">This field is required</p> : null}
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

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 6 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">What is your hiring priority?</h2>
                <p className="text-sm text-white/50">We use this to prioritize delivery and response time.</p>
                <div ref={setFieldRef("urgency")} className="grid grid-cols-1 gap-3">
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
                {fieldErrors.urgency ? <p className="text-xs text-red-500">This field is required</p> : null}
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step 7 of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Would you like to add your company branding?</h2>
                <p className="text-sm text-white/50">Your company name and identity will be visible on the job post.</p>
                <div ref={setFieldRef("brandingChoice")} className="grid grid-cols-1 gap-3">
                  <OptionCard
                    label="Yes, add branding"
                    sublabel={
                      brandingPartnerRate
                        ? `${brandingPriceNok} NOK (verified partner rate)`
                        : `${brandingPriceNok} NOK (standard rate)`
                    }
                    selected={form.brandingChoice === "yes"}
                    onClick={() => setForm((prev) => ({ ...prev, brandingChoice: "yes" }))}
                  />
                  <OptionCard
                    label="No, post anonymously"
                    sublabel="Free. ArbeidMatch recruits discreetly without publishing your company name on the listing."
                    selected={form.brandingChoice === "no"}
                    onClick={() => setForm((prev) => ({ ...prev, brandingChoice: "no" }))}
                  />
                </div>
                {fieldErrors.brandingChoice ? <p className="text-xs text-red-500">This field is required</p> : null}
                <p className="rounded-[12px] border border-[rgba(201,168,76,0.35)] bg-[rgba(201,168,76,0.08)] px-4 py-3 text-center text-sm font-semibold text-[#C9A84C]">
                  {form.brandingChoice === "yes"
                    ? `Selected: ${brandingPriceNok} NOK`
                    : form.brandingChoice === "no"
                      ? "Selected: no branding fee"
                      : `Branding price if you choose yes: ${brandingPriceNok} NOK`}
                </p>
              </div>
            )}

            <div
              className={`mt-6 flex w-full items-center gap-3 border-t border-white/10 pt-5 pb-6 pr-6 ${
                step > 0 || (step === 0 && wizardSubstep === "industry") ? "justify-between" : "justify-end"
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
                ) : wizardSubstep === "industry" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDirection(-1);
                      setWizardSubstep("company");
                      scrollToTop();
                    }}
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
                    if (!applyStepValidation()) return;
                    setFieldErrors({});
                    void handleSubmit();
                  }
                }}
                disabled={animating || isSubmitting || !isStepValid(step)}
                className="ml-auto inline-flex min-w-[150px] items-center justify-center gap-2 rounded-[10px] bg-[#C9A84C] px-7 py-3 text-sm font-bold text-[#0f1923] transition-all duration-200 hover:scale-[1.02] hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-40"
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
              </motion.div>
            </AnimatePresence>
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
        @keyframes fadeMsg {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
