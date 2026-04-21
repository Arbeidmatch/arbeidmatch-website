"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  companyName: string;
  orgNumber: string;
  contactFirstName: string;
  contactLastName: string;
  roleInCompany: string;
  contactEmail: string;
  contactPhone: string;
  industry: string;
  workerType: string;
  trade: string;
  tradeOther: string;
  experience: string;
  certification: string[];
  certificationsOther: string;
  candidates: number;
  contractType: string;
  hiringType: string;
  jobSummary: string;
  salary: string;
  salaryPeriod: "per hour" | "per month";
  salaryMode: "Range" | "Fixed";
  overtime: string;
  accommodation: string;
  accommodationSupport: string;
  internationalTransport: string;
  localTransport: string;
  urgency: string;
  city: string;
  locations: string[];
  startDateMode: "Immediate" | "Specific start date";
  startDate: string;
  salaryMin: string;
  salaryMax: string;
  qualification: string;
  driverLicenseRequired: "Yes" | "No";
  tradeCertificatePreferred: "Yes" | "No";
  jaguarLandRoverPreferred: "Yes" | "No";
  customerCommunicationRequired: "Yes" | "No";
  diagnosticsExperienceRequired: "Yes" | "No";
  workTasks: string[];
  personalQualities: string[];
  offerItems: string[];
  additionalNotes: string;
  subscribeUpdates: boolean;
};

const TOTAL_STEPS = 8;

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
  companyName: "PEOPLE AS",
  orgNumber: "918882324",
  contactFirstName: "Arild",
  contactLastName: "Salomon",
  roleInCompany: "Contact person",
  contactEmail: "as@people.no",
  contactPhone: "+4793007732",
  industry: "Industry and Production",
  workerType: "mechanics for auto industry",
  trade: "",
  tradeOther: "",
  experience: "3 to 5 years",
  certification: [],
  certificationsOther: "",
  candidates: 2,
  contractType: "Permanent employment",
  hiringType: "Recruitment of personnel for companies",
  jobSummary: "General hiring inquiry",
  salary: "250-300",
  salaryPeriod: "per hour",
  salaryMode: "Range",
  overtime: "",
  accommodation: "Not provided",
  accommodationSupport: "Can help candidate find accommodation",
  internationalTransport: "Not covered",
  localTransport: "Not covered",
  urgency: "Specific start date",
  city: "Oslo",
  locations: ["Oslo"],
  startDateMode: "Specific start date",
  startDate: "",
  salaryMin: "250",
  salaryMax: "300",
  qualification: "3 to 5 years",
  driverLicenseRequired: "Yes",
  tradeCertificatePreferred: "Yes",
  jaguarLandRoverPreferred: "Yes",
  customerCommunicationRequired: "Yes",
  diagnosticsExperienceRequired: "Yes",
  workTasks: [
    "Service and repair",
    "Advanced diagnostics and electronics",
    "Documentation according to manufacturer requirements",
    "Customer handover and dialogue",
    "Maintain tidy and safe workshop",
  ],
  personalQualities: ["Accurate", "Quality-conscious", "Solution-oriented", "Independent", "Team player", "Service-minded", "Clear communicator"],
  offerItems: ["Brand-new workshop", "New equipment", "Competitive terms", "Professional development", "Training opportunities", "Small highly skilled team"],
  additionalNotes: "",
  subscribeUpdates: true,
};

const WORK_TASK_OPTIONS = [
  "Service and repair",
  "Advanced diagnostics and electronics",
  "Documentation according to manufacturer requirements",
  "Customer handover and dialogue",
  "Maintain tidy and safe workshop",
] as const;

const PERSONAL_QUALITY_OPTIONS = [
  "Accurate",
  "Quality-conscious",
  "Solution-oriented",
  "Independent",
  "Team player",
  "Service-minded",
  "Clear communicator",
] as const;

