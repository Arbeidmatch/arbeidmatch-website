"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowLeft,
  Building2,
  Car,
  Check,
  Factory,
  Flame,
  Handshake,
  HardHat,
  Megaphone,
  Search,
  Sparkles,
  Truck,
  UserCheck,
  Users,
  Utensils,
  Waves,
  Zap,
} from "lucide-react";

import { trackPartnerAccessRequest, trackRequestSubmit } from "@/lib/analytics/requestEvents";
import { REQUEST_INDUSTRY_ROLE_GROUPS } from "@/lib/industry-roles";
import { clearPartnerRequestContext, writePartnerRequestContext } from "@/lib/partnerRequestContext";
import {
  isServiceAllowedFor,
  keepServiceIfAllowed,
  REQUEST_SERVICE_CARDS_NB,
  serviceCardsFor,
  withServiceChoice,
  type RequestServiceKey,
  type RequesterKind,
  type SelectableRequestService,
} from "@/lib/request-service";
import { useToast } from "@/lib/toast-context";

type PartnerVerifyCompany = {
  id: string;
  name: string;
  email?: string | null;
};

type PartnerVerifyResponse = {
  found?: boolean;
  company?: PartnerVerifyCompany;
  error?: string;
};

const AM_PARTNER_TOKEN_KEY = "am_partner_token";
const AM_PARTNER_COMPANY_KEY = "am_partner_company";
const AM_PARTNER_EMAIL_KEY = "am_partner_email";

function clearPartnerWizardSession() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AM_PARTNER_TOKEN_KEY);
    window.sessionStorage.removeItem(AM_PARTNER_COMPANY_KEY);
    window.sessionStorage.removeItem(AM_PARTNER_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

function readPartnerWizardTokenFromSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const t = window.sessionStorage.getItem(AM_PARTNER_TOKEN_KEY);
    return t && /^[0-9a-f-]{36}$/i.test(t) ? t : null;
  } catch {
    return null;
  }
}

/** Counts below this are never shown to the public; a neutral sentence is shown instead. */
const MIN_PUBLIC_CANDIDATE_COUNT = 10;

function isPublicCandidateCount(count: number | null | undefined): count is number {
  return typeof count === "number" && Number.isFinite(count) && count >= MIN_PUBLIC_CANDIDATE_COUNT;
}

function candidateAvailabilityLabel(count: number | null | undefined, scope: "industry" | "role"): string {
  if (isPublicCandidateCount(count)) return `${count} tilgjengelige kandidater`;
  return scope === "industry" ? "Vi rekrutterer i denne bransjen." : "Vi finner kvalifiserte kandidater for denne rollen.";
}

/** Display-only Norwegian labels. The English keys stay the values sent to the APIs. */
const INDUSTRY_LABEL_NB: Record<string, string> = {
  Building: "Bygg",
  Infrastructure: "Anlegg",
  Welding: "Sveising",
  Electrical: "Elektro",
  Production: "Produksjon",
  Logistics: "Logistikk",
  Cleaning: "Renhold",
  Hospitality: "Hotell og restaurant",
  Automotive: "Bil og verksted",
  Offshore: "Offshore",
  "Fish Industry": "Fiskeindustri",
};

const ROLE_LABEL_NB: Record<string, string> = {
  "Construction worker": "Bygningsarbeider",
  Carpenter: "Tømrer",
  Mason: "Murer",
  Plasterer: "Pusser",
  Painter: "Maler",
  Tiler: "Flislegger",
  Insulator: "Isolatør",
  Drywaller: "Gipsmontør",
  Glazier: "Glassmester",
  Roofer: "Taktekker",
  Plumber: "Rørlegger",
  Pipefitter: "Industrirørlegger",
  "Excavator operator": "Gravemaskinfører",
  "Concrete pump operator": "Betongpumpeoperatør",
  "Civil labourer": "Anleggsarbeider",
  "Steel fixer": "Armerer",
  "Concrete worker": "Betongarbeider",
  "Steel erector": "Stålmontør",
  Scaffolder: "Stillasmontør",
  "Welder MIG/MAG": "Sveiser MIG/MAG",
  "Welder TIG": "Sveiser TIG",
  "Pipe welder": "Rørsveiser",
  Boilermaker: "Kjelesmed",
  "Sheet metal worker": "Platearbeider",
  "Offshore welder": "Offshoresveiser",
  "Industrial electrician": "Industrielektriker",
  "Building electrician": "Installasjonselektriker",
  "Automation technician": "Automatiker",
  "Instrumentation technician": "Instrumenttekniker",
  "HVAC technician": "Ventilasjonstekniker",
  "Refrigeration technician": "Kuldetekniker",
  "Marine electrician": "Skipselektriker",
  "Solar installer": "Solcellemontør",
  "CNC operator": "CNC-operatør",
  "Machine operator": "Maskinoperatør",
  "Production worker": "Produksjonsmedarbeider",
  "Quality control": "Kvalitetskontrollør",
  "Maintenance technician": "Vedlikeholdstekniker",
  "Plant operator": "Anleggsoperatør",
  "Truck driver C/CE": "Lastebilsjåfør C/CE",
  "Bus driver D": "Bussjåfør D",
  "Delivery driver B": "Budsjåfør B",
  "Forklift operator": "Truckfører",
  "Warehouse worker": "Lagermedarbeider",
  "Crane operator": "Kranfører",
  Cleaner: "Renholder",
  Janitor: "Vaktmester",
  "Window cleaner": "Vinduspusser",
  "Facility manager": "Driftsleder",
  Cook: "Kokk",
  "Kitchen assistant": "Kjøkkenassistent",
  Waiter: "Servitør",
  "Hotel staff": "Hotellmedarbeider",
  Receptionist: "Resepsjonist",
  "Car mechanic": "Bilmekaniker",
  "Heavy equipment mechanic": "Anleggsmaskinmekaniker",
  "HGV mechanic": "Tungbilmekaniker",
  "Auto body technician": "Bilskadereparatør",
  "Tire technician": "Dekkmontør",
  "Offshore scaffolder": "Stillasmontør offshore",
  "Offshore rigger": "Rigger offshore",
  "Onshore process operator": "Prosessoperatør på land",
  "ROV technician": "ROV-tekniker",
  "Fish processing worker": "Fiskeindustriarbeider",
  "Fish farm worker": "Havbruksmedarbeider",
  "Aquaculture technician": "Akvakulturtekniker",
  "Fish packer": "Fiskepakker",
  "Slaughterhouse worker": "Slakteriarbeider",
  "Salmon farmer": "Lakserøkter",
};

function industryLabel(industry: string): string {
  return INDUSTRY_LABEL_NB[industry] ?? industry;
}

const ROLE_LABEL_NB_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABEL_NB).map(([key, label]) => [key.toLowerCase(), label]),
);

/** Case-insensitive, because a role can arrive from ?role= in any casing. */
function roleLabel(role: string): string {
  return ROLE_LABEL_NB[role] ?? ROLE_LABEL_NB_LOWER[role.toLowerCase()] ?? role;
}

/** Search matches either the Norwegian label shown on screen or the underlying English value. */
function filterRolesByQuery(roles: string[], rawQuery: string): string[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return roles;
  const names = (role: string) => [role.toLowerCase(), roleLabel(role).toLowerCase()];
  const startsWith = roles.filter((role) => names(role).some((n) => n.startsWith(query)));
  const contains = roles.filter(
    (role) => names(role).some((n) => n.includes(query)) && !names(role).some((n) => n.startsWith(query)),
  );
  return [...startsWith, ...contains];
}

function roleMatchesQueryExactly(role: string, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  return query === role.toLowerCase() || query === roleLabel(role).toLowerCase();
}

const COMPANY_EMAIL_REQUIRED_MESSAGE = "Bruk bedriftens e-postadresse.";

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  Building: HardHat,
  Infrastructure: Building2,
  Welding: Flame,
  Electrical: Zap,
  Production: Factory,
  Logistics: Truck,
  Cleaning: Sparkles,
  Hospitality: Utensils,
  Automotive: Car,
  Offshore: Anchor,
  "Fish Industry": Waves,
};

const CHECK_ROLE_GROUPS: Array<{ industry: string; icon: LucideIcon; roles: string[] }> = REQUEST_INDUSTRY_ROLE_GROUPS.map(
  ({ industry, roles }) => ({
    industry,
    icon: INDUSTRY_ICONS[industry]!,
    roles: [...roles],
  }),
);

const REQUEST_PARTNER_VERIFIED_KEY = "am_request_partner_verified";
const REQUEST_PARTNER_COMPANY_KEY = "am_request_partner_company";

const FREE_EMAIL_DOMAINS = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "msn.com"]);
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

type Ripple = { id: number; x: number; y: number };
type Particle = { id: number; dx: number; dy: number };

