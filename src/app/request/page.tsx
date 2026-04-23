"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bolt, Check, Clock, Factory, Handshake, HardHat, HeartPulse, Search, Sparkles, TrendingUp, Truck, Zap } from "lucide-react";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import {
  trackPartnerAccessRequest,
  trackRareProfileView,
  trackRequestStart,
  trackRequestStepComplete,
  trackRequestSubmit,
} from "@/lib/analytics/requestEvents";
import { useToast } from "@/lib/toast-context";

type VerifyPartnerResponse = {
  verified?: boolean;
  company_name?: string;
  reason?: string;
};

const CHECK_ROLE_GROUPS: Array<{ industry: string; icon: typeof HardHat; roles: string[] }> = [
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
];

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
}: {
  industry: string;
  Icon: typeof HardHat;
  index: number;
  selected: boolean;
  reduceMotion: boolean | null;
  onSelect: (industry: string) => void;
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
          <p className="mt-1 text-xs text-white/40">Tap to explore available specialist pools</p>
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

  const [checkState, setCheckState] = useState<"idle" | "searching" | "result">("idle");
  const [selectedIndustry, setSelectedIndustry] = useState("");
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
  const [workTogetherStatus, setWorkTogetherStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
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
    return () => {
      if (industryAdvanceTimerRef.current) {
        window.clearTimeout(industryAdvanceTimerRef.current);
      }
    };
  }, []);

  const isPastFirstStep = useMemo(() => {
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

  const runCandidateSearch = async (roleInput: string) => {
    const role = roleInput.trim();
    if (role.length < 2) return;
    const generation = ++candidateSearchGenerationRef.current;
    const analyticsCategory = selectedIndustry || role;
    setSearchTerm(role);
    setAccessStatus("idle");
    setSelectedOption(null);
    setNotifyEmail("");
    setNotifyStatus("idle");
    setResultAction("none");
    setFlowDirection(1);
    setCheckState("searching");
    setSearchMessageIndex(0);
    rareProfileTrackedRef.current = false;
    trackRequestStart(analyticsCategory);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    if (generation !== candidateSearchGenerationRef.current) return;
    let hash = 0;
    for (let i = 0; i < role.length; i += 1) hash += role.charCodeAt(i);
    setCheckCount((hash % 36) + 12);
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
    void runCandidateSearch(roleFromQuery);
  }, []);

  const verifyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        trackRequestSubmit(selectedIndustry || searchTerm || "unknown", checkCount);
        toast.success("Partner verified. Check your inbox for secure access.");
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
    if (!notifyEmail.includes("@") || !selectedOption) {
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
    if (!workTogetherEmail.includes("@")) {
      setWorkTogetherStatus("error");
      return;
    }
    setWorkTogetherStatus("submitting");
    try {
      const response = await fetch("/api/employer/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: workTogetherEmail.trim().toLowerCase(),
          category: selectedIndustry || searchTerm || "unknown",
        }),
      });
      if (!response.ok) {
        setWorkTogetherStatus("error");
        return;
      }
      setWorkTogetherStatus("success");
    } catch {
      setWorkTogetherStatus("error");
    }
  };

  const handleAvailabilityBack = () => {
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
    setResultAction("none");
  };

  const resetToFirstStep = () => {
    candidateSearchGenerationRef.current += 1;
    if (industryAdvanceTimerRef.current) {
      window.clearTimeout(industryAdvanceTimerRef.current);
      industryAdvanceTimerRef.current = null;
    }
    setShowLeaveDialog(false);
    setFlowDirection(-1);
    setCheckState("idle");
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
    setShowWorkTogetherInlineModal(false);
    setWorkTogetherEmail("");
    setWorkTogetherStatus("idle");
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
    hasAutoStartedRoleCheck.current = false;
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
    if (checkState !== "result" || checkCount >= 5 || rareProfileTrackedRef.current) return;
    trackRareProfileView(selectedIndustry || searchTerm || "unknown", checkCount);
    rareProfileTrackedRef.current = true;
  }, [checkCount, checkState, searchTerm, selectedIndustry]);

  return (
    <section className="flex min-h-screen flex-col items-center bg-[#0D1B2A] px-4 py-6 text-white md:min-h-dvh md:px-6 md:py-10">
      <div
        className={`mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 md:max-w-[980px] md:rounded-[16px] md:p-9 ${
          checkState === "result"
            ? "md:max-w-[680px] md:border md:border-transparent md:bg-transparent"
            : "md:border-[rgba(201,168,76,0.15)] md:border-t-2 md:border-t-[rgba(201,168,76,0.4)] md:bg-[rgba(255,255,255,0.03)]"
        } ${
          showNonPartnerOptions ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
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
                        value={selectedIndustry}
                        onChange={(event) => {
                          setFlowDirection(1);
                          setIndustryPreview("");
                          setSelectedIndustry(event.target.value);
                          setRoleQuery("");
                        }}
                      >
                        <option value="">Select a role...</option>
                        {CHECK_ROLE_GROUPS.map(({ industry }) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedIndustry) return;
                        setRoleQuery("");
                      }}
                      disabled={!selectedIndustry}
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D1B2A] p-4 md:hidden">
              <div className="flex w-full max-w-lg flex-col items-center p-10 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Searching for</p>
                <p className="mb-6 mt-1 text-[1.1rem] font-bold text-white">{searchTerm}</p>
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-[#C9A84C]" />
                <p className="mt-5 text-sm text-[rgba(255,255,255,0.7)]">{SEARCH_MESSAGES[searchMessageIndex]}</p>
              </div>
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
              className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-10 text-center md:w-[90%]"
            >
              <div className="mt-5 inline-flex rounded-full bg-[#C9A84C]/10 px-3 py-1 text-xs font-semibold tracking-widest text-[#C9A84C]">
                PARTNER ACCESS
              </div>
              {checkCount < 5 ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : 0.3 }}
                  className="mx-auto mt-4 max-w-xs text-center"
                >
                  <div className="inline-flex rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/15 px-3 py-1 text-xs font-medium text-[#C9A84C]">
                    Rare Profile
                  </div>
                  <p className="mt-2 text-center text-sm leading-relaxed text-white/50">
                    {checkCount === 0
                      ? "No profiles currently available for this role. We'll notify you as soon as one joins our network."
                      : "This is a rare profile in our network. We'll put extra effort into finding the right match for you."}
                  </p>
                </motion.div>
              ) : null}
              <h2 className="mt-5 text-center text-2xl font-bold text-white">{(searchTerm.trim() || "ROLE").toUpperCase()}</h2>
              <p className="mt-2 text-center text-sm text-white/60">Viewing available candidates for this role is a partner-only feature.</p>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setResultAction("partner");
                    setAccessStatus("idle");
                    trackPartnerAccessRequest();
                  }}
                  className="h-14 w-full rounded-xl bg-[#C9A84C] font-semibold text-[#0D1B2A]"
                >
                  See who's available
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWorkTogetherInlineModal(true);
                    setWorkTogetherStatus("idle");
                  }}
                  className="h-14 w-full rounded-xl border border-white/10 py-3 text-white hover:bg-white/5"
                >
                  Let's work together
                </button>
              </div>

              <AnimatePresence>
                {showWorkTogetherInlineModal ? (
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.22 }}
                    className="mt-4 rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[rgba(255,255,255,0.04)] p-4 text-left"
                  >
                    <p className="text-sm font-medium text-white/80">Enter your work email</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <input
                        type="email"
                        value={workTogetherEmail}
                        onChange={(event) => setWorkTogetherEmail(event.target.value)}
                        placeholder="you@company.com"
                        className="h-12 w-full rounded-xl border border-white/15 bg-[#0D1B2A] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#C9A84C]/60"
                      />
                      <button
                        type="button"
                        onClick={() => void submitWorkTogetherEmail()}
                        disabled={workTogetherStatus === "submitting" || !workTogetherEmail.includes("@")}
                        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#C9A84C] px-5 text-sm font-bold text-[#0D1B2A] disabled:opacity-60 sm:w-auto"
                      >
                        {workTogetherStatus === "submitting" ? "Sending..." : "Send me the link"}
                      </button>
                    </div>
                    {workTogetherStatus === "success" ? (
                      <p className="mt-3 text-sm text-[#C9A84C]">Check your inbox - we&apos;ve sent you a secure link to get started.</p>
                    ) : null}
                    {workTogetherStatus === "error" ? (
                      <p className="mt-3 text-sm text-red-300">Could not send the link right now. Please try again.</p>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                type="button"
                onClick={() => {
                  resetToFirstStep();
                  void router.replace("/request");
                }}
                className="mx-auto mt-5 block text-sm text-white/40 transition-colors hover:text-white/70"
              >
                Search another role
              </button>
            </motion.div>
          </div>
        )}
      </div>

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
                          disabled={!notifyEmail.includes("@") || notifyStatus === "submitting"}
                          className="result-cta-primary min-h-[52px] w-full rounded-[12px] px-5 py-3.5 text-[15px] font-bold text-[#0D1B2A] disabled:opacity-50"
                        >
                          {notifyStatus === "submitting" ? "Sending..." : "Notify Me"}
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
            className="partner-modal pointer-events-auto fixed left-1/2 top-1/2 z-[10101] w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10 isolation-isolate"
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

            <Handshake className="mx-auto h-10 w-10 text-[#C9A84C]" aria-hidden />
            <p id="partner-verify-title" className="mt-[14px] text-center text-2xl font-bold text-white">
              Welcome, Partner!
            </p>
            <p className="mt-2 text-center text-sm leading-relaxed text-white/60">
              Let&apos;s find great candidates together. Enter your email and we&apos;ll send you a secure link to start your
              search.
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
            ) : accessStatus === "non_partner" ? (
              <div className={`not-found-panel mt-6 ${notFoundExiting ? "not-found-exit" : ""}`}>
                {partnerModalView === "not_found" && (
                  <div className="text-center">
                    <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
                      <path d="M12 3 4 7v6c0 4 3.2 7.8 8 9 4.8-1.2 8-5 8-9V7l-8-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 12.5h7m-7-3h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <p className="mt-3 text-[18px] font-bold text-white">No partner account found</p>
                    <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.5)]">Tell us what happened and we will look into it right away.</p>
                    <div className="mt-5 flex flex-col gap-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setResultAction("none");
                          router.push("/become-a-partner");
                        }}
                        className="w-full rounded-[10px] bg-[linear-gradient(135deg,#C9A84C,#b8953f)] px-4 py-[13px] text-[15px] font-bold text-[#0D1B2A]"
                      >
                        Request partner access
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNotFoundExiting(true);
                          setTimeout(() => {
                            setFeedbackEmail(accessEmail);
                            setPartnerModalView("feedback_form");
                            setNotFoundExiting(false);
                          }, 150);
                        }}
                        className="w-full rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-transparent px-4 py-[13px] text-[15px] text-[rgba(255,255,255,0.6)]"
                      >
                        Report a problem
                      </button>
                    </div>
                  </div>
                )}
                {partnerModalView === "feedback_form" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setNotFoundExiting(true);
                        setTimeout(() => {
                          setPartnerModalView("not_found");
                          setPartnerIssueStatus("idle");
                          setNotFoundExiting(false);
                        }, 150);
                      }}
                      className="inline-flex items-center gap-1 text-[13px] text-[#C9A84C]"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back
                    </button>
                    <svg viewBox="0 0 24 24" className="mx-auto mt-2 h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
                      <path d="M12 3 4 7v6c0 4 3.2 7.8 8 9 4.8-1.2 8-5 8-9V7l-8-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.5 12.5h7m-7-3h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <p className="mt-3 text-center text-[18px] font-bold text-white">Report a problem</p>
                    <p className="mt-1.5 text-center text-[13px] text-[rgba(255,255,255,0.5)]">
                      Tell us what happened and we will look into it right away.
                    </p>
                    <label className="mt-5 block text-[12px] text-[rgba(255,255,255,0.45)]">Your email</label>
                    <input
                      type="email"
                      value={feedbackEmail}
                      onChange={(event) => setFeedbackEmail(event.target.value)}
                      placeholder="your@company.no"
                      className="mt-1.5 mb-3 w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
                    />
                    <label className="block text-[12px] text-[rgba(255,255,255,0.45)]">Describe the issue</label>
                    <textarea
                      rows={4}
                      value={partnerIssueMessage}
                      onChange={(event) => setPartnerIssueMessage(event.target.value)}
                      placeholder="Describe the issue. For example: I work at Company X and my email should be registered."
                      className="mt-1.5 w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[14px] py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => void reportPartnerIssue()}
                      disabled={partnerIssueStatus === "submitting" || !partnerIssueMessage.trim()}
                      className="result-cta-primary mt-3 w-full rounded-[10px] px-4 py-[13px] text-[15px] font-bold text-[#0D1B2A] disabled:opacity-60"
                    >
                      {partnerIssueStatus === "submitting" ? (
                        <svg className="spinner-arc mx-auto" viewBox="0 0 24 24" aria-hidden>
                          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="46 18" />
                        </svg>
                      ) : (
                        "Send report"
                      )}
                    </button>
                    {partnerIssueStatus === "error" && (
                      <p className="mt-3 text-center text-[13px] text-[rgba(255,255,255,0.5)]">Something went wrong. Please try again.</p>
                    )}
                  </div>
                )}
                {partnerModalView === "feedback_success" && (
                  <div className="text-center">
                    <svg className="mx-auto h-6 w-6 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="mt-3 text-[16px] font-bold text-white">Report sent.</p>
                    <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.45)]">
                      We will review your request and contact you at {accessEmail} shortly.
                    </p>
                  </div>
                )}
              </div>
            ) : accessStatus !== "partner" ? (
              <>
                <form onSubmit={verifyAccess} className="mt-5">
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(event) => setAccessEmail(event.target.value)}
                    placeholder="your@company.no"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-[15px] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  <p className="mt-2 text-center text-xs text-white/30">Use your company email address for verification.</p>
                  <button
                    type="submit"
                    disabled={!accessEmail.includes("@")}
                    className="result-cta-primary mt-3 w-full rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-semibold text-[#0D1B2A] disabled:opacity-60"
                  >
                    Let&apos;s get started →
                  </button>
                </form>
              </>
            ) : (
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
            )}

            {accessStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center"
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
                  <a
                    href="/recruiter-network"
                    className="w-full rounded-xl bg-[#C9A84C] py-2 text-center text-sm font-semibold text-[#0D1B2A]"
                  >
                    Join the Recruiter Network
                  </a>
                </div>
              </motion.div>
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
                    <p className="mt-3 text-[13px] text-red-300">{partnerApplicationError}</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={!partnerApplicationEmail.includes("@") || partnerApplicationStatus === "submitting"}
                    className="result-cta-primary mt-3 w-full rounded-[12px] px-5 py-3 text-sm font-bold text-[#0D1B2A] disabled:opacity-60"
                  >
                    {partnerApplicationStatus === "submitting" ? "Sending..." : "Continue"}
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