const OFFER_OPTIONS = [
  "Brand-new workshop",
  "New equipment",
  "Competitive terms",
  "Professional development",
  "Training opportunities",
  "Small highly skilled team",
] as const;

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

  const scrollToTop = () => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setForm((prev) => ({
      ...prev,
      companyName: tokenData.company?.trim() || prev.companyName,
      orgNumber: tokenData.org_number?.trim() || prev.orgNumber,
      contactEmail: tokenData.email?.trim().toLowerCase() || prev.contactEmail,
      contactPhone: tokenData.phone?.trim() || prev.contactPhone,
    }));
  }, [tokenData]);

  useEffect(() => {
    if (startWizard) {
      setShowChoice(false);
      setShowCheckFlow(false);
    }
  }, [startWizard]);

  const goTo = (next: number) => {
    if (next < 0 || next > TOTAL_STEPS - 1 || animating) return;
    if (next > step) {
      trackEvent("wizard_step_complete", { step: step + 1 });
    }
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

  const toggleItem = (field: "workTasks" | "personalQualities" | "offerItems", value: string) => {
    setForm((prev) => {
      const exists = prev[field].includes(value);
      return {
        ...prev,
        [field]: exists ? prev[field].filter((item) => item !== value) : [...prev[field], value],
      };
    });
  };

  const generatedNotes = useMemo(() => {
    const sections = [
      "About the Position",
      "The garage is relocating to Kaldbakken in August and establishing a brand-new, modern workshop.",
      "",
      "Work Tasks",
      ...form.workTasks.map((item) => `- ${item}`),
      "",
      "Requirements",
      `- Qualification: ${form.qualification}`,
      `- Driver license required: ${form.driverLicenseRequired}`,
      `- Trade certificate preferred: ${form.tradeCertificatePreferred}`,
      `- Jaguar or Land Rover experience preferred: ${form.jaguarLandRoverPreferred}`,
      `- Customer communication required: ${form.customerCommunicationRequired}`,
      `- Diagnostics and electronics experience required: ${form.diagnosticsExperienceRequired}`,
      "",
      "Personal Qualities",
      ...form.personalQualities.map((item) => `- ${item}`),
      "",
      "We Offer",
      ...form.offerItems.map((item) => `- ${item}`),
    ];
    if (form.additionalNotes.trim()) {
      sections.push("", "Additional Notes", form.additionalNotes.trim());
    }
    return sections.join("\n");
  }, [form.additionalNotes, form.diagnosticsExperienceRequired, form.driverLicenseRequired, form.jaguarLandRoverPreferred, form.offerItems, form.personalQualities, form.qualification, form.tradeCertificatePreferred, form.workTasks, form.customerCommunicationRequired]);

  const isStepValid = (value: number) => {
    if (value === 0) {
      return (
        form.companyName.trim().length >= 2 &&
        form.orgNumber.trim().length >= 9 &&
        form.contactFirstName.trim().length >= 1 &&
        form.contactLastName.trim().length >= 1 &&
        form.contactEmail.includes("@") &&
        form.contactPhone.trim().length >= 6
      );
    }
    if (value === 1) {
      return (
        !!form.industry &&
        !!form.workerType.trim() &&
        form.candidates >= 1 &&
        !!form.contractType &&
        form.locations.length > 0 &&
        (form.startDateMode === "Immediate" || form.startDate.trim().length > 0)
      );
    }
    if (value === 2) {
      return !!form.salaryMin.trim() && !!form.salaryMax.trim() && !!form.accommodation && !!form.localTransport && !!form.internationalTransport;
    }
    if (value === 3) return !!form.qualification;
    if (value === 4) return form.workTasks.length > 0;
    if (value === 5) return form.personalQualities.length > 0;
    if (value === 6) return form.offerItems.length > 0;
    if (value === 7) return true;
    return false;
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) goTo(step + 1);
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
      company: form.companyName.trim(),
      orgNumber: form.orgNumber.trim(),
      email: form.contactEmail.trim().toLowerCase(),
      full_name: `${form.contactFirstName.trim()} ${form.contactLastName.trim()}`.trim(),
      phonePrefix: "",
      phoneNumber: "",
      phone: form.contactPhone.trim(),
      job_summary: form.jobSummary,
      hiringType: form.hiringType,
      category: form.industry,
      position: form.workerType.trim(),
      positionOther: "",
      numberOfPositions: String(form.candidates),
      qualification: form.qualification,
      certifications: [
        `Role in company: ${form.roleInCompany.trim() || "Contact person"}`,
        `Trade certificate preferred: ${form.tradeCertificatePreferred}`,
        `Jaguar or Land Rover preferred: ${form.jaguarLandRoverPreferred}`,
      ].join(", "),
      certificationsOther: form.certification.includes("Other") ? form.certificationsOther.trim() : "",
      experience: "",
      norwegianLevel: "",
      englishLevel: "",
      driverLicense: form.driverLicenseRequired,
      driverLicenseOther: "",
      dNumber: "",
      dNumberOther: "",
      requirements: generatedNotes,
      contractType: form.contractType,
      salaryPeriod: form.salaryPeriod === "per hour" ? "Per hour" : "Per month",
      salaryMode: form.salaryMode,
      salary: `${form.salaryMin.trim()}-${form.salaryMax.trim()}`,
      salaryAmount: "",
      salaryFrom: form.salaryMin.trim(),
      salaryTo: form.salaryMax.trim(),
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
      internationalTravel: form.internationalTransport ?? "",
      localTravel: form.localTransport ?? "",
      localTravelOther: "",
      accommodation: form.accommodation ?? "",
      accommodationCost: "",
      accommodationOther: form.accommodationSupport,
      equipment: "",
      equipmentOther: "",
      tools: "",
      toolsOther: "",
      city: form.locations.join(", "),
      startDate: form.startDateMode === "Immediate" ? "Immediate" : form.startDate,
      startDateOther: "",
      howDidYouHear: "",
      socialMediaPlatform: "",
      socialMediaOther: "",
      howDidYouHearOther: "",
      referralCompanyName: "",
      referralOrgNumber: "",
      referralEmail: "",
      subscribe: form.subscribeUpdates ? "Yes - send me candidate updates" : "",
      notes: generatedNotes,
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
          <input type="hidden" value={token} name="token" />
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
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 1 of 8</p>
                <h2 className="text-2xl font-extrabold">Company and contact</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input className={inputClass} value={form.companyName} onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="Company name" />
                  <input className={inputClass} value={form.orgNumber} onChange={(e) => setForm((p) => ({ ...p, orgNumber: e.target.value }))} placeholder="Org number" />
                  <input className={inputClass} value={form.contactFirstName} onChange={(e) => setForm((p) => ({ ...p, contactFirstName: e.target.value }))} placeholder="First name" />
                  <input className={inputClass} value={form.contactLastName} onChange={(e) => setForm((p) => ({ ...p, contactLastName: e.target.value }))} placeholder="Last name" />
                  <input className={inputClass} value={form.roleInCompany} onChange={(e) => setForm((p) => ({ ...p, roleInCompany: e.target.value }))} placeholder="Role in company" />
                  <input className={inputClass} value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="Phone" />
                  <input className={`${inputClass} md:col-span-2`} type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} placeholder="Email" />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 2 of 8</p>
                <h2 className="text-2xl font-extrabold">Job basics</h2>
                <div>
                  <p className={labelClass}>Job category</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {INDUSTRY_OPTIONS.map((option) => (
                      <OptionCard key={option} label={option} selected={form.industry === option} onClick={() => setForm((p) => ({ ...p, industry: option }))} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Hiring type</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["Recruitment of personnel for companies", "Temporary staffing request"].map((option) => (
                      <OptionCard key={option} label={option} selected={form.hiringType === option} onClick={() => setForm((p) => ({ ...p, hiringType: option }))} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Job summary</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["General hiring inquiry", "Urgent replacement need", "Planned team expansion", "Project-specific hiring"].map((option) => (
                      <OptionCard key={option} label={option} selected={form.jobSummary === option} onClick={() => setForm((p) => ({ ...p, jobSummary: option }))} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Trade or position</p>
                  <input className={inputClass} value={form.workerType} onChange={(e) => setForm((p) => ({ ...p, workerType: e.target.value }))} placeholder="mechanics for auto industry" />
                </div>
                <div>
                  <p className={labelClass}>Location</p>
                  <input className={inputClass} value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search city" />
                  <div className="mt-2 flex max-h-[150px] flex-wrap gap-2 overflow-auto">
                    {filteredCities.slice(0, 10).map((city) => (
                      <button key={city} type="button" onClick={() => toggleLocation(city)} className={`rounded-full border px-3 py-1 text-xs ${form.locations.includes(city) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className={labelClass}>Number of workers</p>
                    <div className="flex items-center gap-3">
                      <button type="button" className="h-9 w-9 rounded-lg border border-[#C9A84C] text-[#C9A84C]" onClick={() => setForm((p) => ({ ...p, candidates: Math.max(1, p.candidates - 1) }))}>-</button>
                      <span className="min-w-12 text-center text-2xl font-bold">{form.candidates}</span>
                      <button type="button" className="h-9 w-9 rounded-lg border border-[#C9A84C] text-[#C9A84C]" onClick={() => setForm((p) => ({ ...p, candidates: p.candidates + 1 }))}>+</button>
                    </div>
                  </div>
                  <div>
                    <p className={labelClass}>Contract type</p>
                    <div className="space-y-2">
                      {["Permanent employment", "Temporary hire", "Project-based"].map((option) => (
                        <OptionCard key={option} label={option} selected={form.contractType === option} onClick={() => setForm((p) => ({ ...p, contractType: option }))} />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Start date</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(["Immediate", "Specific start date"] as const).map((mode) => (
                      <button key={mode} type="button" className={`rounded-lg border px-4 py-2 text-sm ${form.startDateMode === mode ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`} onClick={() => setForm((p) => ({ ...p, startDateMode: mode }))}>
                        {mode}
                      </button>
                    ))}
                  </div>
                  {form.startDateMode === "Specific start date" ? (
                    <input type="date" className={inputClass} value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} />
                  ) : null}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 3 of 8</p>
                <h2 className="text-2xl font-extrabold">Salary and conditions</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className={labelClass}>Salary mode</p>
                    <div className="flex gap-2">
                      {(["Range", "Fixed"] as const).map((mode) => (
                        <button key={mode} type="button" className={`rounded-lg border px-4 py-2 text-sm ${form.salaryMode === mode ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`} onClick={() => setForm((p) => ({ ...p, salaryMode: mode }))}>
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={labelClass}>Salary period</p>
                    <div className="flex gap-2">
                      {(["per hour", "per month"] as const).map((period) => (
                        <button key={period} type="button" className={`rounded-lg border px-4 py-2 text-sm ${form.salaryPeriod === period ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`} onClick={() => setForm((p) => ({ ...p, salaryPeriod: period }))}>
                          {period === "per hour" ? "Per hour" : "Per month"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} value={form.salaryMin} onChange={(e) => setForm((p) => ({ ...p, salaryMin: e.target.value }))} placeholder="Salary min" />
                  <input className={inputClass} value={form.salaryMax} onChange={(e) => setForm((p) => ({ ...p, salaryMax: e.target.value }))} placeholder="Salary max" />
                </div>
                <div>
                  <p className={labelClass}>Accommodation</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["Provided", "Not provided"].map((option) => (
                      <OptionCard key={option} label={option} selected={form.accommodation === option} onClick={() => setForm((p) => ({ ...p, accommodation: option }))} />
                    ))}
                  </div>
                </div>
                {form.accommodation === "Not provided" ? (
                  <input className={inputClass} value={form.accommodationSupport} onChange={(e) => setForm((p) => ({ ...p, accommodationSupport: e.target.value }))} placeholder="Accommodation helper note" />
                ) : null}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className={labelClass}>Local travel</p>
                    <div className="flex gap-2">
                      {["Covered", "Not covered"].map((opt) => (
                        <button key={opt} type="button" className={`rounded-lg border px-4 py-2 text-sm ${form.localTransport === opt ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`} onClick={() => setForm((p) => ({ ...p, localTransport: opt }))}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={labelClass}>International travel</p>
                    <div className="flex gap-2">
                      {["Covered", "Not covered"].map((opt) => (
                        <button key={opt} type="button" className={`rounded-lg border px-4 py-2 text-sm ${form.internationalTransport === opt ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`} onClick={() => setForm((p) => ({ ...p, internationalTransport: opt }))}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-[rgba(201,168,76,0.2)] px-4 py-3">
                  <p className="text-sm text-white/80">Subscribe to candidate updates</p>
                  <button type="button" className={`h-7 w-12 rounded-full p-1 ${form.subscribeUpdates ? "bg-[#C9A84C]" : "bg-white/20"}`} onClick={() => setForm((p) => ({ ...p, subscribeUpdates: !p.subscribeUpdates }))}>
                    <span className={`block h-5 w-5 rounded-full bg-white transition ${form.subscribeUpdates ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 4 of 8</p>
                <h2 className="text-2xl font-extrabold">Requirements</h2>
                <div>
                  <p className={labelClass}>Qualification</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["No minimum", "1 to 2 years", "3 to 5 years", "5+ years"].map((opt) => (
                      <OptionCard key={opt} label={opt} selected={form.qualification === opt} onClick={() => setForm((p) => ({ ...p, qualification: opt }))} />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    { label: "Driver license required", key: "driverLicenseRequired" as const },
                    { label: "Trade certificate preferred", key: "tradeCertificatePreferred" as const },
                    { label: "Jaguar or Land Rover preferred", key: "jaguarLandRoverPreferred" as const },
                    { label: "Customer communication required", key: "customerCommunicationRequired" as const },
                    { label: "Diagnostics and electronics required", key: "diagnosticsExperienceRequired" as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <p className={labelClass}>{label}</p>
                      <div className="flex gap-2">
                        {(["Yes", "No"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`rounded-lg border px-4 py-2 text-sm ${
                              form[key] === value
                                ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]"
                                : "border-white/20 text-white/60"
                            }`}
                            onClick={() => setForm((p) => ({ ...p, [key]: value }))}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 5 of 8</p>
                <h2 className="text-2xl font-extrabold">Work tasks</h2>
                <div className="flex flex-wrap gap-2">
                  {WORK_TASK_OPTIONS.map((task) => (
                    <button key={task} type="button" onClick={() => toggleItem("workTasks", task)} className={`rounded-full border px-4 py-2 text-sm ${form.workTasks.includes(task) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}>
                      {task}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 6 of 8</p>
                <h2 className="text-2xl font-extrabold">Personal qualities</h2>
                <div className="flex flex-wrap gap-2">
                  {PERSONAL_QUALITY_OPTIONS.map((item) => (
                    <button key={item} type="button" onClick={() => toggleItem("personalQualities", item)} className={`rounded-full border px-4 py-2 text-sm ${form.personalQualities.includes(item) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 7 of 8</p>
                <h2 className="text-2xl font-extrabold">We offer</h2>
                <div className="flex flex-wrap gap-2">
                  {OFFER_OPTIONS.map((item) => (
                    <button key={item} type="button" onClick={() => toggleItem("offerItems", item)} className={`rounded-full border px-4 py-2 text-sm ${form.offerItems.includes(item) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">Step 8 of 8</p>
                <h2 className="text-2xl font-extrabold">Final notes preview</h2>
                <div className="rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-4">
                  <pre className="whitespace-pre-wrap text-sm text-white/75">{generatedNotes}</pre>
                </div>
                <div>
                  <p className={labelClass}>Additional notes (optional)</p>
                  <textarea rows={4} className={`${inputClass} resize-none`} value={form.additionalNotes} onChange={(e) => setForm((p) => ({ ...p, additionalNotes: e.target.value }))} />
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
