"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Bolt,
  Briefcase,
  Factory,
  HardHat,
  HeartPulse,
  LucideIcon,
  Ship,
  Sparkles,
  Star,
  Truck,
  Wrench,
  X,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { REQUEST_INDUSTRY_ROLE_GROUPS } from "@/lib/industry-roles";

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
  /** E.164 country prefix, without local digits */
  contactPhonePrefix: string;
  /** Local number, digits only, max 15 */
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
  /** NOK or free text; only used when accommodation is we-help option */
  accommodationCost: string;
  /** Stored as employer_requests.international_travel text: company_covered | own_responsibility */
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
  /** Stored as employer_requests.d_number: has_d_number | we_handle */
  dNumberChoice: "has_d_number" | "we_handle" | "";
  /** Norwegian licence classes (multi) or "No driving license required" (exclusive) */
  driverLicenseSelections: string[];
  tradeCertificatePreferred: "Yes" | "No";
  jaguarLandRoverPreferred: "Yes" | "No";
  customerCommunicationRequired: "Yes" | "No";
  diagnosticsExperienceRequired: "Yes" | "No";
  workTasks: string[];
  personalQualities: string[];
  offerItems: string[];
  additionalNotes: string;
  subscribeUpdates: boolean;
  /** Exact label from rotation dropdown; also appended to requirements on submit */
  rotationSchedule: string;
  howDidYouHear: string;
  socialMediaPlatform: string;
  socialMediaOther: string;
  howDidYouHearOther: string;
  referralCompanyName: string;
  referralEmail: string;
};

const ACCOMMODATION_WE_HELP = "We help find accommodation";
const ACCOMMODATION_CANDIDATE_OWN = "Candidate finds own";

const ROTATION_SCHEDULE_OPTIONS = [
  "No rotation / Standard schedule",
  "1 week on / 1 week off",
  "2 weeks on / 2 weeks off",
  "3 weeks on / 3 weeks off",
  "4 weeks on / 4 weeks off",
  "5 weeks on / 5 weeks off",
  "6 weeks on / 6 weeks off",
  "7 weeks on / 7 weeks off",
  "8 weeks on / 8 weeks off",
] as const;

function rotationScheduleToPayloadFields(schedule: string): {
  hasRotation: string;
  rotationWeeksOn: string;
  rotationWeeksOff: string;
} {
  if (schedule === "No rotation / Standard schedule") {
    return { hasRotation: "No", rotationWeeksOn: "", rotationWeeksOff: "" };
  }
  for (let n = 1; n <= 8; n += 1) {
    const label = n === 1 ? "1 week on / 1 week off" : `${n} weeks on / ${n} weeks off`;
    if (schedule === label) {
      return { hasRotation: "Yes", rotationWeeksOn: String(n), rotationWeeksOff: String(n) };
    }
  }
  return { hasRotation: "No", rotationWeeksOn: "", rotationWeeksOff: "" };
}

const PHONE_PREFIX_OPTIONS = [
  { value: "+47", label: "+47 (NO)" },
  { value: "+46", label: "+46 (SE)" },
  { value: "+45", label: "+45 (DK)" },
] as const;

const HOW_DID_YOU_HEAR_OPTIONS = [
  "Referral from another company",
  "Google search",
  "LinkedIn",
  "Social media",
  "Industry event or conference",
  "Other",
] as const;

const NO_DRIVING_LICENSE_REQUIRED = "No driving license required";