function PremiumIndustryCard({
  industry,
  Icon,
  index,
  selected,
  reduceMotion,
  onSelect,
  candidateCount,
}: {
  industry: string;
  Icon: LucideIcon;
  index: number;
  selected: boolean;
  reduceMotion: boolean | null;
  onSelect: (industry: string) => void;
  candidateCount: number | null;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [bursts, setBursts] = useState<Particle[]>([]);

  const handleTap = (event: ReactMouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple: Ripple = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    setRipples((prev) => [...prev, ripple]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 420);

    const burstSeed = Date.now();
    const particles: Particle[] = Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.7;
      const radius = 22 + Math.random() * 18;
      return {
        id: burstSeed + i,
        dx: Math.cos(angle) * radius,
        dy: Math.sin(angle) * radius,
      };
    });
    setBursts(particles);
    window.setTimeout(() => setBursts([]), 520);

    onSelect(industry);
  };

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      initial={reduceMotion ? false : { y: 30, opacity: 0, scale: 0.93 }}
      animate={
        selected && !reduceMotion
          ? { y: 0, opacity: 1, scale: [0.96, 1.04, 1] }
          : { y: 0, opacity: 1, scale: 1 }
      }
      transition={{
        duration: reduceMotion ? 0 : 0.45,
        delay: reduceMotion ? 0 : index * 0.08,
        type: "spring",
        stiffness: 260,
        damping: 24,
      }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              scale: 1.04,
              borderColor: "rgba(255,255,255,0.2)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
              transition: { type: "spring", stiffness: 500, damping: 30 },
            }
      }
      whileTap={reduceMotion ? undefined : { scale: 0.97, transition: { duration: 0.1 } }}
      className={`group relative w-full overflow-hidden rounded-3xl border p-5 text-left ${
        selected
          ? "border-[#C9A84C] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.08),transparent_65%)] shadow-[0_0_24px_rgba(201,168,76,0.4)]"
          : "border-white/10 bg-gradient-to-br from-[#0f2035] to-[#0a1628]"
      }`}
    >
      <motion.span
        aria-hidden
        initial={{ x: "-120%", opacity: 0 }}
        whileHover={reduceMotion ? undefined : { x: "140%", opacity: 0.9 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="pointer-events-none absolute h-8 w-8 rounded-full bg-white/20"
          style={{ left: ripple.x - 16, top: ripple.y - 16 }}
          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      ))}
      {bursts.map((particle) => (
        <motion.span
          key={particle.id}
          className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-[#C9A84C]"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{ x: particle.dx, y: particle.dy, scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      ))}

      {selected ? (
        <motion.span
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.3, 1] }}
          transition={{ type: "spring", stiffness: 360, damping: 22 }}
        >
          <Check className="h-4 w-4" />
        </motion.span>
      ) : null}

      <div className="relative z-10 flex h-full flex-col items-start justify-between gap-4">
        <Icon className={`h-8 w-8 ${selected ? "text-[#C9A84C] drop-shadow-[0_0_10px_rgba(201,168,76,0.5)]" : "text-[#C9A84C]"}`} />
        <div>
          <p className={`text-base tracking-tight ${selected ? "font-semibold text-white" : "font-semibold text-white/90"}`}>{industryLabel(industry)}</p>
          {candidateCount === null ? (
            <p className="mt-1 text-sm text-white/55">...</p>
          ) : isPublicCandidateCount(candidateCount) ? (
            <p className="mt-1 text-sm font-medium text-[#C9A84C]">{candidateAvailabilityLabel(candidateCount, "industry")}</p>
          ) : (
            <p className="mt-1 text-sm text-white/60">{candidateAvailabilityLabel(candidateCount, "industry")}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

const SERVICE_ICONS: Record<RequestServiceKey, LucideIcon> = {
  staffing: Users,
  recruitment: UserCheck,
  sourcing: Search,
  advertising: Megaphone,
};

/**
 * Asked before the services, because the answer decides which of them are
 * shown: a bemannings or rekrutteringsbyrå is never offered Bemanning (the
 * owner, 24 September 2026). Same words as the ATS's own form.
 */
const REQUESTER_KIND_OPTIONS_NB: ReadonlyArray<{ key: RequesterKind; label: string; blurb: string; icon: LucideIcon }> = [
  { key: "own_operation", label: "Vi trenger folk til egen drift", blurb: "Folkene skal jobbe i våre egne prosjekter.", icon: Building2 },
  {
    key: "agency",
    label: "Vi er et bemannings- eller rekrutteringsbyrå",
    blurb: "Vi leverer folk videre til våre egne kunder.",
    icon: Handshake,
  },
];

function serviceLabelNb(service: string): string {
  return REQUEST_SERVICE_CARDS_NB.find((card) => card.key === service)?.label ?? "";
}

/** One answer on the service step, in the look of the industry cards. */
function ServiceChoiceCard({
  label,
  blurb,
  Icon,
  selected,
  disabled = false,
  onSelect,
}: {
  label: string;
  blurb: string;
  Icon: LucideIcon;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onSelect}
      disabled={disabled}
      aria-pressed={disabled ? undefined : selected}
      aria-disabled={disabled || undefined}
      className={`relative flex h-full w-full flex-row items-start gap-4 rounded-3xl border p-4 text-left sm:flex-col sm:p-5 transition-[border-color,box-shadow,background-color] duration-200 ${
        disabled
          ? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-60"
          : selected
            ? "border-[#C9A84C] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.08),transparent_65%)] shadow-[0_0_24px_rgba(201,168,76,0.4)]"
            : "border-white/10 bg-gradient-to-br from-[#0f2035] to-[#0a1628] hover:border-[#C9A84C]/60"
      }`}
    >
      {selected && !disabled ? (
        <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#C9A84C] text-[#0D1B2A]">
          <Check className="h-4 w-4" />
        </span>
      ) : null}
      <Icon className={`h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${disabled ? "text-white/40" : "text-[#C9A84C]"}`} aria-hidden />
      <div className="pr-8">
        <p className="text-base font-semibold tracking-tight text-white">{label}</p>
        <p className={`mt-1 text-sm ${disabled ? "text-white/50" : "text-white/65"}`}>{blurb}</p>
      </div>
    </button>
  );
}

export default function RequestPage() {
  const router = useRouter();
  const toast = useToast();

  const navigateBackOrHome = useCallback(() => {
    if (typeof window === "undefined") {
      router.push("/");
      return;
    }
    if (window.history.length <= 1) {
      router.push("/");
      return;
    }
    router.back();
  }, [router]);

  const [checkState, setCheckState] = useState<"partner_check" | "idle">("partner_check");
  const [pickerStep, setPickerStep] = useState<"service" | "industries" | "roles" | "modal">("service");
  /** The kind of firm and the service, chosen first; both reach the wizard on its address. */
  const [requesterKind, setRequesterKind] = useState<RequesterKind | "">("");
  const [serviceChoice, setServiceChoice] = useState<SelectableRequestService | "">("");
  const [verifiedPartnerCompany, setVerifiedPartnerCompany] = useState<string | null>(null);
  const [industryCounts, setIndustryCounts] = useState<Record<string, number | null>>({});
  const [roleCounts, setRoleCounts] = useState<Record<string, number | null>>({});
  const [partnerSessionHydrated, setPartnerSessionHydrated] = useState(false);
  const partnerVerifyFromRef = useRef<"partner_check" | "modal">("modal");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleQuery, setRoleQuery] = useState("");

  const [accessEmail, setAccessEmail] = useState("");
  const [accessStatus, setAccessStatus] = useState<"idle" | "submitting" | "partner" | "non_partner" | "error">("idle");
  const [companyName, setCompanyName] = useState("");
  const [accessErrorMessage, setAccessErrorMessage] = useState("");

  const [resultAction, setResultAction] = useState<"none" | "partner">("none");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<null | { type: "link"; href: string } | { type: "history" }>(null);
  const [partnerIssueStatus, setPartnerIssueStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [isLoadingExit, setIsLoadingExit] = useState(false);
  const [partnerModalView, setPartnerModalView] = useState<"not_found" | "feedback_form" | "feedback_success">("not_found");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [partnerIssueMessage, setPartnerIssueMessage] = useState("");
  const [notFoundExiting, setNotFoundExiting] = useState(false);
  const [showPartnerApplicationModal, setShowPartnerApplicationModal] = useState(false);
  const [partnerApplicationEmail, setPartnerApplicationEmail] = useState("");
  const [partnerApplicationStatus, setPartnerApplicationStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [partnerApplicationError, setPartnerApplicationError] = useState("");
  const [getStartedEmail, setGetStartedEmail] = useState("");
  const [getStartedGdpr, setGetStartedGdpr] = useState(false);
  const [getStartedError, setGetStartedError] = useState("");
  const [getStartedSubmitting, setGetStartedSubmitting] = useState(false);
  const [getStartedStep, setGetStartedStep] = useState<"form" | "otp">("form");
  const [getStartedOtp, setGetStartedOtp] = useState("");
  const [getStartedVerificationId, setGetStartedVerificationId] = useState<string | null>(null);
  const [partnerOtpStep, setPartnerOtpStep] = useState<"email" | "otp">("email");
  const [partnerOtp, setPartnerOtp] = useState("");
  const [partnerVerificationId, setPartnerVerificationId] = useState<string | null>(null);
  const [otpError, setOtpError] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyContent, setPrivacyContent] = useState<string>("");
  const [privacyLoading, setPrivacyLoading] = useState(false);
  /** Set after partner email verify; used for direct /request/[token] without simple-request email. */
  const [partnerWizardToken, setPartnerWizardToken] = useState<string | null>(null);
  const [verifyCountdown, setVerifyCountdown] = useState(0);
  const [verifyCanResend, setVerifyCanResend] = useState(true);
  const [partnerApplicationCountdown, setPartnerApplicationCountdown] = useState(0);
  const [partnerApplicationCanResend, setPartnerApplicationCanResend] = useState(true);
  const [flowDirection, setFlowDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const hasMountedHistoryGuard = useRef(false);
  const allowNextNavigationRef = useRef(false);
  const hasAutoStartedRoleCheck = useRef(false);

  const startCountdown = (setCountdown: (value: number | ((prev: number) => number)) => void, setCanResend: (value: boolean) => void) => {
    setCanResend(false);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const filteredRoles = useMemo(() => {
    if (!selectedIndustry) return [];
    const group = CHECK_ROLE_GROUPS.find((item) => item.industry === selectedIndustry);
    if (!group) return [];
    return filterRolesByQuery(group.roles, roleQuery);
  }, [roleQuery, selectedIndustry]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedToken = readPartnerWizardTokenFromSession();
      if (storedToken) setPartnerWizardToken(storedToken);
    } catch {
      /* ignore */
    }
    setPartnerSessionHydrated(true);
  }, []);

  useEffect(() => {
    if (checkState !== "idle" || selectedIndustry) return;
    let cancelled = false;
    const initial: Record<string, number | null> = {};
    CHECK_ROLE_GROUPS.forEach(({ industry }) => {
      initial[industry] = null;
    });
    setIndustryCounts(initial);
    void (async () => {
      const results = await Promise.all(
        CHECK_ROLE_GROUPS.map(async ({ industry }) => {
          try {
            const response = await fetch(
              `/api/candidate-count?industry=${encodeURIComponent(industry)}`,
            );
            const data = (await response.json()) as { count?: number };
            const n =
              typeof data.count === "number" && Number.isFinite(data.count) && data.count >= 0
                ? data.count
                : 0;
            return [industry, n] as const;
          } catch {
            return [industry, 0] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, number | null> = {};
      for (const [industry, n] of results) {
        next[industry] = n;
      }
      setIndustryCounts(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [checkState, selectedIndustry]);

  const isPastFirstStep = useMemo(() => {
    if (checkState === "partner_check") return false;
    if (pickerStep === "service") return Boolean(requesterKind || serviceChoice || resultAction !== "none");
    if (pickerStep !== "industries") return true;
    if (serviceChoice) return true;
    if (selectedIndustry.trim()) return true;
    if (roleQuery.trim()) return true;
    if (selectedRole) return true;
    if (resultAction !== "none") return true;
    if (accessStatus === "non_partner") return true;
    return false;
  }, [accessStatus, checkState, pickerStep, requesterKind, resultAction, roleQuery, selectedIndustry, selectedRole, serviceChoice]);

  /** A change of kind keeps the service only while it is still offered to that kind. */
  const handleRequesterKindSelect = useCallback((kind: RequesterKind) => {
    setRequesterKind(kind);
    setServiceChoice((prev) => keepServiceIfAllowed(prev, kind) as SelectableRequestService | "");
  }, []);

  /** Choosing the service moves on: to the modal when a role came on the link, else to the industries. */
  const handleServiceSelect = useCallback(
    (service: SelectableRequestService) => {
      if (!isServiceAllowedFor(service, requesterKind || null)) return;
      setServiceChoice(service);
      setFlowDirection(1);
      if (selectedIndustry && selectedRole) setPickerStep("modal");
      else if (selectedIndustry) setPickerStep("roles");
      else setPickerStep("industries");
    },
    [requesterKind, selectedIndustry, selectedRole],
  );

  useEffect(() => {
    const industry = selectedIndustry.trim();
    const role = (selectedRole || roleQuery).trim();
    if (!industry && !role) return;
    writePartnerRequestContext(industry, role);
  }, [selectedIndustry, selectedRole, roleQuery]);

  const handlePremiumIndustrySelect = useCallback((industry: string) => {
    setFlowDirection(1);
    setRoleQuery("");
    setSelectedIndustry(industry);
    setPickerStep("roles");
    setSelectedRole(null);
  }, []);

  useEffect(() => {
    if (checkState !== "idle" || pickerStep !== "roles" || !selectedIndustry) return;
    const group = CHECK_ROLE_GROUPS.find((item) => item.industry === selectedIndustry);
    if (!group) return;
    const roles = filterRolesByQuery(group.roles, roleQuery);
    if (!roles.length) {
      setRoleCounts({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const results = await Promise.all(
        roles.map(async (role) => {
          try {
            const response = await fetch(`/api/candidate-count?role=${encodeURIComponent(role)}`);
            const data = (await response.json()) as { count?: number };
            const n =
              typeof data.count === "number" && Number.isFinite(data.count) && data.count >= 0 ? data.count : 0;
            return [role, n] as const;
          } catch {
            return [role, 0] as const;
          }
        }),
      );
      if (cancelled) return;
      const next: Record<string, number | null> = {};
      for (const [role, n] of results) {
        next[role] = n;
      }
      setRoleCounts(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [checkState, pickerStep, selectedIndustry, roleQuery]);

  useEffect(() => {
    if (!partnerSessionHydrated || checkState !== "idle") return;
    try {
      const raw = sessionStorage.getItem("request-picker-restore");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { industry?: string };
      if (parsed.industry) {
        setSelectedIndustry(parsed.industry);
        // The service is asked first; choosing it continues to this industry's roles.
        setPickerStep("service");
        setSelectedRole(null);
        setRoleQuery("");
      }
      sessionStorage.removeItem("request-picker-restore");
    } catch {
      /* ignore */
    }
  }, [partnerSessionHydrated, checkState]);

  useEffect(() => {
    if (!partnerSessionHydrated) return;
    if (typeof window === "undefined") return;
    if (hasAutoStartedRoleCheck.current) return;

    const roleFromQuery = (new URLSearchParams(window.location.search).get("role") || "").trim();
    if (!roleFromQuery) return;

    hasAutoStartedRoleCheck.current = true;
    const matchingIndustry = CHECK_ROLE_GROUPS.find((group) =>
      group.roles.some((r) => r.toLowerCase() === roleFromQuery.toLowerCase()),
    )?.industry;

    if (matchingIndustry) {
      setPartnerWizardToken(readPartnerWizardTokenFromSession());
      setSelectedIndustry(matchingIndustry);
      setSelectedRole(roleFromQuery);
      // The service is asked first; choosing it opens the modal for this role.
      setPickerStep("service");
      setRoleQuery("");
      setFlowDirection(1);
    } else {
      setRoleQuery(roleFromQuery);
      setPickerStep("service");
    }
  }, [partnerSessionHydrated]);

  const sendPartnerOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verifyCanResend || otpBusy) return;
    const email = accessEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      toast.error("Oppgi en gyldig e-postadresse fra bedriften.");
      return;
    }
    setAccessStatus("submitting");
    setAccessErrorMessage("");
    setOtpError("");
    setIsLoadingExit(false);
    try {
      const verifyResponse = await fetch(`/api/public/partner-verify?email=${encodeURIComponent(email)}`);
      let verifyData: PartnerVerifyResponse = {};
      try {
        verifyData = (await verifyResponse.json()) as PartnerVerifyResponse;
      } catch {
        verifyData = {};
      }

      if (verifyResponse.status === 400) {
        toast.error("Oppgi en gyldig e-postadresse fra bedriften.");
        setAccessStatus("idle");
        return;
      }

      if (!verifyResponse.ok || !verifyData.found || !verifyData.company) {
        setAccessErrorMessage("email_not_recognized");
        setIsLoadingExit(true);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setAccessStatus("error");
        setIsLoadingExit(false);
        return;
      }

      const verifiedCompanyName = (verifyData.company.name || "bedriften deres").trim() || "bedriften deres";
      setCompanyName(verifiedCompanyName);

      const otpResponse = await fetch("/api/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, flow: "partner" }),
      });
      const otpData = (await otpResponse.json().catch(() => null)) as
        | { success?: boolean; verificationId?: string; error?: string; retryAfterSeconds?: number }
        | null;

      if (!otpResponse.ok || !otpData?.success || !otpData.verificationId) {
        setOtpError(otpData?.error || "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
        setAccessStatus("idle");
        return;
      }

      startCountdown(setVerifyCountdown, setVerifyCanResend);
      trackRequestSubmit(selectedIndustry || selectedRole || "unknown", 0);
      try {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(AM_PARTNER_COMPANY_KEY, verifiedCompanyName);
          window.sessionStorage.setItem(AM_PARTNER_EMAIL_KEY, email);
        }
      } catch {
        /* ignore */
      }
      setPartnerVerificationId(otpData.verificationId);
      setPartnerOtp("");
      setPartnerOtpStep("otp");
      setAccessStatus("partner");
      setIsLoadingExit(false);
      toast.success("Bekreftelseskoden er sendt. Sjekk e-posten.");
    } catch {
      setAccessErrorMessage("Vi kunne ikke sjekke tilgangen akkurat nå. Prøv igjen.");
      toast.error("Vi kunne ikke bekrefte partnertilgangen akkurat nå.");
      setIsLoadingExit(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAccessStatus("error");
      setIsLoadingExit(false);
    }
  };

  const verifyPartnerOtp = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (otpBusy) return;
    const email = accessEmail.trim().toLowerCase();
    const code = partnerOtp.replace(/\D/g, "").slice(0, 6);
    if (!email.includes("@") || code.length !== 6) {
      setOtpError("Skriv inn den 6-sifrede koden fra e-posten.");
      return;
    }
    setOtpBusy(true);
    setOtpError("");
    try {
      const response = await fetch("/api/verify-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
          flow: "partner",
          verificationId: partnerVerificationId || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; redirectUrl?: string; error?: string }
        | null;
      if (!response.ok || !data?.success || !data.redirectUrl) {
        setOtpError(data?.error || "Vi kunne ikke bekrefte koden. Prøv igjen.");
        return;
      }
      allowNextNavigationRef.current = true;
      router.push(data.redirectUrl);
    } catch {
      setOtpError("Vi kunne ikke bekrefte koden akkurat nå. Prøv igjen.");
    } finally {
      setOtpBusy(false);
    }
  };

  const resetEmail = () => {
    setAccessEmail("");
    setAccessErrorMessage("");
    setAccessStatus("idle");
    setPartnerOtpStep("email");
    setPartnerOtp("");
    setPartnerVerificationId(null);
    setOtpError("");
    setIsLoadingExit(false);
  };

  const openPrivacyModal = async () => {
    setShowPrivacyModal(true);
    if (privacyContent) return; // Already fetched
    setPrivacyLoading(true);
    try {
      const atsUrl = (process.env.NEXT_PUBLIC_ATS_URL?.trim() || "https://ats.arbeidmatch.no").replace(/\/$/, "");
      const res = await fetch(`${atsUrl}/api/public/legal/privacy-notice`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setPrivacyContent(data.content_md || "");
      }
    } catch {
      // Fallback handled by modal
    } finally {
      setPrivacyLoading(false);
    }
  };

  const submitGetStartedOtpRequest = async () => {
    const industryResolved =
      selectedIndustry.trim() ||
      (selectedRole
        ? (CHECK_ROLE_GROUPS.find((item) => item.roles.includes(selectedRole))?.industry ?? "").trim()
        : "");

    if (!getStartedGdpr) {
      setGetStartedError("Godta personvernerklæringen for å fortsette.");
      return;
    }
    if (!selectedRole) {
      setGetStartedError("Velg en rolle først.");
      return;
    }
    if (!requesterKind || !isServiceAllowedFor(serviceChoice, requesterKind)) {
      setGetStartedError("Velg først hvilken tjeneste dere trenger.");
      return;
    }
    if (!industryResolved) {
      setGetStartedError("Velg en bransje, slik at vi kan behandle forespørselen riktig.");
      return;
    }

    const email = getStartedEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setGetStartedError("Oppgi en gyldig e-postadresse.");
      return;
    }

    setGetStartedSubmitting(true);
    setGetStartedError("");
    setOtpError("");
    try {
      const response = await fetch("/api/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          flow: "new_company",
          gdprConsent: true,
          role: selectedRole,
          // The stored role stays the English key the later steps map from;
          // the letter needs the word the client actually pressed, or a
          // Norwegian e-mail tells him he asked for a "Carpenter".
          roleDisplay: roleLabel(selectedRole),
          industry: industryResolved,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; verificationId?: string; error?: string }
        | null;

      if (!response.ok || !data?.success || !data.verificationId) {
        setGetStartedError(data?.error || "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
        return;
      }
      setGetStartedVerificationId(data.verificationId);
      setGetStartedOtp("");
      setGetStartedStep("otp");
    } catch {
      setGetStartedError("Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    } finally {
      setGetStartedSubmitting(false);
    }
  };

  const verifyGetStartedOtp = async () => {
    if (otpBusy) return;
    const email = getStartedEmail.trim().toLowerCase();
    const code = getStartedOtp.replace(/\D/g, "").slice(0, 6);
    if (!email.includes("@") || code.length !== 6) {
      setOtpError("Skriv inn den 6-sifrede koden fra e-posten.");
      return;
    }
    setOtpBusy(true);
    setOtpError("");
    try {
      const response = await fetch("/api/verify-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
          flow: "new_company",
          verificationId: getStartedVerificationId || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { success?: boolean; redirectUrl?: string; error?: string }
        | null;
      if (!response.ok || !data?.success || !data.redirectUrl) {
        setOtpError(data?.error || "Vi kunne ikke bekrefte koden. Prøv igjen.");
        return;
      }
      allowNextNavigationRef.current = true;
      // Neither the code nor the token has a column for these two answers, so
      // they ride on the wizard's address, which keeps them per token.
      router.push(withServiceChoice(data.redirectUrl, { service: serviceChoice, kind: requesterKind }));
    } catch {
      setOtpError("Vi kunne ikke bekrefte koden akkurat nå. Prøv igjen.");
    } finally {
      setOtpBusy(false);
    }
  };

  const handleAvailabilityBack = () => {
    if (checkState === "partner_check") {
      navigateBackOrHome();
      return;
    }
    if (pickerStep === "modal") {
      setPickerStep("roles");
      setSelectedRole(null);
      setGetStartedEmail("");
      setGetStartedGdpr(false);
      setGetStartedError("");
      setGetStartedStep("form");
      setGetStartedOtp("");
      setGetStartedVerificationId(null);
      setOtpError("");
      return;
    }
    if (pickerStep === "roles" && selectedIndustry) {
      setFlowDirection(-1);
      setSelectedIndustry("");
      setSelectedRole(null);
      setPickerStep("industries");
      setRoleQuery("");
      return;
    }
    if (pickerStep === "industries") {
      setFlowDirection(-1);
      setPickerStep("service");
      return;
    }
    navigateBackOrHome();
  };

  const resetToFirstStep = () => {
    setShowLeaveDialog(false);
    setFlowDirection(-1);
    setCheckState(verifiedPartnerCompany ? "idle" : "partner_check");
    setPickerStep("service");
    setRequesterKind("");
    setServiceChoice("");
    setSelectedIndustry("");
    setSelectedRole(null);
    setRoleQuery("");
    setRoleCounts({});
    setGetStartedEmail("");
    setGetStartedGdpr(false);
    setGetStartedError("");
    setGetStartedStep("form");
    setGetStartedOtp("");
    setGetStartedVerificationId(null);
    setOtpError("");
    setPartnerOtpStep("email");
    setPartnerOtp("");
    setPartnerVerificationId(null);
    setAccessEmail("");
    setAccessStatus("idle");
    setAccessErrorMessage("");
    setCompanyName("");
    setResultAction("none");
    setPartnerModalView("not_found");
    setPartnerIssueStatus("idle");
    setPartnerIssueMessage("");
    setFeedbackEmail("");
    setNotFoundExiting(false);
    setShowPartnerApplicationModal(false);
    setPartnerApplicationEmail("");
    setPartnerApplicationStatus("idle");
    setPartnerApplicationError("");
    setVerifyCountdown(0);
    setVerifyCanResend(true);
    setPartnerApplicationCountdown(0);
    setPartnerApplicationCanResend(true);
    hasAutoStartedRoleCheck.current = false;
    clearPartnerRequestContext();
    clearPartnerWizardSession();
    setPartnerWizardToken(null);
  };

  const reportPartnerIssue = async () => {
    if (!feedbackEmail.includes("@") || partnerIssueStatus === "submitting") return;
    setPartnerIssueStatus("submitting");
    try {
      const response = await fetch("/api/partner-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: feedbackEmail.trim().toLowerCase(),
          message: partnerIssueMessage.trim(),
        }),
      });
      if (response.ok) {
        setPartnerIssueStatus("success");
        setPartnerModalView("feedback_success");
      } else {
        setPartnerIssueStatus("error");
      }
    } catch {
      setPartnerIssueStatus("error");
    }
  };

  const startPartnerApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerApplicationCanResend) return;
    const email = partnerApplicationEmail.trim().toLowerCase();
    const domain = email.split("@")[1]?.trim() || "";
    if (!email.includes("@") || !domain) {
      toast.error("Oppgi en gyldig e-postadresse fra bedriften.");
      return;
    }
    if (FREE_EMAIL_DOMAINS.has(domain)) {
      setPartnerApplicationError(COMPANY_EMAIL_REQUIRED_MESSAGE);
      setPartnerApplicationStatus("error");
      toast.error(COMPANY_EMAIL_REQUIRED_MESSAGE);
      return;
    }

    setPartnerApplicationStatus("submitting");
    setPartnerApplicationError("");
    try {
      const response = await fetch("/api/partner-request/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { success?: boolean; reason?: string };
      if (!response.ok || !data.success) {
        if (data.reason === "personal_email") {
          setPartnerApplicationError(COMPANY_EMAIL_REQUIRED_MESSAGE);
        } else if (data.reason === "table_missing") {
          setPartnerApplicationError("Partnersøknader er midlertidig utilgjengelige. Prøv igjen om litt.");
        } else {
          setPartnerApplicationError("Vi kunne ikke starte partnersøknaden akkurat nå.");
        }
        setPartnerApplicationStatus("error");
        toast.error("Vi kunne ikke starte partnersøknaden akkurat nå.");
        return;
      }
      setPartnerApplicationStatus("success");
      startCountdown(setPartnerApplicationCountdown, setPartnerApplicationCanResend);
      toast.success("Lenken til søknaden er sendt. Sjekk innboksen.");
    } catch {
      setPartnerApplicationStatus("error");
      setPartnerApplicationError("Vi kunne ikke starte partnersøknaden akkurat nå.");
      toast.error("Vi kunne ikke starte partnersøknaden akkurat nå.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasMountedHistoryGuard.current) return;
    window.history.pushState({ requestFlowGuard: true }, "", window.location.href);
    hasMountedHistoryGuard.current = true;
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: Event) => {
      if (allowNextNavigationRef.current) return;
      if (!isPastFirstStep) return;
      const raw = event.target;
      if (!(raw instanceof Element)) return;
      if (
        raw.closest(".leave-dialog") ||
        raw.closest(".partner-modal") ||
        raw.closest(".partner-modal-backdrop")
      ) {
        return;
      }
      const anchor = raw.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/")) return;
      event.preventDefault();
      setPendingLeaveAction({ type: "link", href });
      setShowLeaveDialog(true);
    };

    const onPopState = () => {
      if (allowNextNavigationRef.current) {
        allowNextNavigationRef.current = false;
        return;
      }
      if (!isPastFirstStep) return;
      setPendingLeaveAction({ type: "history" });
      setShowLeaveDialog(true);
      window.history.pushState({ requestFlowGuard: true }, "", window.location.href);
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [isPastFirstStep]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (checkState !== "idle" || pickerStep !== "modal") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPickerStep("roles");
        setSelectedRole(null);
        setGetStartedEmail("");
        setGetStartedGdpr(false);
        setGetStartedError("");
        setGetStartedStep("form");
        setGetStartedOtp("");
        setGetStartedVerificationId(null);
        setOtpError("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev || "";
      window.removeEventListener("keydown", onKey);
    };
  }, [checkState, pickerStep]);

  return (
    <section className="flex min-h-screen flex-col items-center overflow-x-hidden bg-[#0D1B2A] px-4 py-6 text-white md:min-h-dvh md:px-6 md:py-10">
      <div
        className={`mx-auto w-full max-w-sm bg-white/5 p-6 transition-all duration-300 md:max-w-[980px] md:p-9 md:bg-[rgba(255,255,255,0.03)] ${
          checkState === "idle" && pickerStep === "industries"
            ? "rounded-2xl border-0 outline-none ring-0 md:rounded-[16px]"
            : "rounded-2xl border border-white/10 md:rounded-[16px] md:border-[rgba(201,168,76,0.15)] md:border-t-2 md:border-t-[rgba(201,168,76,0.4)]"
        }`}
      >
        {checkState === "partner_check" && (
          <>
            <button
              type="button"
              onClick={handleAvailabilityBack}
              className="mb-4 inline-flex items-center gap-2 rounded-[10px] border border-[#C9A84C]/25 bg-[#C9A84C]/5 px-3 py-1.5 text-sm text-[#C9A84C] transition-colors duration-200 hover:border-[#C9A84C]/55 hover:bg-[#C9A84C]/10"
            >
              <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
              Tilbake
            </button>
            <AnimatePresence mode="wait" custom={flowDirection}>
              <motion.div
                key="partner-check"
                className="mt-2"
                custom={flowDirection}
                variants={slideVariants}
                initial={reduceMotion ? false : "enter"}
                animate="center"
                exit={reduceMotion ? undefined : "exit"}
              >
                <h1 className="text-2xl font-bold">Er dere allerede partner hos ArbeidMatch?</h1>
                <div className="mt-8 flex flex-col gap-3 md:flex-row md:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      partnerVerifyFromRef.current = "partner_check";
                      setAccessErrorMessage("");
                      setPartnerModalView("not_found");
                      setAccessStatus("idle");
                      setPartnerOtpStep("email");
                      setPartnerOtp("");
                      setPartnerVerificationId(null);
                      setOtpError("");
                      setResultAction("partner");
                      trackPartnerAccessRequest();
                    }}
                    className="h-14 w-full rounded-xl bg-[#C9A84C] text-base font-bold text-[#0D1B2A] md:flex-1"
                  >
                    Ja, vi er partner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearPartnerWizardSession();
                      setPartnerWizardToken(null);
                      setFlowDirection(1);
                      setPickerStep("service");
                      setRequesterKind("");
                      setServiceChoice("");
                      setSelectedIndustry("");
                      setSelectedRole(null);
                      setRoleQuery("");
                      setCheckState("idle");
                    }}
                    className="h-14 w-full rounded-xl border border-[#C9A84C]/50 py-3 text-base font-semibold text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10 md:flex-1"
                  >
                    Nei, vi er nye
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </>
        )}
        {checkState === "idle" && (
          <>
            <button
              type="button"
              onClick={handleAvailabilityBack}
              className="mb-4 inline-flex items-center gap-2 rounded-[10px] border border-[#C9A84C]/25 bg-[#C9A84C]/5 px-3 py-1.5 text-sm text-[#C9A84C] transition-colors duration-200 hover:border-[#C9A84C]/55 hover:bg-[#C9A84C]/10"
            >
              <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
              Tilbake
            </button>
            <h1 className="text-2xl font-bold">{pickerStep === "service" ? "Hva kan vi hjelpe dere med?" : "Velg bransje"}</h1>
            {pickerStep !== "service" && serviceChoice ? (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/60">
                <span>
                  Tjeneste: <span className="font-medium text-[#C9A84C]">{serviceLabelNb(serviceChoice)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFlowDirection(-1);
                    setPickerStep("service");
                  }}
                  className="text-sm font-medium text-[#C9A84C] underline underline-offset-2 transition-colors hover:text-[#dfc06a]"
                >
                  Endre
                </button>
              </p>
            ) : null}
            <AnimatePresence mode="wait" custom={flowDirection}>
              {pickerStep === "service" ? (
                <motion.div
                  key="service-step"
                  className="mt-5 space-y-8"
                  custom={flowDirection}
                  variants={slideVariants}
                  initial={reduceMotion ? false : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                >
                  <fieldset>
                    <legend className="text-base font-semibold text-white">Hva slags virksomhet er dere?</legend>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                      {REQUESTER_KIND_OPTIONS_NB.map((option) => (
                        <ServiceChoiceCard
                          key={option.key}
                          label={option.label}
                          blurb={option.blurb}
                          Icon={option.icon}
                          selected={requesterKind === option.key}
                          onSelect={() => handleRequesterKindSelect(option.key)}
                        />
                      ))}
                    </div>
                  </fieldset>
                  {requesterKind ? (
                    <fieldset>
                      <legend className="text-base font-semibold text-white">Hvilken tjeneste trenger dere?</legend>
                      <div
                        className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 ${
                          requesterKind === "agency" ? "lg:grid-cols-3" : "lg:grid-cols-4"
                        }`}
                      >
                        {serviceCardsFor(REQUEST_SERVICE_CARDS_NB, requesterKind).map((card) => (
                          <ServiceChoiceCard
                            key={card.key}
                            label={card.label}
                            blurb={card.blurb}
                            Icon={SERVICE_ICONS[card.key]}
                            selected={serviceChoice === card.key}
                            disabled={card.comingSoon}
                            onSelect={() => {
                              if (card.key !== "advertising") handleServiceSelect(card.key);
                            }}
                          />
                        ))}
                      </div>
                    </fieldset>
                  ) : null}
                </motion.div>
              ) : pickerStep === "industries" ? (
                <motion.div
                  key="industry-grid"
                  className="mt-5"
                  custom={flowDirection}
                  variants={slideVariants}
                  initial={reduceMotion ? false : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {CHECK_ROLE_GROUPS.map(({ industry, icon: Icon }, index) => {
                      const isSelected = selectedIndustry === industry;
                      return (
                        <PremiumIndustryCard
                          key={industry}
                          industry={industry}
                          Icon={Icon}
                          index={index}
                          selected={isSelected}
                          reduceMotion={reduceMotion}
                          onSelect={handlePremiumIndustrySelect}
                          candidateCount={industryCounts[industry] ?? null}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="role-search"
                  className="mx-auto mt-5 w-full max-w-2xl"
                  custom={flowDirection}
                  variants={slideVariants}
                  initial={reduceMotion ? false : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setFlowDirection(-1);
                      setSelectedIndustry("");
                      setSelectedRole(null);
                      setPickerStep("industries");
                      setRoleQuery("");
                    }}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#C9A84C] transition-colors hover:text-[#dfc06a]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Tilbake til bransjer
                  </button>
                  <h2 className="text-xl font-semibold text-white">Velg rolle</h2>
                  <p className="mt-1 text-sm text-white/50">Søk, eller velg fra listen nedenfor</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-1 text-xs font-medium text-[#C9A84C]">
                      <span>{industryLabel(selectedIndustry)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFlowDirection(-1);
                          setSelectedIndustry("");
                          setSelectedRole(null);
                          setPickerStep("industries");
                          setRoleQuery("");
                        }}
                        className="inline-flex items-center justify-center text-[#C9A84C]"
                        aria-label="Fjern valgt bransje"
                      >
                        <span className="text-sm">x</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                      <input
                        value={roleQuery}
                        onChange={(event) => setRoleQuery(event.target.value)}
                        placeholder="Søk etter en rolle ..."
                        className="w-full rounded-xl border border-white/10 bg-[#0D1B2A] py-3 pl-11 pr-4 text-white placeholder:text-white/55 outline-none ring-0 transition-[border,box-shadow] duration-200 focus:border-[#C9A84C]/60 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.14)]"
                      />
                    </div>
                  </div>
                  {filteredRoles.length > 0 ? (
                    <motion.div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredRoles.map((role, index) => {
                        const rc = roleCounts[role];
                        return (
                          <motion.button
                            key={role}
                            type="button"
                            onClick={() => {
                              setPartnerWizardToken(readPartnerWizardTokenFromSession());
                              setSelectedRole(role);
                              setPickerStep("modal");
                              setGetStartedEmail("");
                              setGetStartedGdpr(false);
                              setGetStartedError("");
                              setGetStartedStep("form");
                  setGetStartedOtp("");
                  setGetStartedVerificationId(null);
                  setOtpError("");
                            }}
                            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.03 }}
                            className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                              roleMatchesQueryExactly(role, roleQuery)
                                ? "border-[#C9A84C] bg-[#C9A84C]/10 font-medium text-[#C9A84C]"
                                : "border-white/10 bg-white/5 text-white/80 hover:border-[#C9A84C]/60 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className="block font-medium">{roleLabel(role)}</span>
                            {rc === null || rc === undefined ? (
                              <span className="mt-1 block text-xs text-white/55">...</span>
                            ) : isPublicCandidateCount(rc) ? (
                              <span className="mt-1 block text-xs font-medium text-[#C9A84C]/90">
                                {candidateAvailabilityLabel(rc, "role")}
                              </span>
                            ) : (
                              <span className="mt-1 block text-xs text-white/55">{candidateAvailabilityLabel(rc, "role")}</span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  ) : (
                    <p className="mt-4 text-sm text-white/55">Fant ingen roller. Prøv et annet søk.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

      </div>

      <AnimatePresence>
        {checkState === "idle" && pickerStep === "modal" && selectedRole ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10050] flex items-center justify-center overflow-x-hidden bg-[#0D1B2A]/90 px-4 backdrop-blur-md"
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              setPickerStep("roles");
              setSelectedRole(null);
              setGetStartedEmail("");
              setGetStartedGdpr(false);
              setGetStartedError("");
              setGetStartedStep("form");
        setGetStartedOtp("");
        setGetStartedVerificationId(null);
        setOtpError("");
            }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="relative w-full max-w-md rounded-[4px] border border-white/10 bg-[#0f1923] p-8 shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Lukk"
                onClick={() => {
                  setPickerStep("roles");
                  setSelectedRole(null);
                  setGetStartedEmail("");
                  setGetStartedGdpr(false);
                  setGetStartedError("");
                  setGetStartedStep("form");
                  setGetStartedOtp("");
                  setGetStartedVerificationId(null);
                  setOtpError("");
                }}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <span className="text-xl leading-none">×</span>
              </button>
              {getStartedStep === "otp" ? (
                <div className="mt-2 space-y-5 text-left">
                  <h3 className="pr-10 text-2xl font-bold text-white">Skriv inn bekreftelseskoden</h3>
                  <p className="text-sm leading-relaxed text-white/75">
                    Vi har sendt en 6-sifret kode til{" "}
                    <span className="break-all font-medium text-[#C9A84C]">{getStartedEmail}</span>. Koden er gyldig i 10
                    minutter.
                  </p>
                  <label className="block text-sm font-medium text-white/90" htmlFor="get-started-otp">
                    Bekreftelseskode
                  </label>
                  <input
                    id="get-started-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={getStartedOtp}
                    onChange={(event) => {
                      setGetStartedOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError("");
                    }}
                    placeholder="000000"
                    className="h-11 w-full rounded-[4px] border border-[#0D1B2A]/30 bg-[#0D1B2A] px-3 text-center text-lg tracking-[0.35em] text-white outline-none transition-colors placeholder:text-white/55 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                  />
                  {otpError ? <p className="text-sm text-red-400">{otpError}</p> : null}
                  <button
                    type="button"
                    onClick={() => void verifyGetStartedOtp()}
                    disabled={otpBusy || getStartedOtp.replace(/\D/g, "").length !== 6}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[4px] bg-[#C9A84C] px-6 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {otpBusy ? "Bekrefter …" : "Fortsett →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGetStartedStep("form");
                      setGetStartedOtp("");
                      setOtpError("");
                    }}
                    className="block w-full pt-1 text-left text-[13px] text-white/60 transition-colors hover:text-white/80"
                  >
                    ← Tilbake til e-post
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="pr-10 text-left text-2xl font-bold text-white">Kom i gang</h3>
                  <p className="mt-2 text-left text-sm leading-relaxed text-white/70">
                    Vi sender en bekreftelseskode til jobb-e-posten dere oppgir.
                  </p>
                  <p className="mt-2 text-left text-[12px] text-white/60">Valgt rolle: {roleLabel(selectedRole)}</p>
                  {serviceChoice ? (
                    <p className="mt-1 text-left text-[12px] text-white/60">Tjeneste: {serviceLabelNb(serviceChoice)}</p>
                  ) : null}
                  <div className="mt-6 space-y-4 text-left">
                    <label className="block text-sm font-medium text-white/90" htmlFor="get-started-email">
                      Jobb-e-post
                    </label>
                    <input
                      id="get-started-email"
                      type="email"
                      required
                      value={getStartedEmail}
                      onChange={(event) => {
                        setGetStartedEmail(event.target.value);
                        if (getStartedError) setGetStartedError("");
                      }}
                      placeholder="navn@bedrift.no"
                      className="h-11 w-full rounded-[4px] border border-[#0D1B2A]/30 bg-[#0D1B2A] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/55 focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                    />
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-white/85">
                      <input
                        type="checkbox"
                        checked={getStartedGdpr}
                        onChange={(e) => setGetStartedGdpr(e.target.checked)}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-white/30 text-[#C9A84C] focus:ring-[#C9A84C]"
                      />
                      <span>
                        Jeg bekrefter at jeg har fullmakt til å sende denne
                        forespørselen på vegne av bedriften min, og samtykker til at
                        kontaktopplysningene behandles i samsvar med{" "}
                        <a
                          href="https://arbeidmatch.no/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#C9A84C] underline underline-offset-2 hover:text-[#dfc06a]"
                        >
                          personvernerklæringen
                        </a>
                        .
                      </span>
                    </label>
                    {getStartedError ? <p className="text-sm text-red-400">{getStartedError}</p> : null}
                    <button
                      type="button"
                      onClick={() => void submitGetStartedOtpRequest()}
                      disabled={getStartedSubmitting || !getStartedGdpr || !getStartedEmail.includes("@")}
                      className="inline-flex rounded-[4px] bg-[#C9A84C] px-6 py-3 text-[15px] font-semibold text-[#0D1B2A] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {getStartedSubmitting ? "Sender …" : "Send kode"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerStep("roles");
                        setSelectedRole(null);
                        setGetStartedEmail("");
                        setGetStartedGdpr(false);
                        setGetStartedError("");
                        setGetStartedStep("form");
                        setGetStartedOtp("");
                        setGetStartedVerificationId(null);
                        setOtpError("");
                      }}
                      className="block w-full pt-1 text-left text-[13px] text-white/60 transition-colors hover:text-white/80"
                    >
                      ← Velg en annen rolle
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {showLeaveDialog && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-[10100] bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]"
            onClick={() => setShowLeaveDialog(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-leave-title"
            className="leave-dialog pointer-events-auto fixed left-1/2 top-1/2 z-[10101] w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowLeaveDialog(false);
              }}
              aria-label="Lukk dialogen"
              className="absolute right-3 top-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-white/55 transition-colors hover:text-[rgba(255,255,255,0.9)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
              <path d="M12 3v10m0 8h.01M5.2 20h13.6a1.2 1.2 0 0 0 1.04-1.8L13.04 5.4a1.2 1.2 0 0 0-2.08 0L4.16 18.2A1.2 1.2 0 0 0 5.2 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p id="request-leave-title" className="mt-4 text-center text-[20px] font-bold text-white">
              Vil dere avslutte søket?
            </p>
            <p className="mt-2 text-center text-sm leading-[1.6] text-[rgba(255,255,255,0.55)]">
              Dere er midt i en kandidatforespørsel. Hvis dere går nå, forsvinner det dere har fylt ut.
            </p>
            <div className="mt-7 flex flex-col gap-[10px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLeaveDialog(false);
                }}
                className="result-cta-primary w-full rounded-[12px] px-4 py-[14px] text-[15px] font-bold text-[#0D1B2A]"
              >
                Fortsett søket
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLeaveDialog(false);
                  const action = pendingLeaveAction;
                  setPendingLeaveAction(null);
                  resetToFirstStep();
                  if (!action) return;
                  if (action.type === "link") {
                    void router.push(action.href);
                    return;
                  }
                  allowNextNavigationRef.current = true;
                  router.back();
                }}
                className="w-full rounded-[12px] border border-[rgba(201,168,76,0.25)] bg-transparent px-4 py-[14px] text-[15px] text-[rgba(255,255,255,0.7)]"
              >
                Avslutt søket
              </button>
            </div>
          </div>
        </>
      )}

      {resultAction === "partner" && (
        <>
          <div
            role="presentation"
            className="partner-modal-backdrop fixed inset-0 z-[10100] bg-[rgba(0,0,0,0.75)] backdrop-blur-[6px]"
            onClick={() => {
              setResultAction("none");
              setAccessStatus("idle");
              setPartnerModalView("not_found");
              setAccessErrorMessage("");
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-verify-title"
            className="partner-modal pointer-events-auto fixed left-1/2 top-1/2 z-[10101] max-h-[90vh] w-[90%] max-w-[480px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10 isolation-isolate"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setResultAction("none");
                setAccessStatus("idle");
                setPartnerModalView("not_found");
                setAccessErrorMessage("");
              }}
              aria-label="Lukk partnerverifiseringen"
              className="absolute right-3 top-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-white/55 transition-colors hover:text-[rgba(255,255,255,0.9)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            <p id="partner-verify-title" className="mt-1 text-center text-2xl font-bold text-white">
              Partnertilgang
            </p>
            <p className="mt-2 text-center text-sm leading-relaxed text-white/60">
              {accessStatus === "idle" || accessStatus === "submitting"
                ? partnerOtpStep === "otp"
                  ? "Skriv inn den 6-sifrede koden vi sendte på e-post."
                  : "Skriv inn e-postadressen som er registrert som partner, for å fortsette."
                : null}
            </p>

            {accessStatus === "submitting" ? (
              <div className={`loading-screen mt-6 text-center ${isLoadingExit ? "loading-exit" : ""}`}>
                <svg viewBox="0 0 64 64" className="loading-shield mx-auto h-12 w-12 text-[#C9A84C]" fill="none" aria-hidden>
                  <path d="M32 8 14 15v13c0 13 8.2 24.8 18 28 9.8-3.2 18-15 18-28V15L32 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path className="shield-check" d="m24 33 6 6 11-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-5 text-[17px] font-bold text-white">
                  Sjekker partnertilgang
                  <span className="dot dot-1">.</span>
                  <span className="dot dot-2">.</span>
                  <span className="dot dot-3">.</span>
                </p>
                <p className="mt-2 text-[13px] leading-[1.6] text-white/60">
                  Vi sjekker bedriften deres mot partnerregisteret vårt.
                </p>
                <div className="mt-6 h-[2px] w-full rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div className="loading-progress-fill h-full rounded-full bg-[#C9A84C]" />
                </div>
              </div>
            ) : accessStatus === "partner" && partnerOtpStep === "otp" ? (
              <div className="mt-6 space-y-4">
                <p className="text-center text-sm text-white/70">
                  Koden er sendt til{" "}
                  <span className="font-medium text-[#C9A84C]">{accessEmail}</span>
                  {companyName ? (
                    <>
                      {" "}
                      for <span className="font-medium text-white">{companyName}</span>
                    </>
                  ) : null}
                  .
                </p>
                <form onSubmit={(event) => void verifyPartnerOtp(event)} className="space-y-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={partnerOtp}
                    onChange={(event) => {
                      setPartnerOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError("");
                    }}
                    placeholder="000000"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-center text-lg tracking-[0.35em] text-[15px] text-white placeholder:text-white/55 focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  {otpError ? <p className="text-center text-sm text-red-300">{otpError}</p> : null}
                  <button
                    type="submit"
                    disabled={otpBusy || partnerOtp.replace(/\D/g, "").length !== 6}
                    className="w-full rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {otpBusy ? "Bekrefter …" : "Fortsett →"}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setPartnerOtpStep("email");
                    setPartnerOtp("");
                    setOtpError("");
                    setAccessStatus("idle");
                  }}
                  className="w-full text-center text-xs text-white/50 hover:text-white/75"
                >
                  ← Bruk en annen e-postadresse
                </button>
              </div>
            ) : accessStatus === "error" || accessStatus === "non_partner" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <p className="mb-1 font-semibold text-white">Vi fant ikke denne e-postadressen.</p>
                <p className="mb-4 text-sm text-white/50">
                  Adressen er ikke registrert som partnerkonto. Kanskje det er en skrivefeil, eller så er dere ikke i nettverket vårt ennå.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={resetEmail}
                    className="w-full rounded-xl border border-white/10 bg-white/10 py-2 text-sm text-white hover:bg-white/20"
                  >
                    ← Prøv en annen e-postadresse
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResultAction("none");
                      setAccessStatus("idle");
                      setAccessErrorMessage("");
                      setPartnerModalView("not_found");
                      setPickerStep("industries");
                      setSelectedIndustry("");
                      setSelectedRole(null);
                      setRoleQuery("");
                      setCheckState("idle");
                    }}
                    className="w-full rounded-xl border border-[#C9A84C]/45 py-2 text-sm font-semibold text-[#C9A84C] hover:bg-[#C9A84C]/10"
                  >
                    Vi er nye
                  </button>
                  <a
                    href="/recruiter-network"
                    className="w-full rounded-xl bg-[#C9A84C] py-2 text-center text-sm font-semibold text-[#0D1B2A]"
                  >
                    Bli med i rekrutterernettverket
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 space-y-4">
                <form onSubmit={sendPartnerOtp} className="space-y-3">
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(event) => setAccessEmail(event.target.value)}
                    placeholder="navn@bedrift.no"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-[15px] text-white placeholder:text-white/55 focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  {otpError && partnerOtpStep === "email" ? (
                    <p className="text-center text-sm text-red-300">{otpError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!accessEmail.includes("@") || !verifyCanResend || otpBusy}
                    className={`w-full rounded-[12px] px-5 py-3 text-sm font-bold ${
                      verifyCanResend && accessEmail.includes("@")
                        ? "bg-[#C9A84C] text-[#0D1B2A]"
                        : "cursor-not-allowed bg-white/10 text-white/55"
                    }`}
                  >
                    {verifyCountdown > 0 ? `Send på nytt om ${verifyCountdown} s` : "Send kode →"}
                  </button>
                </form>
                <p className="text-center text-xs leading-relaxed text-white/60">
                  Ikke partner ennå? Søk på{" "}
                  <a
                    href="https://www.arbeidmatch.no/recruiter-network"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C9A84C] text-xs underline-offset-2 hover:underline"
                  >
                    arbeidmatch.no/recruiter-network
                  </a>
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showPartnerApplicationModal && (
        <>
          <div
            role="presentation"
            className="partner-modal-backdrop fixed inset-0 z-[10100] bg-[rgba(0,0,0,0.75)] backdrop-blur-[6px]"
            onClick={() => setShowPartnerApplicationModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="partner-modal pointer-events-auto fixed left-1/2 top-1/2 z-[10101] w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10 isolation-isolate"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPartnerApplicationModal(false);
              }}
              aria-label="Lukk partnersøknaden"
              className="absolute right-3 top-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-white/55 transition-colors hover:text-[rgba(255,255,255,0.9)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            {partnerApplicationStatus === "success" ? (
              <div className="text-center">
                <svg className="mx-auto h-7 w-7 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-4 text-[20px] font-bold text-white">Sjekk innboksen</p>
                <p className="mt-2 text-[14px] leading-[1.6] text-[rgba(255,255,255,0.55)]">
                  Vi har sendt en lenke der dere kan fullføre søknaden.
                </p>
                <p className="mt-2 text-[13px] leading-[1.6] text-white/60">{partnerApplicationEmail}</p>
                <p className="mt-4 text-[12px] text-white/55">Det kan ta opptil 5 minutter før e-posten kommer frem.</p>
              </div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
                  <path d="M3 20h18M5.5 20V8.5L12 4l6.5 4.5V20M9 20v-4h6v4M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-[14px] text-center text-[20px] font-bold text-white">Partnersøknad</p>
                <p className="mt-2 text-center text-[14px] leading-[1.6] text-[rgba(255,255,255,0.55)]">
                  Oppgi bedriftens e-postadresse for å komme i gang. Private e-postadresser godtas ikke.
                </p>
                <form onSubmit={startPartnerApplication} className="mt-5">
                  <input
                    type="email"
                    value={partnerApplicationEmail}
                    onChange={(event) => setPartnerApplicationEmail(event.target.value)}
                    placeholder="navn@bedrift.no"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-[15px] text-white placeholder:text-white/55 focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  {partnerApplicationError ? (
                    <div className="mt-3">
                      <p className="text-[13px] text-red-300">{partnerApplicationError}</p>
                      {partnerApplicationError === COMPANY_EMAIL_REQUIRED_MESSAGE ? (
                        <a href="/contact" className="text-[#C9A84C] text-xs hover:underline mt-1 inline-block">
                          Trenger dere hjelp? Kontakt oss →
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!partnerApplicationEmail.includes("@") || partnerApplicationStatus === "submitting" || !partnerApplicationCanResend}
                    className={`mt-3 w-full rounded-[12px] px-5 py-3 text-sm font-bold ${
                      partnerApplicationCanResend ? "bg-[#C9A84C] text-[#0D1B2A]" : "bg-white/10 text-white/55 cursor-not-allowed"
                    }`}
                  >
                    {partnerApplicationStatus === "submitting"
                      ? "Sender ..."
                      : partnerApplicationCountdown > 0
                        ? `Send på nytt om ${partnerApplicationCountdown} s`
                        : "Send e-post på nytt"}
                  </button>
                </form>
              </>
            )}
          </div>
        </>
      )}

      {/* Privacy notice modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-[4px] border border-white/10 bg-[#0f1923] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Personvernerklæring</h3>
                <button
                  type="button"
                  aria-label="Lukk"
                  onClick={() => setShowPrivacyModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                {privacyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-[#C9A84C]" />
                  </div>
                ) : privacyContent ? (
                  <div className="prose prose-sm prose-invert max-w-none text-white/80">
                    <div dangerouslySetInnerHTML={{ __html: privacyContent.replace(/\n/g, "<br />") }} />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm leading-relaxed text-white/80">
                    <p>
                      <strong className="text-white">Behandlingsansvarlig:</strong> ArbeidMatch Norge AS, org.nr. 935 667 089
                    </p>
                    <p>
                      Vi samler inn og behandler personopplysninger (navn, e-post, CV og arbeidserfaring) for å matche kandidater med arbeidsgivere og levere rekrutteringstjenester i Norge.
                    </p>
                    <p>
                      <strong className="text-white">Behandlingsgrunnlag:</strong> Samtykke (GDPR art. 6 nr. 1 bokstav a) og berettiget interesse for rekrutteringsmatching.
                    </p>
                    <p>
                      <strong className="text-white">Dine rettigheter:</strong> Innsyn, retting, sletting, dataportabilitet og tilbaketrekking av samtykke når som helst.
                    </p>
                    <p>
                      <strong className="text-white">Lagring:</strong> Opplysningene lagres så lenge rekrutteringen pågår og inntil 2 år etter siste aktivitet, med mindre du ber om sletting.
                    </p>
                    <p>
                      <strong className="text-white">Kontakt:</strong> post@arbeidmatch.no
                    </p>
                    <p className="pt-2">
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="font-medium text-[#C9A84C] underline underline-offset-2 hover:text-[#dfc06a]"
                      >
                        Les hele personvernerklæringen →
                      </Link>
                    </p>
                  </div>
                )}
              </div>
              <div className="border-t border-white/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(false)}
                  className="inline-flex rounded-[4px] bg-[#C9A84C] px-6 py-2 text-sm font-semibold text-[#0D1B2A] transition-opacity hover:opacity-95"
                >
                  Lukk
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .result-cta-primary {
          background: linear-gradient(135deg, #c9a84c, #b8953f);
          transition: filter 200ms ease, transform 200ms ease;
        }
        .result-cta-secondary {
          transition: border-color 200ms ease, color 200ms ease;
        }
        .result-cta-primary:hover {
          filter: brightness(1.08);
          transform: scale(1.02);
        }
        .result-cta-secondary:hover {
          border-color: rgba(201, 168, 76, 0.5);
          color: #ffffff;
        }
        .request-option-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          height: 100%;
          min-height: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 16px;
          padding: 32px;
          text-align: left;
          min-height: 480px;
          transition: border-color 200ms ease, background 200ms ease, transform 200ms ease;
        }
        .request-option-benefits {
          list-style: none;
          margin: 0;
          padding: 0;
          width: 100%;
        }
        .spinner-arc {
          width: 20px;
          height: 20px;
          color: #ffffff;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes optionIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes partnerFormIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes partnerSuccessIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes leaveDialogIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes modalBackdropIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes partnerModalIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes drawCheck {
          from {
            stroke-dashoffset: 100;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes shieldPulse {
          0% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.6;
          }
        }
        @keyframes dotPulse {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 90%;
          }
        }
        .shield-check {
          stroke-dasharray: 100;
          stroke-dashoffset: 0;
        }
        .dot {
          display: inline-block;
          opacity: 0.2;
        }
        .dot-1,
        .dot-2,
        .dot-3 {
          margin-left: 1px;
        }
        .loading-progress-fill {
          width: 60%;
        }
        .loading-screen {
          opacity: 1;
          transition: opacity 200ms ease;
        }
        .loading-screen.loading-exit {
          opacity: 0;
        }
        .not-found-panel {
          opacity: 1;
          transform: translateY(0);
        }
        .not-found-panel.not-found-exit {
          opacity: 0;
        }
        .waitlist-success-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(201, 168, 76, 0.2);
          border-top: 2px solid rgba(201, 168, 76, 0.4);
          border-radius: 16px;
          padding: 32px 28px;
          max-width: 420px;
          margin: 0 auto;
          text-align: center;
        }
        @media (prefers-reduced-motion: no-preference) {
          .partner-form-enter {
            animation: partnerFormIn 300ms ease both;
          }
          .partner-success-enter {
            animation: partnerSuccessIn 300ms ease both;
          }
          .request-option-card:hover {
            border-color: rgba(201, 168, 76, 0.6);
            background: rgba(255, 255, 255, 0.08);
            transform: scale(1.02);
          }
          .leave-dialog {
            animation: leaveDialogIn 250ms ease both;
          }
          .partner-modal-backdrop {
            animation: modalBackdropIn 200ms ease both;
          }
          .partner-modal {
            animation: partnerModalIn 280ms ease both;
          }
          .not-found-panel {
            animation: notFoundIn 250ms ease both;
          }
          .waitlist-success-card {
            animation: waitlistSuccessIn 300ms ease both;
          }
          .loading-shield {
            animation: shieldPulse 2s ease-in-out infinite;
          }
          .shield-check {
            stroke-dashoffset: 100;
            animation: drawCheck 1.2s ease-in-out infinite alternate;
          }
          .dot-1 {
            animation: dotPulse 1s ease-in-out 0s infinite;
          }
          .dot-2 {
            animation: dotPulse 1s ease-in-out 0.3s infinite;
          }
          .dot-3 {
            animation: dotPulse 1s ease-in-out 0.6s infinite;
          }
          .loading-progress-fill {
            width: 0%;
            animation: progressFill 3s ease-out forwards;
          }
        }
        @keyframes notFoundIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes waitlistSuccessIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 768px) {
          .request-option-card {
            padding: 24px;
          }
        }
      `}</style>
    </section>
  );
}
