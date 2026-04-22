"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Crown, ExternalLink, X } from "lucide-react";

import ComingSoonCapture from "@/components/ui/ComingSoonCapture";

const GOLD = "#C9A84C";

const employerTjenesterStaffing = { href: "/for-staffing-agencies", label: "For bemanningsbyråer" } as const;

const employerTjenester: { href: string; label: string }[] = [
  { href: "/for-employers", label: "For arbeidsgivere" },
  { href: "/welding-specialists", label: "Sveisespesialister" },
  { href: "/bemanning-bygg-anlegg", label: "Bygg og Anlegg" },
  { href: "/bemanning-logistikk", label: "Logistikk" },
  { href: "/bemanning-industri", label: "Industri" },
  { href: "/bemanning-renhold", label: "Renhold" },
  { href: "/bemanning-horeca", label: "HoReCa" },
  { href: "/bemanning-helse", label: "Helse" },
];

const employerOmOss: { href: string; label: string }[] = [
  { href: "/about", label: "Om ArbeidMatch" },
  { href: "/recruiter-network", label: "Partnerprogram" },
  { href: "/contact", label: "Kontakt" },
];

const stederLinks: { href: string; label: string }[] = [
  { href: "/bemanningsbyrå-trondheim", label: "Trondheim" },
  { href: "/bemanningsbyrå-bergen", label: "Bergen" },
  { href: "/bemanningsbyrå-stavanger", label: "Stavanger" },
  { href: "/bemanningsbyrå-kristiansand", label: "Kristiansand" },
];

const candidateFindWork: { href: string; label: string; external?: boolean }[] = [
  { href: "/for-candidates", label: "Find Work in Norway" },
  { href: "/electricians-norway", label: "Electricians in Norway" },
  { href: "/outside-eu-eea", label: "Non-EU Workers" },
  { href: "/welding-specialists", label: "Welding Specialists" },
  { href: "https://jobs.arbeidmatch.no", label: "Browse Open Jobs", external: true },
];

const candidateSupport: { href: string; label: string }[] = [
  { href: "/about", label: "About ArbeidMatch" },
  { href: "/contact", label: "Contact Us" },
  { href: "/blog", label: "Blog" },
];

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DrawerRowLink({
  href,
  children,
  pathname,
  external,
  onClose,
}: {
  href: string;
  children: ReactNode;
  pathname: string;
  external?: boolean;
  onClose: () => void;
}) {
  const active = !external && linkActive(pathname, href);
  const row = active
    ? "border-l-2 border-l-[#C9A84C] pl-[22px] font-medium text-[#C9A84C]"
    : "border-l-2 border-l-transparent font-normal text-white";

  const inner = (
    <span className="inline-flex w-full items-center justify-between gap-2">
      <span>{children}</span>
      {external ? <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden /> : null}
    </span>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${row}`}
        onClick={onClose}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${row}`}
      onClick={onClose}
    >
      {inner}
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-6 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
      {children}
    </p>
  );
}

function readRole(): string | null {
  try {
    return sessionStorage.getItem("roleSelected");
  } catch {
    return null;
  }
}

