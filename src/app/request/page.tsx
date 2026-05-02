"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Bolt,
  Briefcase,
  Check,
  Clock,
  Factory,
  Handshake,
  HardHat,
  HeartPulse,
  Search,
  Ship,
  Sparkles,
  TrendingUp,
  Truck,
  Wrench,
  Zap,
} from "lucide-react";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import {
  trackPartnerAccessRequest,
  trackRareProfileView,
  trackRequestStart,
  trackRequestStepComplete,
  trackRequestSubmit,
} from "@/lib/analytics/requestEvents";
import { clearPartnerRequestContext, writePartnerRequestContext } from "@/lib/partnerRequestContext";
import { useToast } from "@/lib/toast-context";

type VerifyPartnerResponse = {
  verified?: boolean;
  company_name?: string;
  reason?: string;
};

const CHECK_ROLE_GROUPS: Array<{ industry: string; icon: LucideIcon; roles: string[] }> = [
  {
    industry: "Construction & Civil",
    icon: HardHat,
    roles: ["Site Manager", "Carpenter", "Bricklayer", "Concrete Worker", "Scaffolder", "Painter", "Roofer", "Civil Engineer"],
  },
  {
    industry: "Electrical & Technical",
    icon: Zap,
    roles: ["Electrician", "DSB Authorized Electrician", "Plumber", "HVAC Technician", "Automation Engineer", "Welder", "Pipefitter"],
  },
  {
    industry: "Logistics & Transport",
    icon: Truck,
    roles: ["Truck Driver", "Forklift Operator", "Warehouse Worker", "Logistics Coordinator", "Bus Driver", "Crane Operator"],
  },
  {
    industry: "Industry & Production",
    icon: Factory,
    roles: ["Machine Operator", "CNC Operator", "Steel Worker", "Insulation Worker", "Quality Inspector", "Production Worker"],
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
  {
    industry: "Automotive & Mechanics",
    icon: Wrench,
    roles: [
      "Auto Mechanic",
      "Body Repair Technician",
      "Auto Electrician",
      "Diagnostic Technician",
      "Tire Specialist",
      "Heavy Equipment Mechanic",
    ],
  },
  {
    industry: "Offshore & Onshore",
    icon: Ship,
    roles: [
      "Offshore Worker",
      "Rigger",
      "Driller",
      "Roustabout",
      "Onshore Operator",
      "Pipeline Technician",
      "BOSIET Certified Worker",
    ],
  },
  {
    industry: "Other / General Labour",
    icon: Briefcase,
    roles: ["General Labourer", "Construction Helper", "Warehouse Helper", "Production Assistant", "Other (specify)"],
  },
];

const REQUEST_PARTNER_VERIFIED_KEY = "am_request_partner_verified";
const REQUEST_PARTNER_COMPANY_KEY = "am_request_partner_company";

const SEARCH_MESSAGES = [
  "Connecting to candidate database...",
  "Searching registered profiles...",
  "Analyzing role relevance...",
  "Reviewing availability...",
  "Finalizing profile count...",
];

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
          <p className={`text-base tracking-tight ${selected ? "font-semibold text-white" : "font-semibold text-white/90"}`}>{industry}</p>
          {candidateCount === null ? (
            <p className="mt-1 text-sm text-white/40">...</p>
          ) : candidateCount === 0 ? (
            <p className="mt-1 text-sm text-white/60">We source on request</p>
          ) : (
            <p className="mt-1 text-sm font-medium text-[#C9A84C]">{candidateCount} candidates available</p>
          )}
        </div>
      </div>
    </motion.button>
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

  const [checkState, setCheckState] = useState<"partner_check" | "idle" | "searching" | "result">("partner_check");
  const [verifiedPartnerCompany, setVerifiedPartnerCompany] = useState<string | null>(null);
  const [industryCounts, setIndustryCounts] = useState<Record<string, number | null>>({});
  const [partnerSessionHydrated, setPartnerSessionHydrated] = useState(false);
  const partnerVerifyFromRef = useRef<"partner_check" | "result">("result");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [pendingIndustry, setPendingIndustry] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessageIndex, setSearchMessageIndex] = useState(0);
  const [checkCount, setCheckCount] = useState(0);
  const [showAccessCheck, setShowAccessCheck] = useState(false);

  const [accessEmail, setAccessEmail] = useState("");
  const [accessStatus, setAccessStatus] = useState<"idle" | "submitting" | "partner" | "non_partner" | "error">("idle");
  const [companyName, setCompanyName] = useState("");
  const [accessErrorMessage, setAccessErrorMessage] = useState("");

  const [selectedOption, setSelectedOption] = useState<null | "premium" | "pay-per-use">(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [resultAction, setResultAction] = useState<"none" | "partner" | "non_partner">("none");
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
  const [showWorkTogetherInlineModal, setShowWorkTogetherInlineModal] = useState(false);
  const [workTogetherEmail, setWorkTogetherEmail] = useState("");
  const [workTogetherError, setWorkTogetherError] = useState("");
  const [workTogetherStatus, setWorkTogetherStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [workTogetherCountdown, setWorkTogetherCountdown] = useState(0);
  const [workTogetherCanResend, setWorkTogetherCanResend] = useState(true);
  const [waitlistCountdown, setWaitlistCountdown] = useState(0);
  const [waitlistCanResend, setWaitlistCanResend] = useState(true);
  const [verifyCountdown, setVerifyCountdown] = useState(0);
  const [verifyCanResend, setVerifyCanResend] = useState(true);
  const [partnerApplicationCountdown, setPartnerApplicationCountdown] = useState(0);
  const [partnerApplicationCanResend, setPartnerApplicationCanResend] = useState(true);
  const [flowDirection, setFlowDirection] = useState(1);
  const [industryPreview, setIndustryPreview] = useState("");
  const [optionsDirection, setOptionsDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const hasMountedHistoryGuard = useRef(false);
  const allowNextNavigationRef = useRef(false);
  const hasAutoStartedRoleCheck = useRef(false);
  /** Bumped on reset / back so in-flight `runCandidateSearch` cannot apply after leaving the flow. */
  const candidateSearchGenerationRef = useRef(0);
  const rareProfileTrackedRef = useRef(false);
  const industryAdvanceTimerRef = useRef<number | null>(null);

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
    const query = roleQuery.trim().toLowerCase();
    if (!query) return group.roles.slice(0, 8);
    const startsWith = group.roles.filter((role) => role.toLowerCase().startsWith(query));
    const contains = group.roles.filter(
      (role) => role.toLowerCase().includes(query) && !role.toLowerCase().startsWith(query),
    );
    return [...startsWith, ...contains].slice(0, 8);
  }, [roleQuery, selectedIndustry]);

  useEffect(() => {
    if (selectedIndustry) {
      setPendingIndustry(selectedIndustry);
      return;
    }
    setPendingIndustry("");
  }, [selectedIndustry]);

  useEffect(() => {
    return () => {
      if (industryAdvanceTimerRef.current) {
        window.clearTimeout(industryAdvanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(REQUEST_PARTNER_VERIFIED_KEY) === "1") {
        const name = (window.localStorage.getItem(REQUEST_PARTNER_COMPANY_KEY) || "").trim();
        setVerifiedPartnerCompany(name || "Partner");
        setCheckState("idle");
      }
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
    if (checkState !== "idle") return true;
    if (selectedIndustry.trim()) return true;
    if (roleQuery.trim()) return true;
    if (searchTerm.trim()) return true;
    if (resultAction !== "none") return true;
    if (accessStatus === "non_partner") return true;
    return false;
  }, [accessStatus, checkState, resultAction, roleQuery, searchTerm, selectedIndustry]);

  useEffect(() => {
    if (checkState !== "searching") return;
    const interval = setInterval(() => {
      setSearchMessageIndex((prev) => (prev + 1) % SEARCH_MESSAGES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkState]);

  useEffect(() => {
    const industry = selectedIndustry.trim();
    const role = (searchTerm.trim() || roleQuery.trim()).trim();
    if (!industry && !role) return;
    writePartnerRequestContext(industry, role);
  }, [selectedIndustry, searchTerm, roleQuery]);

  const runCandidateSearch = async (roleInput: string, industryOverride?: string) => {
    const role = roleInput.trim();
    if (role.length < 2) return;
    const generation = ++candidateSearchGenerationRef.current;
    const industryForCount = (industryOverride ?? selectedIndustry).trim();
    const analyticsCategory = industryForCount || role;
    setSearchTerm(role);
    setAccessStatus("idle");
    setSelectedOption(null);
    setNotifyEmail("");
    setNotifyStatus("idle");
    setWaitlistCountdown(0);
    setWaitlistCanResend(true);
    setResultAction("none");
    setFlowDirection(1);
    setCheckState("searching");
    setSearchMessageIndex(0);
    rareProfileTrackedRef.current = false;
    trackRequestStart(analyticsCategory);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    if (generation !== candidateSearchGenerationRef.current) return;
    let nextCount = 0;
    try {
      const params = new URLSearchParams();
      params.set("role", role);
      const response = await fetch(`/api/candidate-count?${params.toString()}`);
      const data = (await response.json()) as { count?: number };
      nextCount =
        typeof data.count === "number" && Number.isFinite(data.count) && data.count >= 0 ? data.count : 0;
    } catch {
      nextCount = 0;
    }
    setCheckCount(nextCount);
    setShowAccessCheck(true);
    setFlowDirection(1);
    setCheckState("result");
    trackRequestStepComplete(1, analyticsCategory);
  };

  const handlePremiumIndustrySelect = useCallback((industry: string) => {
    if (industryAdvanceTimerRef.current) {
      window.clearTimeout(industryAdvanceTimerRef.current);
    }
    setFlowDirection(1);
    setIndustryPreview(industry);
    setRoleQuery("");
    industryAdvanceTimerRef.current = window.setTimeout(() => {
      setSelectedIndustry(industry);
      setIndustryPreview("");
      industryAdvanceTimerRef.current = null;
    }, 350);
  }, []);

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
      setSelectedIndustry(matchingIndustry);
    }
    setRoleQuery(roleFromQuery);
    void runCandidateSearch(roleFromQuery, matchingIndustry);
  }, [partnerSessionHydrated]);

  const verifyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!verifyCanResend) return;
    if (!accessEmail.includes("@")) {
      toast.error("Please enter a valid company email address.");
      return;
    }
    setAccessStatus("submitting");
    setAccessErrorMessage("");
    setIsLoadingExit(false);
    try {
      const response = await fetch("/api/verify-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessEmail.trim().toLowerCase() }),
      });
      const data = (await response.json()) as VerifyPartnerResponse;
      let nextStatus: "partner" | "non_partner";
      if (response.ok && data.verified) {
        setCompanyName(data.company_name || "your company");
        nextStatus = "partner";
        startCountdown(setVerifyCountdown, setVerifyCanResend);
        trackRequestSubmit(selectedIndustry || searchTerm || "unknown", checkCount);
        toast.success("Partner verified. Check your inbox for secure access.");
        if (partnerVerifyFromRef.current === "partner_check") {
          try {
            window.localStorage.setItem(REQUEST_PARTNER_VERIFIED_KEY, "1");
            window.localStorage.setItem(REQUEST_PARTNER_COMPANY_KEY, data.company_name || "");
          } catch {
            /* ignore */
          }
          setVerifiedPartnerCompany((data.company_name || "").trim() || "Partner");
          setIsLoadingExit(true);
          await new Promise((resolve) => setTimeout(resolve, 200));
          setResultAction("none");
          setAccessStatus("idle");
          setAccessEmail("");
          setPartnerModalView("not_found");
          setAccessErrorMessage("");
          setIsLoadingExit(false);
          setCheckState("idle");
          partnerVerifyFromRef.current = "result";
          return;
        }
      } else if (data.reason === "personal_email") {
        setAccessErrorMessage("email_not_recognized");
        setIsLoadingExit(true);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setAccessStatus("error");
        setIsLoadingExit(false);
        return;
      } else {
        setAccessErrorMessage("email_not_recognized");
        setIsLoadingExit(true);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setAccessStatus("error");
        setIsLoadingExit(false);
        return;
      }
      setIsLoadingExit(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAccessStatus(nextStatus);
      setIsLoadingExit(false);
    } catch {
      setAccessErrorMessage("Could not check access right now. Please try again.");
      toast.error("Could not verify partner access right now.");
      setIsLoadingExit(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAccessStatus("error");
      setIsLoadingExit(false);
    }
  };

  const resetEmail = () => {
    setAccessEmail("");
    setAccessErrorMessage("");
    setAccessStatus("idle");
    setIsLoadingExit(false);
  };

  const submitFeatureWaitlist = async () => {
    if (!notifyEmail.includes("@") || !selectedOption || !waitlistCanResend) {
      toast.error("Please provide a valid email before subscribing.");
      return;
    }
    setNotifyStatus("submitting");
    try {
      const response = await fetch("/api/feature-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: notifyEmail.trim().toLowerCase(),
          feature: `pricing-${selectedOption}`,
          consent: true,
        }),
      });
      if (response.ok) {
        setNotifyStatus("success");
        startCountdown(setWaitlistCountdown, setWaitlistCanResend);
        toast.info("You are subscribed. We'll notify you when this opens.");
      } else {
        setNotifyStatus("error");
        toast.error("Could not save your subscription right now.");
      }
    } catch {
      setNotifyStatus("error");
      toast.error("Could not save your subscription right now.");
    }
  };

  const submitWorkTogetherEmail = async () => {
    if (!workTogetherCanResend) return;
    const email = workTogetherEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setWorkTogetherError("Please use your company email address.");
      setWorkTogetherStatus("error");
      return;
    }

    const personalDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "live.com",
      "msn.com",
      "aol.com",
      "mail.com",
      "protonmail.com",
      "ymail.com",
      "googlemail.com",
    ];
    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain || personalDomains.includes(domain)) {
      setWorkTogetherError("Please use your company email address.");
      return;
    }

    setWorkTogetherError("");
    setWorkTogetherStatus("submitting");
    try {
      const jobSummary =
        searchTerm.trim() || selectedIndustry.trim() || "General hiring inquiry";
      const response = await fetch("/api/simple-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: "Employer",
          last_name: "Request",
          company: "To be completed",
          phone: "000000",
          job_summary: jobSummary,
          howDidYouHear: "website-request",
          gdprConsent: true,
        }),
      });
      const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
      if (!response.ok || !data?.success) {
        setWorkTogetherError("Could not send the link. Please try again.");
        setWorkTogetherStatus("error");
        return;
      }
      setWorkTogetherStatus("success");
      startCountdown(setWorkTogetherCountdown, setWorkTogetherCanResend);
    } catch {
      setWorkTogetherError("Could not send the link. Please try again.");
      setWorkTogetherStatus("error");
    }
  };

  const handleAvailabilityBack = () => {
    if (checkState === "partner_check") {
      navigateBackOrHome();
      return;
    }
    if (selectedIndustry) {
      setFlowDirection(-1);
      setIndustryPreview("");
      setSelectedIndustry("");
      setRoleQuery("");
      return;
    }
    navigateBackOrHome();
  };

  const backToRoleSearch = () => {
    candidateSearchGenerationRef.current += 1;
    setFlowDirection(-1);
    setCheckState("idle");
    setSearchTerm("");
    setCheckCount(0);
    setShowAccessCheck(false);
    setAccessStatus("idle");
    setSelectedOption(null);
    setNotifyEmail("");
    setNotifyStatus("idle");
    setShowWorkTogetherInlineModal(false);
    setWorkTogetherEmail("");
    setWorkTogetherStatus("idle");
    setWorkTogetherCountdown(0);
    setWorkTogetherCanResend(true);
    setResultAction("none");
    setVerifyCountdown(0);
    setVerifyCanResend(true);
    setPartnerApplicationCountdown(0);
    setPartnerApplicationCanResend(true);
  };

  const resetToFirstStep = () => {
    candidateSearchGenerationRef.current += 1;
    if (industryAdvanceTimerRef.current) {
      window.clearTimeout(industryAdvanceTimerRef.current);
      industryAdvanceTimerRef.current = null;
    }
    setShowLeaveDialog(false);
    setFlowDirection(-1);
    setCheckState(verifiedPartnerCompany ? "idle" : "partner_check");
    setIndustryPreview("");
    setSelectedIndustry("");
    setRoleQuery("");
    setSearchTerm("");
    setSearchMessageIndex(0);
    setCheckCount(0);
    setShowAccessCheck(false);
    setAccessEmail("");
    setAccessStatus("idle");
    setAccessErrorMessage("");
    setCompanyName("");
    setSelectedOption(null);
    setNotifyEmail("");
    setNotifyStatus("idle");
    setWaitlistCountdown(0);
    setWaitlistCanResend(true);
    setShowWorkTogetherInlineModal(false);
    setWorkTogetherEmail("");
    setWorkTogetherStatus("idle");
    setWorkTogetherCountdown(0);
    setWorkTogetherCanResend(true);
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
  };

  const showNonPartnerOptions = resultAction === "non_partner";

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
      toast.error("Please enter a valid company email address.");
      return;
    }
    if (FREE_EMAIL_DOMAINS.has(domain)) {
      setPartnerApplicationError("Please use your company email address.");
      setPartnerApplicationStatus("error");
      toast.error("Please use your company email address.");
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
          setPartnerApplicationError("Please use your company email address.");
        } else if (data.reason === "table_missing") {
          setPartnerApplicationError("Partner applications are temporarily unavailable. Please try again shortly.");
        } else {
          setPartnerApplicationError("Could not start partner application right now.");
        }
        setPartnerApplicationStatus("error");
        toast.error("Could not start partner application right now.");
        return;
      }
      setPartnerApplicationStatus("success");
      startCountdown(setPartnerApplicationCountdown, setPartnerApplicationCanResend);
      toast.success("Application link sent. Please check your inbox.");
    } catch {
      setPartnerApplicationStatus("error");
      setPartnerApplicationError("Could not start partner application right now.");
      toast.error("Could not start partner application right now.");
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
        raw.closest(".partner-modal-backdrop") ||
        raw.closest(".request-options-overlay")
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
    if (!showNonPartnerOptions) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "auto";
    };
  }, [showNonPartnerOptions]);

  useEffect(() => {
    if (checkState !== "result" || rareProfileTrackedRef.current) return;
    if (checkCount <= 0 || checkCount >= 5) return;
    trackRareProfileView(selectedIndustry || searchTerm || "unknown", checkCount);
    rareProfileTrackedRef.current = true;
  }, [checkCount, checkState, searchTerm, selectedIndustry]);

  const currentMessage = SEARCH_MESSAGES[searchMessageIndex];
  const selectedRole = searchTerm;

  return (
    <section className="flex min-h-screen flex-col items-center bg-[#0D1B2A] px-4 py-6 text-white md:min-h-dvh md:px-6 md:py-10">
      {verifiedPartnerCompany ? (
        <div className="mx-auto mb-3 flex w-full max-w-sm justify-center md:max-w-[980px] md:justify-start">
          <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 px-3 py-1.5 text-xs font-medium text-[#C9A84C]">
            Verified partner
            <span className="truncate font-normal text-white/75">{verifiedPartnerCompany}</span>
          </span>
        </div>
      ) : null}
      <div
        className={`mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 md:max-w-[980px] md:rounded-[16px] md:p-9 ${
          checkState === "result"
            ? "md:max-w-[680px] md:border md:border-transparent md:bg-transparent"
            : "md:border-[rgba(201,168,76,0.15)] md:border-t-2 md:border-t-[rgba(201,168,76,0.4)] md:bg-[rgba(255,255,255,0.03)]"
        } ${
          showNonPartnerOptions ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        } ${checkState === "searching" ? "max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none" : ""}`}
      >
        {checkState === "partner_check" && (
          <>
            <button
              type="button"
              onClick={handleAvailabilityBack}
              className="mb-4 inline-flex items-center gap-2 rounded-[10px] border border-[#C9A84C]/25 bg-[#C9A84C]/5 px-3 py-1.5 text-sm text-[#C9A84C] transition-colors duration-200 hover:border-[#C9A84C]/55 hover:bg-[#C9A84C]/10"
            >
              <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
              Back
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
                <h1 className="text-2xl font-bold">Are you already an ArbeidMatch partner?</h1>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  Verified partners get instant access to candidate availability
                </p>
                <div className="mt-8 flex flex-col gap-3 md:flex-row md:gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      partnerVerifyFromRef.current = "partner_check";
                      setAccessErrorMessage("");
                      setPartnerModalView("not_found");
                      setAccessStatus("idle");
                      setResultAction("partner");
                      trackPartnerAccessRequest();
                    }}
                    className="h-14 w-full rounded-xl bg-[#C9A84C] text-base font-bold text-[#0D1B2A] md:flex-1"
                  >
                    Yes, I&apos;m a partner
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFlowDirection(1);
                      setCheckState("idle");
                    }}
                    className="h-14 w-full rounded-xl border border-[#C9A84C]/50 py-3 text-base font-semibold text-[#C9A84C] transition-colors hover:bg-[#C9A84C]/10 md:flex-1"
                  >
                    No, I&apos;m new
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
              Back
            </button>
            <h1 className="text-2xl font-bold">Check candidate availability</h1>
            <AnimatePresence mode="wait" custom={flowDirection}>
              {!selectedIndustry ? (
                <motion.div
                  key="industry-grid"
                  className="mt-5"
                  custom={flowDirection}
                  variants={slideVariants}
                  initial={reduceMotion ? false : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                >
                  <div className="lg:hidden">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <select
                        className="w-full rounded-xl border border-white/10 bg-[#0D1B2A] py-3 pl-11 pr-4 text-white placeholder:text-white/30 outline-none ring-0 transition-[border,box-shadow] duration-200 focus:border-[#C9A84C]/60 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.14)]"
                        value={pendingIndustry}
                        onChange={(event) => {
                          setPendingIndustry(event.target.value);
                        }}
                      >
                        <option value="">Select a role...</option>
                        {CHECK_ROLE_GROUPS.map(({ industry }) => {
                          const c = industryCounts[industry];
                          const suffix = c === null || c === undefined ? " …" : ` (${c})`;
                          return (
                            <option key={industry} value={industry}>
                              {industry}
                              {suffix}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                          if (!pendingIndustry) return;
                          setFlowDirection(1);
                          setIndustryPreview("");
                          setSelectedIndustry(pendingIndustry);
                        setRoleQuery("");
                      }}
                      disabled={!pendingIndustry}
                      className="mt-3 w-full rounded-xl bg-[#C9A84C] py-3 font-semibold text-[#0D1B2A] disabled:opacity-50"
                    >
                      Continue
                    </button>
                  </div>

                  <div className="hidden grid-cols-3 gap-4 lg:grid">
                    {CHECK_ROLE_GROUPS.map(({ industry, icon: Icon }, index) => {
                      const isSelected = (industryPreview || selectedIndustry) === industry;
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
                  <h2 className="text-xl font-semibold text-white">Select a Role</h2>
                  <p className="mt-1 text-sm text-white/50">Type to search or choose from the list below</p>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-1 text-xs font-medium text-[#C9A84C]">
                      <span>{selectedIndustry}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFlowDirection(-1);
                          setIndustryPreview("");
                          setSelectedIndustry("");
                          setRoleQuery("");
                        }}
                        className="inline-flex items-center justify-center text-[#C9A84C]"
                        aria-label="Clear selected industry"
                      >
                        <span className="text-sm">x</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <input
                        value={roleQuery}
                        onChange={(event) => setRoleQuery(event.target.value)}
                        placeholder="Search for a role..."
                        className="w-full rounded-xl border border-white/10 bg-[#0D1B2A] py-3 pl-11 pr-4 text-white placeholder:text-white/30 outline-none ring-0 transition-[border,box-shadow] duration-200 focus:border-[#C9A84C]/60 focus:shadow-[0_0_0_3px_rgba(201,168,76,0.14)]"
                      />
                    </div>
                  </div>
                  {filteredRoles.length > 0 ? (
                    <motion.div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {filteredRoles.map((role, index) => (
                        <motion.button
                          key={role}
                          type="button"
                          onClick={() => void runCandidateSearch(role)}
                          initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: reduceMotion ? 0 : 0.2, delay: reduceMotion ? 0 : index * 0.03 }}
                          className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                            roleQuery.trim().toLowerCase() === role.toLowerCase()
                              ? "border-[#C9A84C] bg-[#C9A84C]/10 font-medium text-[#C9A84C]"
                              : "border-white/10 bg-white/5 text-white/80 hover:border-[#C9A84C]/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {role}
                        </motion.button>
                      ))}
                    </motion.div>
                  ) : (
                    <p className="mt-4 text-sm text-[rgba(255,255,255,0.4)]">No roles found. Try a different search.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {checkState === "searching" && (
          <>
            <div className="fixed inset-0 z-50 bg-[#0D1B2A] flex flex-col items-center justify-center gap-6 md:hidden">
              <p className="text-[#C9A84C] text-xs font-semibold tracking-widest uppercase">SEARCHING FOR</p>
              <p className="text-white text-2xl font-bold">{selectedRole}</p>
              <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#C9A84C] animate-spin" />
              <p className="text-white/40 text-sm">{currentMessage}</p>
            </div>
            <div className="hidden flex-col items-center py-10 text-center md:flex">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Searching for</p>
              <p className="mb-6 mt-1 text-[1.1rem] font-bold text-white">{searchTerm}</p>
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#C9A84C]" />
              <p className="mt-5 text-sm text-[rgba(255,255,255,0.7)]">{SEARCH_MESSAGES[searchMessageIndex]}</p>
            </div>
          </>
        )}

        {checkState === "result" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1B2A] p-4 md:static md:min-h-[60vh] md:bg-transparent">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 md:w-[90%]"
            >
              <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
                {checkCount > 0 ? (
                  <div className="flex flex-col items-center gap-2">
                    <motion.span
                      className="text-7xl font-black leading-none text-[#C9A84C] md:text-8xl"
                      initial={reduceMotion ? false : { opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
                    >
                      {checkCount}
                    </motion.span>
                    <p className="text-base text-white/70">
                      <span className="font-semibold text-white">{searchTerm.trim() || "This role"}</span> profiles in
                      our database
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C]/10">
                      <Search className="h-8 w-8 text-[#C9A84C]" aria-hidden />
                    </div>
                    <p className="text-lg font-semibold text-white">We can source this role for you</p>
                    <p className="text-sm text-white/50">
                      We&apos;ll find the right {searchTerm.trim() || "candidate"} for your team
                    </p>
                  </div>
                )}

                <div className="h-px w-full bg-white/10" />

                <div className="flex w-full max-w-sm flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkTogetherEmail("");
                      setWorkTogetherError("");
                      setWorkTogetherStatus("idle");
                      setWorkTogetherCanResend(true);
                      setWorkTogetherCountdown(0);
                      setShowWorkTogetherInlineModal(true);
                    }}
                    className="w-full rounded-xl bg-[#C9A84C] py-4 text-base font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
                  >
                    Get started →
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    candidateSearchGenerationRef.current += 1;
                    if (industryAdvanceTimerRef.current) {
                      window.clearTimeout(industryAdvanceTimerRef.current);
                      industryAdvanceTimerRef.current = null;
                    }
                    setIndustryPreview("");
                    setPendingIndustry("");
                    setSelectedIndustry("");
                    setRoleQuery("");
                    setSearchTerm("");
                    setCheckState("idle");
                    setCheckCount(0);
                    setShowAccessCheck(false);
                    setShowWorkTogetherInlineModal(false);
                    setResultAction("none");
                    setFlowDirection(-1);
                  }}
                  className="text-xs text-white/30 transition-colors hover:text-white/60"
                >
                  ← Search another role
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWorkTogetherInlineModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1B2A]/95 px-4 backdrop-blur-md"
            onClick={(event) => {
              if (event.target !== event.currentTarget) return;
              setShowWorkTogetherInlineModal(false);
            }}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 text-center"
              onClick={(event) => event.stopPropagation()}
            >
              {workTogetherStatus === "success" ? (
                <p className="text-sm leading-relaxed text-white/80">
                  Check your inbox - we&apos;ve sent you a link to continue your request.
                </p>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-white">Get started</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/65">
                    Enter your work email and we&apos;ll send you a secure link to continue.
                  </p>
                  <div className="mt-5 space-y-3 text-left">
                    <input
                      type="email"
                      value={workTogetherEmail}
                      onChange={(event) => {
                        setWorkTogetherEmail(event.target.value);
                        if (workTogetherError) setWorkTogetherError("");
                        if (workTogetherStatus === "error") setWorkTogetherStatus("idle");
                      }}
                      placeholder="your@company.com"
                      className="h-12 w-full rounded-xl border border-white/15 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#C9A84C]/60"
                    />
                    {workTogetherError || workTogetherStatus === "error" ? (
                      <p className="text-sm text-red-400">
                        {workTogetherError || "Could not send the link. Please try again."}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void submitWorkTogetherEmail()}
                      disabled={
                        workTogetherStatus === "submitting" ||
                        !workTogetherEmail.includes("@") ||
                        !workTogetherCanResend
                      }
                      className="w-full rounded-xl bg-[#C9A84C] py-4 text-base font-bold text-[#0D1B2A] transition-colors hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send link →
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {showNonPartnerOptions && (
        <div className="request-options-overlay">
          <div className="request-options-panel flex min-h-[100dvh] w-full flex-col items-center justify-center px-5 py-12">
            <AnimatePresence mode="wait" custom={optionsDirection}>
              {selectedOption == null ? (
                <motion.div
                  key="access-options"
                  className="w-full max-w-[1200px]"
                  custom={optionsDirection}
                  variants={slideVariants}
                  initial={reduceMotion ? false : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                >
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Choose access option</p>
                  <h2 className="mt-3 text-center text-[24px] font-bold text-white">How would you like to continue?</h2>
                  <p className="mt-2 text-center text-[15px] text-[rgba(255,255,255,0.55)]">
                    Select the option that fits your hiring needs.
                  </p>
                  <div className="mx-auto my-7 h-px w-[60px] bg-[linear-gradient(to_right,transparent,rgba(201,168,76,0.4),transparent)]" />

                  <div className="request-options-container grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <article className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
                      <div className="flex flex-1 flex-col">
                        <div className="w-full">
                          <span className="inline-flex rounded-full border border-[#C9A84C]/35 px-2.5 py-1 text-[11px] font-semibold text-[#C9A84C]">7 days free</span>
                        </div>
                        <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 mx-auto">
                          <Clock className="h-5 w-5 shrink-0 text-[#C9A84C]" />
                        </div>
                        <p className="mt-4 text-[18px] font-bold text-white">Coming Soon</p>
                        <p className="mt-1 text-sm font-semibold text-[#C9A84C]">We&apos;re building this feature. Join the waitlist.</p>
                        <ul className="mt-4 flex flex-1 flex-col gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[12px] text-[rgba(255,255,255,0.62)]">
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />1 candidate request</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Anonymous presentation preview</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />No contact details</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />No commitment</li>
                        </ul>
                      </div>
                      <div className="mt-6">
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/30"
                        >
                          Coming Soon
                        </button>
                      </div>
                    </article>

                    <article className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
                      <div className="flex flex-1 flex-col">
                        <div className="w-full">
                          <span className="inline-flex rounded-full bg-[#C9A84C] px-2.5 py-1 text-[11px] font-semibold text-[#0D1B2A]">Most Popular</span>
                        </div>
                        <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 mx-auto">
                          <TrendingUp className="h-5 w-5 shrink-0 text-[#C9A84C]" />
                        </div>
                        <p className="mt-4 text-[18px] font-bold text-white">Professional Presentations</p>
                        <p className="mt-1 text-sm text-white/70">Matched candidate presentations tailored to your role</p>
                        <p className="mt-1 text-sm font-semibold text-[#C9A84C]">1,499 NOK/month</p>
                        <ul className="mt-4 flex flex-1 flex-col gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[12px] text-[rgba(255,255,255,0.62)]">
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Presentations: 5/month</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Quick Match: 3x/month</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />2 active job posts</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Priority-ready delivery format</li>
                        </ul>
                      </div>
                      <div className="mt-6">
                        <Link href="/pricing" className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,#C9A84C,#b8953f)] px-4 py-3 text-[14px] font-bold text-[#0D1B2A] transition-[filter,transform] duration-200 hover:scale-[1.02] hover:brightness-105">
                          Get Started
                        </Link>
                      </div>
                    </article>

                    <article className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
                      <div className="flex flex-1 flex-col">
                        <div className="w-full">
                          <span className="inline-flex rounded-full border border-[#C9A84C]/35 px-2.5 py-1 text-[11px] font-semibold text-[#C9A84C]">Scale</span>
                        </div>
                        <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 mx-auto">
                          <Bolt className="h-5 w-5 shrink-0 text-[#C9A84C]" />
                        </div>
                        <p className="mt-4 text-[18px] font-bold text-white">Professional Presentations Unlimited</p>
                        <p className="mt-1 text-sm text-white/70">Unlimited matched presentations with priority processing</p>
                        <p className="mt-1 text-sm font-semibold text-[#C9A84C]">3,999 NOK/month</p>
                        <ul className="mt-4 flex flex-1 flex-col gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[12px] text-[rgba(255,255,255,0.62)]">
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Presentations unlimited</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Priority Matching</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Unlimited job posts</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Priority processing</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Quick Match unlimited</li>
                        </ul>
                      </div>
                      <div className="mt-6">
                        <Link href="/pricing" className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.08)]">
                          Get Started
                        </Link>
                      </div>
                    </article>

                    <article className="flex min-h-[520px] flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
                      <div className="flex flex-1 flex-col">
                        <div className="w-full">
                          <span className="inline-flex rounded-full border border-[#C9A84C]/35 px-2.5 py-1 text-[11px] font-semibold text-[#C9A84C]">For Recruitment Firms</span>
                        </div>
                        <div className="mb-4 mt-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A84C]/35 bg-[#C9A84C]/10 mx-auto">
                          <Handshake className="h-5 w-5 shrink-0 text-[#C9A84C]" />
                        </div>
                        <p className="mt-4 text-[18px] font-bold text-white">Candidate Presentation Service</p>
                        <p className="mt-1 text-sm text-white/70">Professional presentations with white-label sourcing</p>
                        <p className="mt-1 text-sm font-semibold text-[#C9A84C]">Custom pricing</p>
                        <ul className="mt-4 flex flex-1 flex-col gap-2 border-t border-[rgba(255,255,255,0.08)] pt-3 text-[12px] text-[rgba(255,255,255,0.62)]">
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Access to presentation database</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Automated presentation sourcing</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Branded presentations</li>
                          <li className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-[#C9A84C]" />Dedicated ATS dashboard</li>
                        </ul>
                      </div>
                      <div className="mt-6">
                        <Link href="/become-a-partner" className="inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.08)]">
                          Apply for Partnership
                        </Link>
                      </div>
                    </article>
                  </div>

                  <div className="mx-auto mt-10 w-full max-w-[320px]">
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsDirection(-1);
                        setResultAction("none");
                        setSelectedOption(null);
                        setNotifyStatus("idle");
                        setNotifyEmail("");
                        setWaitlistCountdown(0);
                        setWaitlistCanResend(true);
                      }}
                      className="w-full rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.04)] px-4 py-[13px] text-[15px] font-semibold text-white transition-colors hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.08)]"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="waitlist-single"
                  className="flex w-full max-w-[440px] flex-col items-stretch"
                  custom={optionsDirection}
                  variants={slideVariants}
                  initial={reduceMotion ? false : "enter"}
                  animate="center"
                  exit={reduceMotion ? undefined : "exit"}
                >
                  <div className="rounded-[22px] border border-[rgba(201,168,76,0.28)] border-t-2 border-t-[rgba(201,168,76,0.55)] bg-[#0f1923] px-8 py-10 md:px-10 md:py-12">
                    <p className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">
                      {selectedOption === "premium" ? "Premium subscription" : "Pay per use"}
                    </p>
                    <h2 className="mt-4 text-center text-[22px] font-bold leading-snug tracking-tight text-white md:text-[24px]">
                      Get notified when this option is available
                    </h2>
                    <p className="mx-auto mt-3 max-w-[340px] text-center text-sm leading-relaxed text-white/50">
                      Leave your company email. We will reach out when this access model opens.
                    </p>

                    {notifyStatus === "success" ? (
                      <div className="waitlist-success-card mt-8">
                        <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
                          <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-[14px] text-[18px] font-bold text-white">We have got you covered.</p>
                        <p className="mt-2 text-[14px] leading-[1.7] text-[rgba(255,255,255,0.55)]">
                          You will be among the first to know when this launches. We are building something worth waiting for.
                        </p>
                        <p className="mt-4 text-[12px] text-[rgba(255,255,255,0.3)]">
                          We will reach out directly when access becomes available.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-8 flex flex-col gap-4">
                        <label className="block text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40">
                          Work email
                        </label>
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={(event) => setNotifyEmail(event.target.value)}
                          placeholder="yourname@company.no"
                          autoComplete="email"
                          className="w-full rounded-[14px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.05)] px-5 py-4 text-[15px] text-white outline-none ring-0 transition-[border-color,background-color] placeholder:text-white/35 focus:border-[#C9A84C] focus:bg-[rgba(255,255,255,0.07)]"
                        />
                        <button
                          type="button"
                          onClick={() => void submitFeatureWaitlist()}
                          disabled={!notifyEmail.includes("@") || notifyStatus === "submitting" || !waitlistCanResend}
                          className={`min-h-[52px] w-full rounded-[12px] px-5 py-3.5 text-[15px] font-bold ${
                            waitlistCanResend ? "bg-[#C9A84C] text-[#0D1B2A]" : "bg-white/10 text-white/30 cursor-not-allowed"
                          }`}
                        >
                          {notifyStatus === "submitting" ? "Sending..." : waitlistCountdown > 0 ? `Resend in ${waitlistCountdown}s` : "Resend email"}
                        </button>
                        {notifyStatus === "error" ? (
                          <p className="text-center text-[13px] text-red-300/90">Could not save your request. Please try again.</p>
                        ) : null}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOptionsDirection(-1);
                        setSelectedOption(null);
                        setNotifyStatus("idle");
                        setNotifyEmail("");
                      }}
                      className="mt-8 w-full rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.04)] px-4 py-[13px] text-[15px] font-semibold text-white transition-colors hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.08)]"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

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
              aria-label="Close leave dialog"
              className="absolute right-3 top-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.9)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
              <path d="M12 3v10m0 8h.01M5.2 20h13.6a1.2 1.2 0 0 0 1.04-1.8L13.04 5.4a1.2 1.2 0 0 0-2.08 0L4.16 18.2A1.2 1.2 0 0 0 5.2 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p id="request-leave-title" className="mt-4 text-center text-[20px] font-bold text-white">
              Leave current search?
            </p>
            <p className="mt-2 text-center text-sm leading-[1.6] text-[rgba(255,255,255,0.55)]">
              You are in the middle of a candidate request. If you leave now, your progress will be lost.
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
                Continue searching
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
                End search
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
              aria-label="Close partner verification modal"
              className="absolute right-3 top-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.9)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            <p id="partner-verify-title" className="mt-1 text-center text-2xl font-bold text-white">
              Partner access
            </p>
            <p className="mt-2 text-center text-sm leading-relaxed text-white/60">
              {accessStatus === "idle" || accessStatus === "submitting"
                ? "Enter your registered partner email to continue."
                : null}
            </p>

            {accessStatus === "submitting" ? (
              <div className={`loading-screen mt-6 text-center ${isLoadingExit ? "loading-exit" : ""}`}>
                <svg viewBox="0 0 64 64" className="loading-shield mx-auto h-12 w-12 text-[#C9A84C]" fill="none" aria-hidden>
                  <path d="M32 8 14 15v13c0 13 8.2 24.8 18 28 9.8-3.2 18-15 18-28V15L32 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path className="shield-check" d="m24 33 6 6 11-12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-5 text-[17px] font-bold text-white">
                  Verifying your access
                  <span className="dot dot-1">.</span>
                  <span className="dot dot-2">.</span>
                  <span className="dot dot-3">.</span>
                </p>
                <p className="mt-2 text-[13px] leading-[1.6] text-[rgba(255,255,255,0.45)]">
                  We are checking your company credentials against our partner registry.
                </p>
                <div className="mt-6 h-[2px] w-full rounded-full bg-[rgba(255,255,255,0.08)]">
                  <div className="loading-progress-fill h-full rounded-full bg-[#C9A84C]" />
                </div>
              </div>
            ) : accessStatus === "partner" ? (
              <div className="partner-success-enter mt-6 text-center">
                <svg className="mx-auto h-6 w-6 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-3 text-[18px] font-bold text-white">Check your inbox</p>
                <p className="mt-2 text-sm text-[rgba(255,255,255,0.6)]">
                  A secure access link has been sent to {accessEmail}. The link is valid for 30 minutes.
                </p>
                <p className="mt-3 text-xs text-[rgba(255,255,255,0.35)]">
                  Emails are usually delivered within a few seconds, but may occasionally take up to 5 minutes. In the meantime, you can close this window and continue browsing. Check your spam folder if nothing arrives.
                </p>
              </div>
            ) : accessStatus === "error" || accessStatus === "non_partner" ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <p className="mb-1 font-semibold text-white">Hmm, we couldn&apos;t place you.</p>
                <p className="mb-4 text-sm text-white/50">
                  This email wasn&apos;t recognised as a partner account. You may have a typo - or you&apos;re not yet in our network.
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={resetEmail}
                    className="w-full rounded-xl border border-white/10 bg-white/10 py-2 text-sm text-white hover:bg-white/20"
                  >
                    ← Try a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResultAction("none");
                      setAccessStatus("idle");
                      setAccessErrorMessage("");
                      setPartnerModalView("not_found");
                      setCheckState("idle");
                    }}
                    className="w-full rounded-xl border border-[#C9A84C]/45 py-2 text-sm font-semibold text-[#C9A84C] hover:bg-[#C9A84C]/10"
                  >
                    I&apos;m new
                  </button>
                  <a
                    href="/recruiter-network"
                    className="w-full rounded-xl bg-[#C9A84C] py-2 text-center text-sm font-semibold text-[#0D1B2A]"
                  >
                    Join the Recruiter Network
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="mt-6 space-y-4">
                <form onSubmit={verifyAccess} className="space-y-3">
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(event) => setAccessEmail(event.target.value)}
                    placeholder="your@company.com"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-[15px] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!accessEmail.includes("@") || !verifyCanResend}
                    className={`w-full rounded-[12px] px-5 py-3 text-sm font-bold ${
                      verifyCanResend && accessEmail.includes("@")
                        ? "bg-[#C9A84C] text-[#0D1B2A]"
                        : "cursor-not-allowed bg-white/10 text-white/30"
                    }`}
                  >
                    {verifyCountdown > 0 ? `Resend in ${verifyCountdown}s` : "Continue →"}
                  </button>
                </form>
                <p className="text-center text-xs leading-relaxed text-white/45">
                  Not yet a partner? Apply at{" "}
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
              aria-label="Close partner application modal"
              className="absolute right-3 top-3 z-20 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.9)]"
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
                <p className="mt-4 text-[20px] font-bold text-white">Check your inbox</p>
                <p className="mt-2 text-[14px] leading-[1.6] text-[rgba(255,255,255,0.55)]">
                  We sent a link to complete your application.
                </p>
                <p className="mt-2 text-[13px] leading-[1.6] text-[rgba(255,255,255,0.45)]">{partnerApplicationEmail}</p>
                <p className="mt-4 text-[12px] text-[rgba(255,255,255,0.35)]">Emails may take up to 5 minutes.</p>
              </div>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
                  <path d="M3 20h18M5.5 20V8.5L12 4l6.5 4.5V20M9 20v-4h6v4M9 10h.01M15 10h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-[14px] text-center text-[20px] font-bold text-white">Partner Application</p>
                <p className="mt-2 text-center text-[14px] leading-[1.6] text-[rgba(255,255,255,0.55)]">
                  Enter your company email to get started. Personal email addresses will not be accepted.
                </p>
                <form onSubmit={startPartnerApplication} className="mt-5">
                  <input
                    type="email"
                    value={partnerApplicationEmail}
                    onChange={(event) => setPartnerApplicationEmail(event.target.value)}
                    placeholder="you@company.no"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-[15px] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  {partnerApplicationError ? (
                    <div className="mt-3">
                      <p className="text-[13px] text-red-300">{partnerApplicationError}</p>
                      {partnerApplicationError === "Please use your company email address." ? (
                        <a href="/contact" className="text-[#C9A84C] text-xs hover:underline mt-1 inline-block">
                          Need help? Contact us →
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!partnerApplicationEmail.includes("@") || partnerApplicationStatus === "submitting" || !partnerApplicationCanResend}
                    className={`mt-3 w-full rounded-[12px] px-5 py-3 text-sm font-bold ${
                      partnerApplicationCanResend ? "bg-[#C9A84C] text-[#0D1B2A]" : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {partnerApplicationStatus === "submitting"
                      ? "Sending..."
                      : partnerApplicationCountdown > 0
                        ? `Resend in ${partnerApplicationCountdown}s`
                        : "Resend email"}
                  </button>
                </form>
              </>
            )}
          </div>
        </>
      )}

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
        .request-options-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10101;
          background: rgba(13, 27, 42, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 20px;
          overflow-y: auto;
        }
        .request-options-panel {
          width: 100%;
          max-width: 1200px;
          text-align: center;
        }
        .request-options-container {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          align-items: stretch;
          gap: 16px;
          padding: 40px 20px;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
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
        @media (min-width: 1024px) {
          .request-options-container {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
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
          .request-options-overlay {
            align-items: flex-start;
            padding-top: 48px;
            padding-bottom: 24px;
          }
          .request-options-container {
            padding: 16px 0;
          }
          .request-option-card {
            padding: 24px;
          }
        }
      `}</style>
    </section>
  );
}
