"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bolt, Clock3, Factory, HardHat, HeartPulse, Sparkles, Star, Truck, Users } from "lucide-react";

type VerifyPartnerResponse = {
  verified?: boolean;
  company_name?: string;
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

export default function RequestPage() {
  const router = useRouter();
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

  const [selectedOffer, setSelectedOffer] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
    await new Promise((resolve) => setTimeout(resolve, 10000));
    let hash = 0;
    for (let i = 0; i < role.length; i += 1) hash += role.charCodeAt(i);
    setCheckCount((hash % 36) + 12);
    setShowAccessCheck(true);
    setCheckState("result");
  };

  const verifyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessEmail.includes("@")) return;
    setAccessStatus("submitting");
    try {
      const response = await fetch("/api/verify-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: accessEmail.trim().toLowerCase() }),
      });
      const data = (await response.json()) as VerifyPartnerResponse;
      if (response.ok && data.verified) {
        setCompanyName(data.company_name || "your company");
        setAccessStatus("partner");
        return;
      }
      setAccessStatus("non_partner");
    } catch {
      setAccessStatus("error");
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
  };

  const showNonPartnerOptions = accessStatus === "non_partner";

  return (
    <section className="min-h-dvh bg-[#0a0f18] px-4 py-10 text-white md:px-6">
      <div
        className={`mx-auto w-full max-w-[980px] rounded-[16px] border border-[rgba(201,168,76,0.15)] border-t-2 border-t-[rgba(201,168,76,0.4)] bg-[rgba(255,255,255,0.03)] p-9 transition-all duration-300 ${
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
          <div className="text-center">
            <button
              type="button"
              onClick={backToRoleSearch}
              className="mb-4 inline-flex items-center gap-2 rounded-[8px] border border-transparent px-2 py-1 text-sm text-[#C9A84C]"
            >
              <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
              Back
            </button>
            <p className="text-[3rem] font-extrabold text-[#C9A84C]">0</p>
            <p className="mt-1 text-sm text-white/65">
              This feature is currently in development. At this stage, only our partners can submit candidate requests.
            </p>
            <button
              type="button"
              onClick={backToRoleSearch}
              className="mx-auto mt-4 block cursor-pointer text-center text-[13px] text-[rgba(255,255,255,0.4)] transition-colors hover:text-[rgba(255,255,255,0.7)]"
            >
              Search another role
            </button>

            <div className="mx-auto mt-8 max-w-[520px] text-left">
                <h2 className="text-center text-[1.1rem] font-bold text-white">Want to find the right candidate?</h2>
                <form onSubmit={verifyAccess} className="mt-4">
                  <input
                    type="email"
                    value={accessEmail}
                    onChange={(event) => setAccessEmail(event.target.value)}
                    placeholder="Enter your company email"
                    className="w-full rounded-[12px] border border-[rgba(201,168,76,0.6)] bg-[#0D1B2A] px-4 py-3 text-sm text-white placeholder:text-white/45 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={accessStatus === "submitting" || !accessEmail.includes("@")}
                    className="mt-3 w-full rounded-[12px] bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#0D1B2A] disabled:opacity-60"
                  >
                    {accessStatus === "submitting" ? (
                      <svg className="spinner-arc mx-auto" viewBox="0 0 24 24" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="46 18" />
                      </svg>
                    ) : (
                      "Check access"
                    )}
                  </button>
                </form>
                <p className="mt-3 text-center text-xs text-white/45">
                  We will check if you have partner access or show you available options.
                </p>

                {accessStatus === "partner" && (
                  <div className="mt-5 p-5 text-center">
                    <p className="text-2xl text-[#1D9E75]">✓</p>
                    <p className="mt-2 text-sm font-semibold text-white">Welcome back, {companyName}! You have partner access.</p>
                    <p className="mt-2 text-sm text-white/75">
                      We are sending a secure link to {accessEmail}. Check your inbox to continue.
                    </p>
                    <Link href="/contact" className="mt-3 inline-block text-xs text-[#C9A84C] underline">
                      Not your account? Contact support
                    </Link>
                  </div>
                )}

                {accessStatus === "error" && (
                  <p className="mt-4 text-sm text-red-300">Could not check access right now. Please try again.</p>
                )}
            </div>
          </div>
        )}
      </div>

      {showNonPartnerOptions && (
        <div className="mx-auto mt-6 w-full max-w-[980px]">
          <button
            type="button"
            onClick={backToRoleSearch}
            className="mb-4 inline-flex items-center gap-2 rounded-[8px] border border-transparent px-2 py-1 text-sm text-[#C9A84C]"
          >
            <ArrowLeft className="h-4 w-4 text-[#C9A84C]" />
            Back
          </button>
          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3">
            <div
              className="flex h-full flex-col justify-between rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-[28px_24px] transition-all duration-[250ms] hover:border-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.06)]"
              style={{ animation: "optionIn .3s ease forwards", animationDelay: "0ms", opacity: 0, transform: "translateY(20px)" }}
            >
              <div>
                <Users className="h-5 w-5 text-[#C9A84C]" />
                <p className="mt-3 text-base font-bold text-[#ffffff]">Become a Partner</p>
                <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">Priority access and full support from our team.</p>
              </div>
              <Link href="/contact" className="mt-6 inline-flex rounded-[10px] bg-[#C9A84C] px-4 py-2 text-xs font-semibold text-[#0D1B2A]">
                Contact us
              </Link>
            </div>
            <div
              className="flex h-full flex-col justify-between rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-[28px_24px] transition-all duration-[250ms] hover:border-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.06)]"
              style={{ animation: "optionIn .3s ease forwards", animationDelay: "80ms", opacity: 0, transform: "translateY(20px)" }}
            >
              <div>
                <Star className="h-5 w-5 text-[#C9A84C]" />
                <p className="mt-3 text-base font-bold text-[#ffffff]">Premium Subscription</p>
                <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">Monthly access to candidate profile tools.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOffer("premium-subscription");
                  setNotifyStatus("idle");
                }}
                className="mt-6 rounded-[10px] border border-[rgba(201,168,76,0.35)] px-4 py-2 text-xs font-semibold text-white"
              >
                Coming soon
              </button>
            </div>
            <div
              className="flex h-full flex-col justify-between rounded-[16px] border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.04)] p-[28px_24px] transition-all duration-[250ms] hover:border-[rgba(201,168,76,0.4)] hover:bg-[rgba(201,168,76,0.06)]"
              style={{ animation: "optionIn .3s ease forwards", animationDelay: "160ms", opacity: 0, transform: "translateY(20px)" }}
            >
              <div>
                <Clock3 className="h-5 w-5 text-[#C9A84C]" />
                <p className="mt-3 text-base font-bold text-[#ffffff]">Pay per use</p>
                <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">
                  Flexible access with no subscription. Pricing details will be announced soon.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="mt-6 rounded-[10px] border border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.12)] px-4 py-2 text-xs font-semibold text-[rgba(201,168,76,0.7)]"
              >
                Coming soon
              </button>
            </div>
          </div>

          {selectedOffer && (
            <div className="mx-auto mt-4 max-w-[520px]">
              <input
                type="email"
                value={notifyEmail}
                onChange={(event) => setNotifyEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-[10px] border border-[rgba(201,168,76,0.35)] bg-[#0D1B2A] px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none"
              />
              <button
                type="button"
                onClick={submitFeatureWaitlist}
                disabled={notifyStatus === "submitting" || !notifyEmail.includes("@")}
                className="mt-2 w-full rounded-[10px] bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-[#0D1B2A] disabled:opacity-60"
              >
                {notifyStatus === "submitting" ? "Sending..." : "Notify me"}
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-sm text-white/65">Already a partner but not recognized?</p>
          <Link
            href="/contact?subject=Partner%20verification%20issue"
            className="mx-auto mt-2 inline-flex rounded-[10px] border border-[rgba(201,168,76,0.35)] px-4 py-2 text-xs font-semibold text-white"
          >
            Contact Support
          </Link>
        </div>
      )}

      <style jsx>{`
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
      `}</style>
    </section>
  );
}