export default function MobileDrawerContent({
  pathname,
  onClose,
  isPremium,
}: {
  pathname: string;
  onClose: () => void;
  isPremium: boolean;
}) {
  const [role, setRole] = useState<string | null>(null);
  const [soonFeature, setSoonFeature] = useState<string | null>(null);
  const [jobAlertsOpen, setJobAlertsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [jobStatus, setJobStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setRole(readRole());
  }, [pathname]);

  const stateA = role === null || role === "skipped";

  const clearRole = () => {
    try {
      sessionStorage.removeItem("roleSelected");
    } catch {
      /* ignore */
    }
    setRole(null);
  };

  const pickEmployer = () => {
    try {
      sessionStorage.setItem("roleSelected", "employer");
    } catch {
      /* ignore */
    }
    setRole("employer");
  };

  const pickCandidate = () => {
    try {
      sessionStorage.setItem("roleSelected", "candidate");
    } catch {
      /* ignore */
    }
    setRole("candidate");
  };

  const submitJobAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setJobStatus("loading");
    try {
      const res = await fetch("/api/guide-interest-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), specialty: "general", consent: true }),
      });
      const data = (await res.json()) as { success?: boolean };
      if (!res.ok || !data.success) {
        setJobStatus("error");
        return;
      }
      setJobStatus("success");
    } catch {
      setJobStatus("error");
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
        <Link href="/" className="text-xl font-bold" onClick={onClose}>
          <span className="text-white">Arbeid</span>
          <span className="text-[#C9A84C]">Match</span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center text-white"
          onClick={onClose}
        >
          <X className="h-6 w-6" strokeWidth={1.75} />
        </button>
      </div>

      {isPremium ? (
        <div
          className="rounded-[12px] border"
          style={{
            margin: "12px 16px",
            padding: "14px 16px",
            background: "rgba(201,168,76,0.08)",
            borderColor: "rgba(201,168,76,0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <Crown className="h-[18px] w-[18px] shrink-0 text-[#C9A84C]" strokeWidth={1.75} aria-hidden />
            <span className="text-[13px] font-semibold text-[#C9A84C]">Premium Member</span>
          </div>
          <Link href="/premium/browse" onClick={onClose} className="mt-1.5 block text-[13px] text-white hover:text-white/90">
            Browse all guides
          </Link>
        </div>
      ) : null}

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
        {stateA ? (
          <>
            <p className="px-6 py-4 text-[13px] text-white/50">Choose your profile to see relevant options</p>
            <div className="flex gap-2 px-6 pb-4">
              <button
                type="button"
                onClick={pickEmployer}
                className="flex-1 rounded-full border py-2 text-[13px] font-medium text-[#C9A84C]"
                style={{ borderColor: "rgba(201,168,76,0.15)" }}
              >
                Arbeidsgiver
              </button>
              <button
                type="button"
                onClick={pickCandidate}
                className="flex-1 rounded-full border border-white/30 py-2 text-[13px] font-medium text-white/60"
              >
                Job seeker
              </button>
            </div>
            <div className="mx-6 border-t border-white/[0.08]" />
            <SectionLabel>FOR ARBEIDSGIVERE</SectionLabel>
            {employerTjenester.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>OM OSS</SectionLabel>
            {employerOmOss.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>STEDER</SectionLabel>
            <div className="grid grid-cols-2 gap-0">
              {stederLinks.map((item) => (
                <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                  {item.label}
                </DrawerRowLink>
              ))}
            </div>
            <div className="mx-6 my-4 border-t border-white/[0.08]" />
            <SectionLabel>FOR CANDIDATES</SectionLabel>
            {candidateFindWork.map((item) => (
              <DrawerRowLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                external={item.external}
                onClose={onClose}
              >
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>GUIDES AND RESOURCES</SectionLabel>
            <button
              type="button"
              onClick={() => setSoonFeature("dsb-authorization-guide")}
              className="block w-full border-b border-white/[0.04] border-l-2 border-l-transparent px-6 py-3.5 text-left text-[15px] text-white"
            >
              DSB Authorization Guide <span className="ml-2 rounded px-1 py-px text-[9px] font-bold text-[#0f1923]" style={{ background: GOLD }}>Coming soon</span>
            </button>
            <DrawerRowLink href="/premium" pathname={pathname} onClose={onClose}>
              Premium Guides
            </DrawerRowLink>
            <button
              type="button"
              onClick={() => setSoonFeature("workers-rights-guide")}
              className="block w-full border-b border-white/[0.04] border-l-2 border-l-transparent px-6 py-3.5 text-left text-[15px] text-white"
            >
              Workers Rights in Norway
            </button>
            <button
              type="button"
              onClick={() => setSoonFeature("tax-guide")}
              className="block w-full border-b border-white/[0.04] border-l-2 border-l-transparent px-6 py-3.5 text-left text-[15px] text-white"
            >
              Tax Guide for Foreign Workers
            </button>
            <SectionLabel>SUPPORT</SectionLabel>
            {candidateSupport.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
          </>
        ) : null}

        {role === "employer" ? (
          <>
            <div
              className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color: GOLD }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                Arbeidsgiver
              </span>
              <button type="button" onClick={clearRole} className="text-[11px] text-white/30 hover:text-white/50">
                Bytt profil
              </button>
            </div>
            <SectionLabel>TJENESTER</SectionLabel>
            <Link
              href={employerTjenesterStaffing.href}
              onClick={onClose}
              className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${
                linkActive(pathname, employerTjenesterStaffing.href)
                  ? "border-l-2 border-l-[#C9A84C] pl-[22px] font-medium text-[#C9A84C]"
                  : "border-l-2 border-l-transparent font-normal text-[#C9A84C]"
              }`}
            >
              {employerTjenesterStaffing.label}
            </Link>
            {employerTjenester.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>OM OSS</SectionLabel>
            {employerOmOss.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>STEDER</SectionLabel>
            <div className="grid grid-cols-2 gap-0">
              {stederLinks.map((item) => (
                <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                  {item.label}
                </DrawerRowLink>
              ))}
            </div>
            <div className="border-t border-white/[0.06] px-6 py-5">
              <Link
                href="/request"
                onClick={onClose}
                className="block w-full rounded-[10px] py-3.5 text-center text-[14px] font-bold text-[#0f1923]"
                style={{ background: GOLD }}
              >
                Be om kandidater
              </Link>
            </div>
          </>
        ) : null}

        {role === "candidate" ? (
          <>
            <div
              className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color: GOLD }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                Job seeker
              </span>
              <button type="button" onClick={clearRole} className="text-[11px] text-white/30 hover:text-white/50">
                Switch profile
              </button>
            </div>
            <SectionLabel>FIND WORK</SectionLabel>
            {candidateFindWork.map((item) => (
              <DrawerRowLink
                key={item.href}
                href={item.href}
                pathname={pathname}
                external={item.external}
                onClose={onClose}
              >
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>GUIDES AND RESOURCES</SectionLabel>
            <button
              type="button"
              onClick={() => setSoonFeature("dsb-authorization-guide")}
              className="block w-full border-b border-white/[0.04] border-l-2 border-l-transparent px-6 py-3.5 text-left text-[15px] font-normal text-white"
            >
              DSB Authorization Guide <span className="ml-2 rounded px-1 py-px text-[9px] font-bold text-[#0f1923]" style={{ background: GOLD }}>Coming soon</span>
            </button>
            <Link
              href="/premium"
              onClick={onClose}
              className={`flex w-full items-center justify-between border-b border-white/[0.04] px-6 py-3.5 text-[15px] ${
                linkActive(pathname, "/premium")
                  ? "border-l-2 border-l-[#C9A84C] pl-[22px] font-medium text-[#C9A84C]"
                  : "border-l-2 border-l-transparent font-normal text-white"
              }`}
            >
              <span>Premium Guides</span>
              {!isPremium ? (
                <span className="inline-flex shrink-0 items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C9A84C] motion-reduce:animate-none motion-safe:animate-pulse" />
                  <span className="rounded px-1 py-px text-[9px] font-bold text-[#0f1923]" style={{ background: GOLD }}>
                    NEW
                  </span>
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Crown className="h-3.5 w-3.5 text-[#C9A84C]" strokeWidth={2} aria-hidden />
                  <span className="rounded px-1.5 py-px text-[9px] font-bold text-white" style={{ background: "#1D9E75" }}>
                    Member
                  </span>
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setSoonFeature("workers-rights-guide")}
              className="block w-full border-b border-white/[0.04] border-l-2 border-l-transparent px-6 py-3.5 text-left text-[15px] font-normal text-white"
            >
              Workers Rights in Norway
            </button>
            <button
              type="button"
              onClick={() => setSoonFeature("tax-guide")}
              className="block w-full border-b border-white/[0.04] border-l-2 border-l-transparent px-6 py-3.5 text-left text-[15px] font-normal text-white"
            >
              Tax Guide for Foreign Workers
            </button>
            <SectionLabel>SUPPORT</SectionLabel>
            {candidateSupport.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <div className="border-t border-white/[0.06] px-6 py-5">
              <button
                type="button"
                onClick={() => setJobAlertsOpen((o) => !o)}
                className="block w-full rounded-[10px] py-3.5 text-center text-[14px] font-bold text-[#0f1923]"
                style={{ background: GOLD }}
              >
                Register for job alerts
              </button>
              {jobAlertsOpen ? (
                <div className="mt-4 overflow-hidden">
                  {jobStatus === "success" ? (
                    <p className="text-[13px]" style={{ color: GOLD }}>
                      You are on the list. We will be in touch.
                    </p>
                  ) : (
                    <form onSubmit={submitJobAlerts}>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address"
                        className="w-full rounded-[8px] border border-white/[0.12] bg-white/[0.06] px-[14px] py-2.5 text-[13px] text-white placeholder:text-white/40"
                      />
                      <label className="mt-2 flex cursor-pointer items-start gap-2 text-[12px] text-white/[0.55]">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          className="mt-0.5 shrink-0"
                        />
                        <span>I agree to receive job alerts from ArbeidMatch</span>
                      </label>
                      <button
                        type="submit"
                        disabled={jobStatus === "loading"}
                        className="mt-3 w-full rounded-[8px] py-3 text-[14px] font-bold text-[#0f1923] disabled:opacity-60"
                        style={{ background: GOLD }}
                      >
                        Sign me up
                      </button>
                      {jobStatus === "error" ? (
                        <p className="mt-2 text-[13px] text-red-400">Something went wrong. Please try again.</p>
                      ) : null}
                    </form>
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </nav>

      {soonFeature ? (
        <ComingSoonCapture featureName={soonFeature} isOpen onClose={() => setSoonFeature(null)} />
      ) : null}
    </>
  );
}
