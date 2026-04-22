"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bolt, Clock3, Factory, HardHat, HeartPulse, Sparkles, Star, Truck, Users } from "lucide-react";

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
    icon: Bolt,
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

export default function RequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const [selectedOffer, setSelectedOffer] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [resultAction, setResultAction] = useState<"none" | "partner" | "non_partner">("none");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
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
  const hasMountedHistoryGuard = useRef(false);
  const hasAutoStartedRoleCheck = useRef(false);

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
    setSearchTerm(role);
    setCheckState("searching");
    setSearchMessageIndex(0);
    setAccessStatus("idle");
    setSelectedOffer("");
    setNotifyEmail("");
    setNotifyStatus("idle");
    setResultAction("none");
    await new Promise((resolve) => setTimeout(resolve, 10000));
    let hash = 0;
    for (let i = 0; i < role.length; i += 1) hash += role.charCodeAt(i);
    setCheckCount((hash % 36) + 12);
    setShowAccessCheck(true);
    setCheckState("result");
  };

  useEffect(() => {
    if (hasAutoStartedRoleCheck.current) return;
    const roleFromQuery = (searchParams.get("role") || "").trim();
    if (!roleFromQuery) return;

    const matchingIndustry = CHECK_ROLE_GROUPS.find((group) =>
      group.roles.some((role) => role.toLowerCase() === roleFromQuery.toLowerCase()),
    )?.industry;

    if (matchingIndustry) {
      setSelectedIndustry(matchingIndustry);
    }
    setRoleQuery(roleFromQuery);
    hasAutoStartedRoleCheck.current = true;
    void runCandidateSearch(roleFromQuery);
  }, [searchParams]);

  const verifyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessEmail.includes("@")) return;
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
      } else if (data.reason === "personal_email") {
        setAccessErrorMessage("Please use your company email address.");
        setIsLoadingExit(true);
        await new Promise((resolve) => setTimeout(resolve, 200));
        setAccessStatus("error");
        setIsLoadingExit(false);
        return;
      } else {
        setPartnerIssueStatus("idle");
        setPartnerModalView("not_found");
        setPartnerIssueMessage("");
        nextStatus = "non_partner";
      }
      setIsLoadingExit(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAccessStatus(nextStatus);
      setIsLoadingExit(false);
    } catch {
      setAccessErrorMessage("Could not check access right now. Please try again.");
      setIsLoadingExit(true);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setAccessStatus("error");
      setIsLoadingExit(false);
    }
  };

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

  const backToRoleSearch = () => {
    setCheckState("idle");
    setSearchTerm("");
    setCheckCount(0);
    setShowAccessCheck(false);
    setAccessStatus("idle");
    setSelectedOffer("");
    setNotifyEmail("");
    setNotifyStatus("idle");
    setResultAction("none");
  };

  const resetToFirstStep = () => {
    setCheckState("idle");
    setSelectedIndustry("");
    setRoleQuery("");
    setSearchTerm("");
    setSearchMessageIndex(0);
    setCheckCount(0);
    setShowAccessCheck(false);
    setAccessEmail("");
    setAccessStatus("idle");
    setCompanyName("");
    setSelectedOffer("");
    setNotifyEmail("");
    setNotifyStatus("idle");
    setResultAction("none");
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
    if (!email.includes("@") || !domain) return;
    if (FREE_EMAIL_DOMAINS.has(domain)) {
      setPartnerApplicationError("Please use your company email address.");
      setPartnerApplicationStatus("error");
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
        return;
      }
      setPartnerApplicationStatus("success");
    } catch {
      setPartnerApplicationStatus("error");
      setPartnerApplicationError("Could not start partner application right now.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasMountedHistoryGuard.current) return;
    window.history.pushState({ requestFlowGuard: true }, "", window.location.href);
    hasMountedHistoryGuard.current = true;
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!isPastFirstStep) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/")) return;
      event.preventDefault();
      setShowLeaveDialog(true);
    };

    const onPopState = () => {
      if (!isPastFirstStep) return;
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

  return (
    <section className="min-h-dvh bg-[#0a0f18] px-4 py-10 text-white md:px-6">
      <div
        className={`mx-auto w-full rounded-[16px] p-9 transition-all duration-300 ${
          checkState === "result"
            ? "max-w-[680px] border border-transparent bg-transparent"
            : "max-w-[980px] border border-[rgba(201,168,76,0.15)] border-t-2 border-t-[rgba(201,168,76,0.4)] bg-[rgba(255,255,255,0.03)]"
        } ${
          showNonPartnerOptions ? "pointer-events-none translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {checkState === "idle" && (
          <>
            {!selectedIndustry && (
              <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-2 rounded-[8px] border border-transparent px-2 py-1 text-sm text-[#C9A84C]"
              >
                <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
                Back
              </button>
            )}
            <h1 className="text-2xl font-bold">Check candidate availability</h1>
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
                    className="cursor-pointer rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-5 py-4 text-left transition-all duration-200 ease-in-out hover:border-[rgba(201,168,76,0.45)] hover:bg-[rgba(255,255,255,0.07)]"
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
                    <span className="text-sm">x</span>
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
            <svg className="spinner-arc" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="46 18" />
            </svg>
            <p className="mt-5 text-sm text-[rgba(255,255,255,0.7)]">{SEARCH_MESSAGES[searchMessageIndex]}</p>
          </div>
        )}

        {checkState === "result" && (
          <div className="relative text-center">
            <button
              type="button"
              onClick={backToRoleSearch}
              className="mb-4 inline-flex items-center gap-2 rounded-[8px] border border-transparent px-2 py-1 text-sm text-[#C9A84C]"
            >
              <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
              Back
            </button>
            <div className="pointer-events-none absolute left-1/2 top-[120px] h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(201,168,76,0.08)_0%,transparent_70%)]" />
            <p className="result-zero relative z-[1] text-[96px] font-extrabold leading-none text-transparent">0</p>
            <p className="mt-3 text-[12px] uppercase tracking-[0.15em] text-[rgba(201,168,76,0.7)]">{searchTerm.trim() || "ROLE"}</p>
            <div className="mx-auto mt-3 inline-flex rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.06)] px-3 py-1 text-[11px] text-[rgba(255,255,255,0.6)]">
              Feature in development. Partner access only.
            </div>
            <div className="mx-auto my-8 h-px w-[60px] bg-[linear-gradient(to_right,transparent,rgba(201,168,76,0.4),transparent)]" />
            <div className="mx-auto grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setResultAction("partner");
                  setAccessStatus("idle");
                }}
                className="result-cta-primary rounded-[12px] px-9 py-4 text-[15px] font-bold text-[#0D1B2A]"
              >
                I am a partner
              </button>
              <button
                type="button"
                onClick={() => {
                  setResultAction("non_partner");
                  setAccessStatus("idle");
                  setSelectedOffer("");
                  setNotifyEmail("");
                  setNotifyStatus("idle");
                }}
                className="result-cta-secondary rounded-[12px] border border-[rgba(201,168,76,0.25)] bg-transparent px-9 py-4 text-[15px] font-medium text-[rgba(255,255,255,0.7)]"
              >
                I am not a partner
              </button>
            </div>
            <button
              type="button"
              onClick={backToRoleSearch}
              className="mx-auto mt-4 block cursor-pointer text-center text-[13px] text-[rgba(201,168,76,0.6)] underline underline-offset-2 transition-colors hover:text-[#C9A84C]"
            >
              Search another role
            </button>

          </div>
        )}
      </div>

      {showNonPartnerOptions && (
        <div className="fixed inset-0 z-30 mx-auto flex w-full flex-col items-center justify-center px-6 pt-[88px] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">Choose access option</p>
          <h2 className="mt-3 text-[24px] font-bold text-white">How would you like to continue?</h2>
          <p className="mt-2 text-[15px] text-[rgba(255,255,255,0.55)]">Select the option that fits your hiring needs.</p>
          <div className="mx-auto my-7 h-px w-[60px] bg-[linear-gradient(to_right,transparent,rgba(201,168,76,0.4),transparent)]" />

          <div className="non-partner-cards w-full max-w-[980px]">
            <button
              type="button"
              onClick={() => {
                setPartnerApplicationEmail(accessEmail.trim().toLowerCase());
                setPartnerApplicationStatus("idle");
                setPartnerApplicationError("");
                setShowPartnerApplicationModal(true);
              }}
              className="non-partner-card rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-6 text-left"
            >
              <Users className="h-5 w-5 text-[#C9A84C]" />
              <p className="mt-4 text-[18px] font-bold text-white">Become a Partner</p>
              <p className="mt-2 text-[13px] leading-[1.7] text-[rgba(255,255,255,0.6)]">
                Get access to partner-only candidate tools and direct hiring support.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOffer("premium");
                setNotifyStatus("idle");
              }}
              className="non-partner-card rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-6 text-left"
            >
              <Star className="h-5 w-5 text-[#C9A84C]" />
              <p className="mt-4 text-[18px] font-bold text-white">Premium Subscription</p>
              <p className="mt-2 text-[13px] leading-[1.7] text-[rgba(255,255,255,0.6)]">
                Best for ongoing hiring with priority support and expanded matching.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOffer("pay-per-use");
                setNotifyStatus("idle");
              }}
              className="non-partner-card rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-6 text-left"
            >
              <Clock3 className="h-5 w-5 text-[#C9A84C]" />
              <p className="mt-4 text-[18px] font-bold text-white">Pay per use</p>
              <p className="mt-2 text-[13px] leading-[1.7] text-[rgba(255,255,255,0.6)]">
                Flexible access when you need candidates without a long-term commitment.
              </p>
            </button>
          </div>

          {selectedOffer && (
            <div className="mt-6 w-full max-w-[520px] rounded-[16px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.03)] p-5 text-left">
              <p className="text-[14px] text-[rgba(255,255,255,0.65)]">Get notified when this option is available.</p>
              <div className="mt-3 flex flex-col gap-[10px] sm:flex-row">
                <input
                  type="email"
                  value={notifyEmail}
                  onChange={(event) => setNotifyEmail(event.target.value)}
                  placeholder="yourname@company.no"
                  className="w-full rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-[14px] text-white placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.5)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => void submitFeatureWaitlist()}
                  disabled={!notifyEmail.includes("@") || notifyStatus === "submitting"}
                  className="result-cta-primary rounded-[10px] px-4 py-3 text-[14px] font-bold text-[#0D1B2A] disabled:opacity-60"
                >
                  {notifyStatus === "submitting" ? "Sending..." : "Notify me"}
                </button>
              </div>
              {notifyStatus === "success" && (
                <div className="waitlist-success-card mt-4">
                  <svg viewBox="0 0 24 24" className="mx-auto h-7 w-7 text-[#C9A84C]" fill="none" aria-hidden>
                    <path d="M20 7 9 18l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-[14px] text-[18px] font-bold text-white">We have got you covered.</p>
                  <p className="mt-2 text-[14px] leading-[1.7] text-[rgba(255,255,255,0.55)]">
                    You will be among the first to know when this launches. We are building something worth waiting for.
                  </p>
                  <p className="mt-4 text-[12px] text-[rgba(255,255,255,0.3)]">We will reach out directly when access becomes available.</p>
                </div>
              )}
              {notifyStatus === "error" && <p className="mt-3 text-[13px] text-[rgba(255,255,255,0.5)]">Could not save your request. Please try again.</p>}
            </div>
          )}

          <div className="mt-5 w-full max-w-[320px]">
            <button
              type="button"
              onClick={() => {
                setResultAction("none");
              }}
              className="w-full rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.04)] px-4 py-[13px] text-[15px] font-semibold text-white transition-colors hover:border-[rgba(201,168,76,0.5)] hover:bg-[rgba(201,168,76,0.08)]"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {showLeaveDialog && (
        <>
          <div className="fixed inset-0 z-[9998] bg-[rgba(0,0,0,0.7)] backdrop-blur-[4px]" />
          <div className="leave-dialog fixed left-1/2 top-1/2 z-[9999] w-[90%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10">
            <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-[#C9A84C]" fill="none" aria-hidden>
              <path d="M12 3v10m0 8h.01M5.2 20h13.6a1.2 1.2 0 0 0 1.04-1.8L13.04 5.4a1.2 1.2 0 0 0-2.08 0L4.16 18.2A1.2 1.2 0 0 0 5.2 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-4 text-center text-[20px] font-bold text-white">Leave current search?</p>
            <p className="mt-2 text-center text-sm leading-[1.6] text-[rgba(255,255,255,0.55)]">
              You are in the middle of a candidate request. If you leave now, your progress will be lost.
            </p>
            <div className="mt-7 flex flex-col gap-[10px]">
              <button
                type="button"
                onClick={() => {
                  setShowLeaveDialog(false);
                  resetToFirstStep();
                  router.push("/request");
                }}
                className="result-cta-primary w-full rounded-[12px] px-4 py-[14px] text-[15px] font-bold text-[#0D1B2A]"
              >
                Yes, start over
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveDialog(false)}
                className="w-full rounded-[12px] border border-[rgba(201,168,76,0.25)] bg-transparent px-4 py-[14px] text-[15px] text-[rgba(255,255,255,0.7)]"
              >
                Continue my search
              </button>
            </div>
          </div>
        </>
      )}

      {resultAction === "partner" && (
        <>
          <div className="partner-modal-backdrop fixed inset-0 z-[9998] bg-[rgba(0,0,0,0.75)] backdrop-blur-[6px]" />
          <div className="partner-modal fixed left-1/2 top-1/2 z-[9999] w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10">
            <button
              type="button"
              onClick={() => setResultAction("none")}
              aria-label="Close partner verification modal"
              className="absolute right-4 top-4 text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.8)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            <svg className="mx-auto h-7 w-7 text-[#C9A84C]" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3 5 6v5c0 4.6 3.1 8.9 7 10 3.9-1.1 7-5.4 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 12.2 11.2 14l3.3-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-[14px] text-center text-[20px] font-bold text-white">Partner Verification</p>
            <p className="mt-2 text-center text-sm leading-[1.6] text-[rgba(255,255,255,0.55)]">
              Enter your company email to verify your partner status. We will send you a secure access link valid for 14 days.
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
                <div className="mt-4 rounded-[10px] border border-[rgba(201,168,76,0.2)] bg-[rgba(201,168,76,0.06)] px-4 py-3">
                  <p className="flex items-start gap-2 text-[12px] leading-[1.5] text-[rgba(255,255,255,0.5)]">
                    <svg viewBox="0 0 24 24" className="mt-[2px] h-[14px] w-[14px] shrink-0 text-[#C9A84C]" fill="none" aria-hidden>
                      <path d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Use your official company email (e.g. yourname@company.no). Personal email addresses will not be recognized.
                  </p>
                </div>

                <form onSubmit={verifyAccess} className="mt-5">
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(event) => setAccessEmail(event.target.value)}
                    placeholder="yourname@company.no"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.2)] bg-[rgba(255,255,255,0.04)] px-[18px] py-[14px] text-[15px] text-white placeholder:text-[rgba(255,255,255,0.3)] focus:border-[rgba(201,168,76,0.6)] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!accessEmail.includes("@")}
                    className="result-cta-primary mt-3 w-full rounded-[12px] px-5 py-3 text-sm font-bold text-[#0D1B2A] disabled:opacity-60"
                  >
                    Send access link
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
              <p className="mt-4 text-sm text-red-300">{accessErrorMessage || "Could not check access right now. Please try again."}</p>
            )}
          </div>
        </>
      )}

      {showPartnerApplicationModal && (
        <>
          <div className="partner-modal-backdrop fixed inset-0 z-[9998] bg-[rgba(0,0,0,0.75)] backdrop-blur-[6px]" />
          <div className="partner-modal fixed left-1/2 top-1/2 z-[9999] w-[90%] max-w-[440px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] border border-[rgba(201,168,76,0.25)] border-t-2 border-t-[rgba(201,168,76,0.5)] bg-[#0f1923] px-9 py-10">
            <button
              type="button"
              onClick={() => setShowPartnerApplicationModal(false)}
              aria-label="Close partner application modal"
              className="absolute right-4 top-4 text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.8)]"
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
        .result-zero {
          background: linear-gradient(135deg, #c9a84c, #f0d080);
          -webkit-background-clip: text;
          background-clip: text;
        }
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
        .non-partner-cards {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
          margin: 0 auto;
        }
        .non-partner-card {
          transition: border-color 220ms ease, background 220ms ease;
        }
        @media (max-width: 767px) {
          .non-partner-cards {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 16px;
            padding: 0 24px;
            max-width: 100%;
            scrollbar-width: none;
          }
          .non-partner-cards::-webkit-scrollbar {
            display: none;
          }
          .non-partner-card {
            width: 80vw;
            flex-shrink: 0;
            scroll-snap-align: center;
          }
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
        @keyframes resultIn {
          from {
            opacity: 0;
            transform: translateY(10px);
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
          .result-zero {
            animation: resultIn 400ms ease-out both;
          }
          .partner-form-enter {
            animation: partnerFormIn 300ms ease both;
          }
          .partner-success-enter {
            animation: partnerSuccessIn 300ms ease both;
          }
          .non-partner-card:hover {
            border-color: rgba(201, 168, 76, 0.45);
            background: rgba(201, 168, 76, 0.05);
            transform: translateY(-4px);
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
      `}</style>
    </section>
  );
}