const NORWEGIAN_DRIVING_LICENSE_CLASSES = [
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

function formatDriverLicenseForPayload(selections: string[]): string {
  if (selections.includes(NO_DRIVING_LICENSE_REQUIRED)) return NO_DRIVING_LICENSE_REQUIRED;
  return selections.join(", ");
}

const WIZARD_STEP_FIELD_KEYS: Record<number, readonly string[]> = {
  0: [
    "companyName",
    "orgNumber",
    "contactFirstName",
    "contactLastName",
    "contactEmail",
    "contactPhone",
    "howDidYouHear",
    "referralCompanyName",
    "referralEmail",
  ],
  1: ["industry", "workerType", "contractType", "locations", "startDate", "candidates"],
  2: ["salaryMin", "salaryMax", "accommodation", "localTransport", "internationalTransport"],
  3: ["qualification", "dNumberChoice"],
  4: ["workTasks"],
  5: ["personalQualities"],
  6: ["offerItems"],
  7: [],
  8: [],
};

function collectWizardStepInvalid(s: number, f: RequestForm): Set<string> {
  const invalid = new Set<string>();
  if (s === 0) {
    if (f.companyName.trim().length < 2) invalid.add("companyName");
    if (f.orgNumber.trim().length < 9) invalid.add("orgNumber");
    if (f.contactFirstName.trim().length < 1) invalid.add("contactFirstName");
    if (f.contactLastName.trim().length < 1) invalid.add("contactLastName");
    if (!f.contactEmail.includes("@")) invalid.add("contactEmail");
    if (f.contactPhone.replace(/\D/g, "").length < 6) invalid.add("contactPhone");
    if (!f.howDidYouHear.trim()) invalid.add("howDidYouHear");
    if (f.howDidYouHear === "Referral from another company") {
      if (f.referralCompanyName.trim().length < 2) invalid.add("referralCompanyName");
      const refEmail = f.referralEmail.trim();
      if (refEmail.length > 0 && !refEmail.includes("@")) invalid.add("referralEmail");
    }
  } else if (s === 1) {
    if (!f.industry) invalid.add("industry");
    if (!f.workerType.trim()) invalid.add("workerType");
    if (f.candidates < 1) invalid.add("candidates");
    if (!f.contractType) invalid.add("contractType");
    if (f.locations.length === 0) invalid.add("locations");
    if (f.startDateMode === "Specific start date" && !f.startDate.trim()) invalid.add("startDate");
  } else if (s === 2) {
    if (!f.salaryMin.trim()) invalid.add("salaryMin");
    if (!f.salaryMax.trim()) invalid.add("salaryMax");
    if (f.accommodation !== ACCOMMODATION_WE_HELP && f.accommodation !== ACCOMMODATION_CANDIDATE_OWN) {
      invalid.add("accommodation");
    }
    if (!f.localTransport) invalid.add("localTransport");
    if (f.internationalTransport !== "company_covered" && f.internationalTransport !== "own_responsibility") {
      invalid.add("internationalTransport");
    }
  } else if (s === 3) {
    if (!f.qualification) invalid.add("qualification");
    if (f.dNumberChoice !== "has_d_number" && f.dNumberChoice !== "we_handle") invalid.add("dNumberChoice");
  } else if (s === 4) {
    if (f.workTasks.length === 0) invalid.add("workTasks");
  } else if (s === 5) {
    if (f.personalQualities.length === 0) invalid.add("personalQualities");
  } else if (s === 6) {
    if (f.offerItems.length === 0) invalid.add("offerItems");
  }
  return invalid;
}

const TOTAL_STEPS = 9;

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
  contactPhonePrefix: "+47",
  contactPhone: "93007732",
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
  accommodation: ACCOMMODATION_CANDIDATE_OWN,
  accommodationCost: "",
  internationalTransport: "own_responsibility",
  localTransport: "Not covered",
  urgency: "Specific start date",
  city: "Oslo",
  locations: ["Oslo"],
  startDateMode: "Specific start date",
  startDate: "",
  salaryMin: "250",
  salaryMax: "300",
  qualification: "3 to 5 years",
  dNumberChoice: "has_d_number",
  driverLicenseSelections: [],
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
  rotationSchedule: ROTATION_SCHEDULE_OPTIONS[0],
  howDidYouHear: "",
  socialMediaPlatform: "",
  socialMediaOther: "",
  howDidYouHearOther: "",
  referralCompanyName: "",
  referralEmail: "",
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
const FIELD_ERROR_MSG = "This field is required";
const fieldErrorTextClass = "mt-1 text-[12px] text-[#ef4444]";

function wizardInputClass(invalid: boolean, extraClass = "") {
  return [
    "w-full min-h-[44px] rounded-[12px] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/30",
    "focus:outline-none focus:border-2 focus:border-[#C9A84C]",
    invalid ? "border-2 border-[#ef4444]" : "border border-white/10",
    extraClass,
  ]
    .filter(Boolean)
    .join(" ");
}

function wizardGroupShell(invalid: boolean, extraClass = "") {
  if (!invalid) return extraClass || "";
  return ["rounded-[12px] border-2 border-[#ef4444] p-2", extraClass].filter(Boolean).join(" ");
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Construction & Civil": HardHat,
  "Electrical & Technical": Bolt,
  "Logistics & Transport": Truck,
  "Industry & Production": Factory,
  "Cleaning & Facility": Sparkles,
  "Hospitality & Healthcare": HeartPulse,
  "Automotive & Mechanics": Wrench,
  "Offshore & Onshore": Ship,
  "Other / General Labour": Briefcase,
};

const CHECK_ROLE_GROUPS: Array<{ industry: string; icon: LucideIcon; roles: string[] }> = REQUEST_INDUSTRY_ROLE_GROUPS.map(
  ({ industry, roles }) => ({
    industry,
    icon: INDUSTRY_ICONS[industry]!,
    roles: [...roles],
  }),
);

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
      className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-[12px] border px-4 py-3 text-left transition-all duration-180 focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${
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

export default function RequestTokenPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  /** Default wizard for /request/[token] links (e.g. from simple-request). Only ?start=choice opens the entry cards first. */
  const startWizard = searchParams.get("start") !== "choice";
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
  const [submitSuccessFullName, setSubmitSuccessFullName] = useState("");
  const [submitSuccessReference, setSubmitSuccessReference] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<RequestForm>(initialForm);
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
        // IMPORTANT: Do not pre-fill form fields with data from tokenData or any DB source.
        // Forms must always start empty. Users must enter their own data.
        setTokenGate("ready");
      })
      .catch(() => {
        setTokenGate("error");
      });
  }, [token]);

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
    }, 250);
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
    setFieldErrors((prev) => {
      if (!prev.locations) return prev;
      const next = { ...prev };
      delete next.locations;
      return next;
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
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const toggleDriverLicenseChip = (value: string) => {
    setForm((prev) => {
      if (value === NO_DRIVING_LICENSE_REQUIRED) {
        if (prev.driverLicenseSelections.includes(NO_DRIVING_LICENSE_REQUIRED)) {
          return { ...prev, driverLicenseSelections: [] };
        }
        return { ...prev, driverLicenseSelections: [NO_DRIVING_LICENSE_REQUIRED] };
      }
      const withoutNo = prev.driverLicenseSelections.filter((item) => item !== NO_DRIVING_LICENSE_REQUIRED);
      const exists = withoutNo.includes(value);
      return {
        ...prev,
        driverLicenseSelections: exists ? withoutNo.filter((item) => item !== value) : [...withoutNo, value],
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
      `- Driver license: ${
        form.driverLicenseSelections.length === 0
          ? "Not specified"
          : formatDriverLicenseForPayload(form.driverLicenseSelections)
      }`,
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
  }, [
    form.additionalNotes,
    form.diagnosticsExperienceRequired,
    form.driverLicenseSelections,
    form.jaguarLandRoverPreferred,
    form.offerItems,
    form.personalQualities,
    form.qualification,
    form.tradeCertificatePreferred,
    form.workTasks,
    form.customerCommunicationRequired,
  ]);

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const runStepValidation = (s: number) => {
    const invalid = collectWizardStepInvalid(s, form);
    const keys = WIZARD_STEP_FIELD_KEYS[s] ?? [];
    setFieldErrors((prev) => {
      const next = { ...prev };
      for (const k of keys) delete next[k];
      for (const k of invalid) next[k] = true;
      return next;
    });
    if (invalid.size > 0 && typeof document !== "undefined") {
      requestAnimationFrame(() => {
        const first = invalid.values().next().value as string | undefined;
        if (first) {
          document.querySelector(`[data-wizard-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
    return invalid.size === 0;
  };

  const handleFormContinue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (animating || isSubmitting) return;
    if (!runStepValidation(step)) return;
    if (step < TOTAL_STEPS - 1) {
      handleNext();
      return;
    }
    await performEmployerSubmit();
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) goTo(step + 1);
  };

  const performEmployerSubmit = async () => {
    trackEvent("wizard_submitted");
    setSubmitError("");
    setSubmitNotice("");
    setSubmitStatus("idle");
    setIsSubmitting(true);

    const rotationPayload = rotationScheduleToPayloadFields(form.rotationSchedule);

    const payload = {
      token,
      company: form.companyName.trim(),
      orgNumber: form.orgNumber.trim(),
      email: form.contactEmail.trim().toLowerCase(),
      full_name: `${form.contactFirstName.trim()} ${form.contactLastName.trim()}`.trim(),
      phonePrefix: form.contactPhonePrefix,
      phoneNumber: form.contactPhone.replace(/\D/g, "").slice(0, 15),
      phone: (() => {
        const digits = form.contactPhone.replace(/\D/g, "").slice(0, 15);
        return digits.length >= 6 ? `${form.contactPhonePrefix} ${digits}` : "";
      })(),
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
      driverLicense: formatDriverLicenseForPayload(form.driverLicenseSelections),
      driverLicenseOther: "",
      dNumber: form.dNumberChoice,
      dNumberOther: "",
      requirements: `${generatedNotes}\n\nRotation schedule: ${form.rotationSchedule}`.trim(),
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
      hasRotation: rotationPayload.hasRotation,
      rotationWeeksOn: rotationPayload.rotationWeeksOn,
      rotationWeeksOff: rotationPayload.rotationWeeksOff,
      internationalTravel: form.internationalTransport ?? "",
      localTravel: form.localTransport ?? "",
      localTravelOther: "",
      accommodation: form.accommodation ?? "",
      accommodationCost: form.accommodation === ACCOMMODATION_WE_HELP ? form.accommodationCost.trim() : "",
      accommodationOther: "",
      equipment: "",
      equipmentOther: "",
      tools: "",
      toolsOther: "",
      city: form.locations.join(", "),
      startDate: form.startDateMode === "Immediate" ? "Immediate" : form.startDate,
      startDateOther: "",
      howDidYouHear: form.howDidYouHear.trim(),
      socialMediaPlatform: form.howDidYouHear === "Social media" ? form.socialMediaPlatform : "",
      socialMediaOther: "",
      howDidYouHearOther: form.howDidYouHear === "Other" ? form.howDidYouHearOther : "",
      referralCompanyName:
        form.howDidYouHear === "Referral from another company" ? form.referralCompanyName.trim() : "",
      referralOrgNumber: "",
      referralEmail:
        form.howDidYouHear === "Referral from another company"
          ? form.referralEmail.trim().toLowerCase()
          : "",
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
      const saveData = (await saveRes.json()) as { success?: boolean; referenceId?: string };
      if (saveData.success !== true) throw new Error("save-employer-request");
      setSubmitSuccessFullName(payload.full_name.trim());
      setSubmitSuccessReference(
        typeof saveData.referenceId === "string" && saveData.referenceId.trim().length > 0
          ? saveData.referenceId.trim()
          : "",
      );

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
    const displayName = submitSuccessFullName.trim();
    const successAnimationStyle = reducedMotion
      ? undefined
      : ({ animation: "successFadeIn 0.4s ease forwards", opacity: 0 } as const);

    return (
      <section className="min-h-screen bg-[#0D1B2A] px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-lg flex-col items-center justify-center text-center">
          <div className="w-full space-y-4" style={successAnimationStyle}>
            <div className="mx-auto h-[2px] w-[48px] bg-[#C9A84C]" />
            <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-white sm:text-[2rem]">
              {displayName ? `Thank you, ${displayName}!` : "Thank you!"}
            </h1>
            <p className="text-base text-[rgba(255,255,255,0.82)]">
              We will review your request and be in touch soon.
            </p>
            {submitSuccessReference ? (
              <p className="text-sm font-medium text-[#C9A84C]">Your reference: {submitSuccessReference}</p>
            ) : null}
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              We typically respond within 1-2 business days.
            </p>
            {submitNotice ? <p className="text-xs text-amber-300">{submitNotice}</p> : null}
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex min-h-[40px] items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] px-5 py-2 text-sm font-semibold text-[#C9A84C] transition-colors hover:border-[#C9A84C] hover:bg-[rgba(201,168,76,0.08)]"
              >
                Back to homepage
              </Link>
            </div>
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
      <header className="fixed inset-x-0 top-0 z-30 flex flex-col bg-[rgba(10,15,24,0.95)] backdrop-blur-[12px]">
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4 md:h-16 md:px-6">
          <p className="text-base font-bold">
            <span className="text-[#C9A84C]">Arbeid</span>Match
          </p>
          <p className="text-right text-[11px] font-semibold tabular-nums text-white/80">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
        </div>
        <div className="relative h-[3px] w-full shrink-0 bg-[rgba(255,255,255,0.12)]" aria-hidden>
          <div
            className={`absolute left-0 top-0 h-full bg-[#C9A84C] ease-out ${reducedMotion ? "transition-none" : "transition-[width] duration-300"}`}
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex min-h-dvh items-center justify-center px-4 pt-[84px] md:px-6 md:pt-[92px]">
        <form onSubmit={handleFormContinue} className="w-full max-w-[560px]">
          <input type="hidden" value={token} name="token" />
          <div
            key={step}
            className={`relative overflow-hidden rounded-[24px] border border-[rgba(201,168,76,0.15)] bg-white/[0.03] px-5 py-6 md:px-9 md:py-10 ${
              animating ? "card-exit" : "card-enter"
            }`}
            style={reducedMotion ? { opacity: 1, transform: "translateY(0)" } : undefined}
          >
            <div className="absolute left-[10%] right-[10%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)]" />

            {step === 0 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Company and contact</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div data-wizard-field="companyName">
                    <input
                      className={wizardInputClass(!!fieldErrors.companyName)}
                      value={form.companyName}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, companyName: e.target.value }));
                        clearFieldError("companyName");
                      }}
                      placeholder="Company name"
                    />
                    {fieldErrors.companyName ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div data-wizard-field="orgNumber">
                    <input
                      className={wizardInputClass(!!fieldErrors.orgNumber)}
                      value={form.orgNumber}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, orgNumber: e.target.value }));
                        clearFieldError("orgNumber");
                      }}
                      placeholder="Org number"
                    />
                    {fieldErrors.orgNumber ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div data-wizard-field="contactFirstName">
                    <input
                      className={wizardInputClass(!!fieldErrors.contactFirstName)}
                      value={form.contactFirstName}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, contactFirstName: e.target.value }));
                        clearFieldError("contactFirstName");
                      }}
                      placeholder="First name"
                    />
                    {fieldErrors.contactFirstName ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div data-wizard-field="contactLastName">
                    <input
                      className={wizardInputClass(!!fieldErrors.contactLastName)}
                      value={form.contactLastName}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, contactLastName: e.target.value }));
                        clearFieldError("contactLastName");
                      }}
                      placeholder="Last name"
                    />
                    {fieldErrors.contactLastName ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div>
                    <input
                      className={wizardInputClass(false)}
                      value={form.roleInCompany}
                      onChange={(e) => setForm((p) => ({ ...p, roleInCompany: e.target.value }))}
                      placeholder="Role in company (optional)"
                    />
                  </div>
                  <div data-wizard-field="contactPhone">
                    <div
                      className={wizardGroupShell(
                        !!fieldErrors.contactPhone,
                        "flex flex-row flex-nowrap items-stretch gap-2",
                      )}
                    >
                      <select
                        aria-label="Phone country code"
                        value={form.contactPhonePrefix}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, contactPhonePrefix: e.target.value }));
                          clearFieldError("contactPhone");
                        }}
                        className="shrink-0 rounded-[12px] border border-white/10 bg-white/[0.05] px-2 py-3 text-sm text-white focus:outline-none focus:border-2 focus:border-[#C9A84C] w-[min(118px,32vw)] min-h-[44px] max-w-[120px]"
                      >
                        {PHONE_PREFIX_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#0D1B2A] text-white">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        className={`min-w-0 flex-1 ${wizardInputClass(false)}`}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={15}
                        value={form.contactPhone}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                          setForm((p) => ({ ...p, contactPhone: digits }));
                          clearFieldError("contactPhone");
                        }}
                        placeholder="Phone"
                      />
                    </div>
                    {fieldErrors.contactPhone ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div className="md:col-span-2" data-wizard-field="contactEmail">
                    <input
                      className={wizardInputClass(!!fieldErrors.contactEmail, "md:col-span-2")}
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, contactEmail: e.target.value }));
                        clearFieldError("contactEmail");
                      }}
                      placeholder="Email"
                    />
                    {fieldErrors.contactEmail ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                </div>
                <div className="space-y-3 border-t border-white/10 pt-5">
                  <div>
                    <p className={labelClass}>How did you hear about us</p>
                    <div
                      data-wizard-field="howDidYouHear"
                      className={wizardGroupShell(!!fieldErrors.howDidYouHear, "mt-2 flex flex-col gap-2")}
                    >
                      {HOW_DID_YOU_HEAR_OPTIONS.map((option) => (
                        <div key={option} className="flex flex-col gap-2">
                          <OptionCard
                            label={option}
                            selected={form.howDidYouHear === option}
                            onClick={() => {
                              setForm((p) => ({
                                ...p,
                                howDidYouHear: option,
                                ...(option === "Referral from another company"
                                  ? {}
                                  : {
                                      referralCompanyName: "",
                                      referralEmail: "",
                                    }),
                              }));
                              clearFieldError("howDidYouHear");
                              clearFieldError("referralCompanyName");
                              clearFieldError("referralEmail");
                            }}
                          />
                          {option === "Referral from another company" ? (
                            <div
                              className="overflow-hidden"
                              style={{
                                maxHeight:
                                  form.howDidYouHear === "Referral from another company" ? "18rem" : "0px",
                                transition: reducedMotion ? "none" : "max-height 300ms ease",
                              }}
                              aria-hidden={form.howDidYouHear !== "Referral from another company"}
                            >
                              <div
                                className={`space-y-3 pl-1 ${
                                  form.howDidYouHear === "Referral from another company"
                                    ? ""
                                    : "pointer-events-none"
                                }`}
                              >
                                <div data-wizard-field="referralCompanyName">
                                  <input
                                    className={wizardInputClass(!!fieldErrors.referralCompanyName)}
                                    value={form.referralCompanyName}
                                    onChange={(e) => {
                                      setForm((p) => ({ ...p, referralCompanyName: e.target.value }));
                                      clearFieldError("referralCompanyName");
                                    }}
                                    placeholder="Company name"
                                    autoComplete="organization"
                                  />
                                  {fieldErrors.referralCompanyName ? (
                                    <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p>
                                  ) : null}
                                </div>
                                <div data-wizard-field="referralEmail">
                                  <input
                                    className={wizardInputClass(!!fieldErrors.referralEmail)}
                                    type="email"
                                    value={form.referralEmail}
                                    onChange={(e) => {
                                      setForm((p) => ({ ...p, referralEmail: e.target.value }));
                                      clearFieldError("referralEmail");
                                    }}
                                    placeholder="Company email (optional)"
                                    autoComplete="email"
                                  />
                                  {fieldErrors.referralEmail ? (
                                    <p className={fieldErrorTextClass}>Enter a valid email or leave blank</p>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {fieldErrors.howDidYouHear ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Job basics</h2>
                <div>
                  <p className={labelClass}>Job category</p>
                  <div
                    data-wizard-field="industry"
                    className={wizardGroupShell(!!fieldErrors.industry, "grid grid-cols-1 gap-3 md:grid-cols-2")}
                  >
                    {INDUSTRY_OPTIONS.map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.industry === option}
                        onClick={() => {
                          setForm((p) => ({ ...p, industry: option }));
                          clearFieldError("industry");
                        }}
                      />
                    ))}
                  </div>
                  {fieldErrors.industry ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
                <div>
                  <p className={labelClass}>
                    Hiring type{" "}
                    <span className="font-normal normal-case tracking-normal text-white/40">(optional)</span>
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["Recruitment of personnel for companies", "Temporary staffing request"].map((option) => (
                      <OptionCard key={option} label={option} selected={form.hiringType === option} onClick={() => setForm((p) => ({ ...p, hiringType: option }))} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className={labelClass}>
                    Job summary{" "}
                    <span className="font-normal normal-case tracking-normal text-white/40">(optional)</span>
                  </p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["General hiring inquiry", "Urgent replacement need", "Planned team expansion", "Project-specific hiring"].map((option) => (
                      <OptionCard key={option} label={option} selected={form.jobSummary === option} onClick={() => setForm((p) => ({ ...p, jobSummary: option }))} />
                    ))}
                  </div>
                </div>
                <div data-wizard-field="workerType">
                  <p className={labelClass}>Trade or position</p>
                  <input
                    className={wizardInputClass(!!fieldErrors.workerType)}
                    value={form.workerType}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, workerType: e.target.value }));
                      clearFieldError("workerType");
                    }}
                    placeholder="mechanics for auto industry"
                  />
                  {fieldErrors.workerType ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
                <div data-wizard-field="locations">
                  <p className={labelClass}>Location</p>
                  <div className={wizardGroupShell(!!fieldErrors.locations)}>
                    <input
                      className={wizardInputClass(false)}
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        clearFieldError("locations");
                      }}
                      placeholder="Search city"
                    />
                    <div className="mt-2 flex max-h-[150px] flex-wrap gap-2 overflow-auto">
                      {filteredCities.slice(0, 10).map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => toggleLocation(city)}
                          className={`min-h-[40px] rounded-full border px-3 py-1.5 text-xs ${form.locations.includes(city) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                  {fieldErrors.locations ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div data-wizard-field="candidates">
                    <p className={labelClass}>Number of workers</p>
                    <div className={wizardGroupShell(!!fieldErrors.candidates, "flex items-center gap-3")}>
                      <button
                        type="button"
                        className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-lg border border-[#C9A84C] text-[#C9A84C]"
                        onClick={() => {
                          setForm((p) => ({ ...p, candidates: Math.max(1, p.candidates - 1) }));
                          clearFieldError("candidates");
                        }}
                      >
                        -
                      </button>
                      <span className="min-w-12 text-center text-2xl font-bold">{form.candidates}</span>
                      <button
                        type="button"
                        className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-lg border border-[#C9A84C] text-[#C9A84C]"
                        onClick={() => {
                          setForm((p) => ({ ...p, candidates: p.candidates + 1 }));
                          clearFieldError("candidates");
                        }}
                      >
                        +
                      </button>
                    </div>
                    {fieldErrors.candidates ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div data-wizard-field="contractType">
                    <p className={labelClass}>Contract type</p>
                    <div className={wizardGroupShell(!!fieldErrors.contractType, "space-y-2")}>
                      {["Permanent employment", "Temporary hire", "Project-based"].map((option) => (
                        <OptionCard
                          key={option}
                          label={option}
                          selected={form.contractType === option}
                          onClick={() => {
                            setForm((p) => ({ ...p, contractType: option }));
                            clearFieldError("contractType");
                          }}
                        />
                      ))}
                    </div>
                    {fieldErrors.contractType ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                </div>
                <div>
                  <p className={labelClass}>Start date</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(["Immediate", "Specific start date"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm ${form.startDateMode === mode ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`}
                        onClick={() => {
                          setForm((p) => ({ ...p, startDateMode: mode }));
                          clearFieldError("startDate");
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  {form.startDateMode === "Specific start date" ? (
                    <div data-wizard-field="startDate">
                      <input
                        type="date"
                        className={wizardInputClass(!!fieldErrors.startDate)}
                        value={form.startDate}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, startDate: e.target.value }));
                          clearFieldError("startDate");
                        }}
                      />
                      {fieldErrors.startDate ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Salary and conditions</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className={labelClass}>Salary mode</p>
                    <div className="flex gap-2">
                      {(["Range", "Fixed"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${form.salaryMode === mode ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`}
                          onClick={() => setForm((p) => ({ ...p, salaryMode: mode }))}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className={labelClass}>Salary period</p>
                    <div className="flex gap-2">
                      {(["per hour", "per month"] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${form.salaryPeriod === period ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`}
                          onClick={() => setForm((p) => ({ ...p, salaryPeriod: period }))}
                        >
                          {period === "per hour" ? "Per hour" : "Per month"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
                    <p className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">
                      Salary (per hour, NOK)
                    </p>
                    <a
                      href="https://www.arbeidstilsynet.no/arbeidsforhold/lonn/minstelonn/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[11px] font-medium text-[#C9A84C] underline decoration-[#C9A84C]/40 underline-offset-2 hover:text-[#b8953f]"
                    >
                      View minimum wages →
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div data-wizard-field="salaryMin">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        className={wizardInputClass(!!fieldErrors.salaryMin)}
                        value={form.salaryMin}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, salaryMin: e.target.value }));
                          clearFieldError("salaryMin");
                        }}
                        placeholder="e.g. 220 NOK/hour"
                      />
                      {fieldErrors.salaryMin ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                    </div>
                    <div data-wizard-field="salaryMax">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        className={wizardInputClass(!!fieldErrors.salaryMax)}
                        value={form.salaryMax}
                        onChange={(e) => {
                          setForm((p) => ({ ...p, salaryMax: e.target.value }));
                          clearFieldError("salaryMax");
                        }}
                        placeholder="To (NOK/hour)"
                      />
                      {fieldErrors.salaryMax ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                    </div>
                  </div>
                  <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.4)" }}>
                    Must meet Arbeidstilsynet minimum wage requirements
                  </p>
                </div>
                <div data-wizard-field="accommodation">
                  <p className={labelClass}>Accommodation</p>
                  <div className={wizardGroupShell(!!fieldErrors.accommodation, "grid grid-cols-1 gap-2 md:grid-cols-2")}>
                    {[ACCOMMODATION_WE_HELP, ACCOMMODATION_CANDIDATE_OWN].map((option) => (
                      <OptionCard
                        key={option}
                        label={option}
                        selected={form.accommodation === option}
                        onClick={() => {
                          setForm((p) => ({
                            ...p,
                            accommodation: option,
                            accommodationCost: option === ACCOMMODATION_WE_HELP ? p.accommodationCost : "",
                          }));
                          clearFieldError("accommodation");
                        }}
                      />
                    ))}
                  </div>
                  {fieldErrors.accommodation ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
                <div
                  aria-hidden={form.accommodation !== ACCOMMODATION_WE_HELP}
                  className={`overflow-hidden transition-all duration-200 ease-out ${
                    form.accommodation === ACCOMMODATION_WE_HELP
                      ? "max-h-[160px] opacity-100"
                      : "pointer-events-none max-h-0 opacity-0"
                  }`}
                >
                  <div className="pb-1 pt-2">
                    <p className={labelClass}>Accommodation cost</p>
                    <input
                      className={wizardInputClass(false)}
                      value={form.accommodation === ACCOMMODATION_WE_HELP ? form.accommodationCost : ""}
                      onChange={(e) => {
                        if (form.accommodation !== ACCOMMODATION_WE_HELP) return;
                        setForm((p) => ({ ...p, accommodationCost: e.target.value }));
                      }}
                      placeholder="e.g. 5000 NOK or describe"
                      tabIndex={form.accommodation === ACCOMMODATION_WE_HELP ? 0 : -1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div data-wizard-field="localTransport">
                    <p className={labelClass}>Local travel</p>
                    <div className={wizardGroupShell(!!fieldErrors.localTransport, "flex flex-wrap gap-2")}>
                      {["Covered", "Not covered"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm ${form.localTransport === opt ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/60"}`}
                          onClick={() => {
                            setForm((p) => ({ ...p, localTransport: opt }));
                            clearFieldError("localTransport");
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {fieldErrors.localTransport ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                  <div data-wizard-field="internationalTransport">
                    <p className={`${labelClass} normal-case`}>International travel costs</p>
                    <div className={wizardGroupShell(!!fieldErrors.internationalTransport, "flex flex-col gap-3")}>
                      {(
                        [
                          { value: "company_covered" as const, label: "Covered by company" },
                          { value: "own_responsibility" as const, label: "Candidate's own responsibility" },
                        ] as const
                      ).map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 ${
                            form.internationalTransport === opt.value
                              ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)] text-[#C9A84C]"
                              : "border-white/10 bg-white/[0.03] text-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name="internationalTravelCosts"
                            value={opt.value}
                            checked={form.internationalTransport === opt.value}
                            onChange={() => {
                              setForm((p) => ({ ...p, internationalTransport: opt.value }));
                              clearFieldError("internationalTransport");
                            }}
                            className="h-4 w-4 shrink-0 accent-[#C9A84C] focus:outline-none"
                          />
                          <span className="text-sm font-semibold">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {fieldErrors.internationalTransport ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                  </div>
                </div>
                <div className="self-start">
                  <p className={labelClass}>Rotation</p>
                  <select
                    aria-label="Rotation or work schedule"
                    value={form.rotationSchedule}
                    onChange={(e) => setForm((p) => ({ ...p, rotationSchedule: e.target.value }))}
                    className="block w-[min(288px,92vw)] max-w-[288px] min-h-[44px] rounded-[12px] border border-white/10 bg-white/[0.05] px-3 py-3 text-sm text-white focus:outline-none focus:border-2 focus:border-[#C9A84C]"
                  >
                    {ROTATION_SCHEDULE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0D1B2A] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
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
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Requirements</h2>
                <div data-wizard-field="qualification">
                  <p className={labelClass}>Qualification</p>
                  <div className={wizardGroupShell(!!fieldErrors.qualification, "grid grid-cols-1 gap-2 md:grid-cols-2")}>
                    {["No minimum", "1 to 2 years", "3 to 5 years", "5+ years"].map((opt) => (
                      <OptionCard
                        key={opt}
                        label={opt}
                        selected={form.qualification === opt}
                        onClick={() => {
                          setForm((p) => ({ ...p, qualification: opt }));
                          clearFieldError("qualification");
                        }}
                      />
                    ))}
                  </div>
                  {fieldErrors.qualification ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
                <div data-wizard-field="dNumberChoice">
                  <div className={wizardGroupShell(!!fieldErrors.dNumberChoice, "flex flex-col gap-3")}>
                    {(
                      [
                        { value: "has_d_number" as const, label: "Already has a D-number" },
                        { value: "we_handle" as const, label: "We can handle the procedure" },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[12px] border px-4 py-3 ${
                          form.dNumberChoice === opt.value
                            ? "border-[#C9A84C] bg-[rgba(201,168,76,0.08)] text-[#C9A84C]"
                            : "border-white/10 bg-white/[0.03] text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="dNumberChoice"
                          value={opt.value}
                          checked={form.dNumberChoice === opt.value}
                          onChange={() => {
                            setForm((p) => ({ ...p, dNumberChoice: opt.value }));
                            clearFieldError("dNumberChoice");
                          }}
                          className="h-4 w-4 shrink-0 accent-[#C9A84C] focus:outline-none"
                        />
                        <span className="text-sm font-semibold">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.dNumberChoice ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
                <div>
                  <p className={labelClass}>
                    Driving license{" "}
                    <span className="font-normal normal-case tracking-normal text-white/40">(optional)</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {NORWEGIAN_DRIVING_LICENSE_CLASSES.map((cls) => {
                      const selected = form.driverLicenseSelections.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleDriverLicenseChip(cls)}
                          className={`min-h-[40px] rounded-lg border border-solid px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${
                            selected
                              ? "border-[rgba(255,255,255,0.2)] bg-[#C9A84C] text-[#0D1B2A]"
                              : "border-[rgba(255,255,255,0.2)] bg-transparent text-white/90"
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => toggleDriverLicenseChip(NO_DRIVING_LICENSE_REQUIRED)}
                      className={`min-h-[40px] rounded-lg border border-solid px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${
                        form.driverLicenseSelections.includes(NO_DRIVING_LICENSE_REQUIRED)
                          ? "border-[rgba(255,255,255,0.2)] bg-[#C9A84C] text-[#0D1B2A]"
                          : "border-[rgba(255,255,255,0.2)] bg-transparent text-white/90"
                      }`}
                    >
                      {NO_DRIVING_LICENSE_REQUIRED}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[
                    { label: "Trade certificate preferred", key: "tradeCertificatePreferred" as const },
                    { label: "Jaguar or Land Rover preferred", key: "jaguarLandRoverPreferred" as const },
                    { label: "Customer communication required", key: "customerCommunicationRequired" as const },
                    { label: "Diagnostics and electronics required", key: "diagnosticsExperienceRequired" as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <p className={labelClass}>
                        {label}{" "}
                        <span className="font-normal normal-case tracking-normal text-white/40">(optional)</span>
                      </p>
                      <div className="flex gap-2">
                        {(["Yes", "No"] as const).map((value) => (
                          <button
                            key={value}
                            type="button"
                            className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C] ${
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
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Work tasks</h2>
                <div data-wizard-field="workTasks">
                  <div className={wizardGroupShell(!!fieldErrors.workTasks, "flex flex-wrap gap-2")}>
                    {WORK_TASK_OPTIONS.map((task) => (
                      <button
                        key={task}
                        type="button"
                        onClick={() => toggleItem("workTasks", task)}
                        className={`min-h-[40px] rounded-full border px-4 py-2 text-sm ${form.workTasks.includes(task) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}
                      >
                        {task}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.workTasks ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Personal qualities</h2>
                <div data-wizard-field="personalQualities">
                  <div className={wizardGroupShell(!!fieldErrors.personalQualities, "flex flex-wrap gap-2")}>
                    {PERSONAL_QUALITY_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem("personalQualities", item)}
                        className={`min-h-[40px] rounded-full border px-4 py-2 text-sm ${form.personalQualities.includes(item) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.personalQualities ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">We offer</h2>
                <div data-wizard-field="offerItems">
                  <div className={wizardGroupShell(!!fieldErrors.offerItems, "flex flex-wrap gap-2")}>
                    {OFFER_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleItem("offerItems", item)}
                        className={`min-h-[40px] rounded-full border px-4 py-2 text-sm ${form.offerItems.includes(item) ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-[#C9A84C]" : "border-white/20 text-white/70"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.offerItems ? <p className={fieldErrorTextClass}>{FIELD_ERROR_MSG}</p> : null}
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Review your request</h2>
                <p className="text-sm text-white/55">Check the summary below. You can add optional notes on the next step.</p>
                <div className="rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] p-4">
                  <pre className="whitespace-pre-wrap text-sm text-white/75">{generatedNotes}</pre>
                </div>
              </div>
            )}

            {step === 8 && (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#C9A84C]">{`Step ${step + 1} of ${TOTAL_STEPS}`}</p>
                <h2 className="text-2xl font-extrabold">Additional notes</h2>
                <div>
                  <p className={labelClass}>Additional notes (optional)</p>
                  <textarea
                    rows={4}
                    className={`${wizardInputClass(false)} resize-none`}
                    value={form.additionalNotes}
                    onChange={(e) => setForm((p) => ({ ...p, additionalNotes: e.target.value }))}
                    placeholder="(optional)"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex w-full flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <button
                type="button"
                onClick={() => (step > 0 ? goTo(step - 1) : router.push("/request"))}
                disabled={animating || isSubmitting}
                className="inline-flex w-full shrink-0 items-center justify-center rounded-[10px] border border-solid border-[rgba(255,255,255,0.2)] bg-transparent px-4 py-2 text-sm font-semibold text-white/90 transition-colors duration-200 hover:border-[rgba(201,168,76,0.45)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={animating || isSubmitting}
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#C9A84C] px-5 py-2 text-sm font-bold text-[#0D1B2A] transition-[filter,background-color] duration-200 hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-40 sm:ml-auto sm:w-auto"
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
          animation: cardIn ${reducedMotion ? "0ms" : "250ms"} ease forwards;
          animation-delay: 0ms;
          opacity: ${reducedMotion ? "1" : "0"};
          transform: ${reducedMotion ? "translateY(0)" : "translateY(8px)"};
        }
        .card-exit {
          opacity: ${reducedMotion ? "1" : "0"};
          transform: ${reducedMotion ? "translateY(0)" : "translateY(8px)"};
          transition:
            opacity ${reducedMotion ? "0ms" : "250ms"} ease,
            transform ${reducedMotion ? "0ms" : "250ms"} ease;
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
