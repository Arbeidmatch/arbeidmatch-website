"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Crown, ExternalLink, X } from "lucide-react";

import {
  neutralNavLinks,
  premiumCandidateCenter,
  premiumCandidateMore,
  premiumEmployerCenter,
  premiumEmployerMore,
} from "@/lib/navigationDualLinks";
import {
  getNavigationUserType,
  setNavigationUserType,
  subscribeNavigationUserType,
  type NavigationUserType,
} from "@/lib/navigationUserType";

const GOLD = "#C9A84C";

function linkActive(pathname: string, href: string): boolean {
  if (href === "/" || href.startsWith("http")) return false;
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

  const run = () => {
    onClose();
  };

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${row}`}
        onClick={run}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${row}`} onClick={run}>
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

export default function MobileDrawerContent({
  pathname,
  onClose,
  isPremium,
}: {
  pathname: string;
  onClose: () => void;
  isPremium: boolean;
}) {
  const [userType, setUserType] = useState<NavigationUserType | null>(null);
  useEffect(() => {
    setUserType(getNavigationUserType());
    return subscribeNavigationUserType(() => setUserType(getNavigationUserType()));
  }, []);

  useEffect(() => {
    if (pathname === "/for-employers" || pathname.startsWith("/for-employers/")) {
      if (getNavigationUserType() !== "employer") setNavigationUserType("employer");
    } else if (pathname === "/for-candidates" || pathname.startsWith("/for-candidates/")) {
      if (getNavigationUserType() !== "candidate") setNavigationUserType("candidate");
    }
  }, [pathname]);

  const clearUserType = () => {
    setNavigationUserType(null);
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
        {userType === null ? (
          <>
            <p className="px-6 py-4 text-[13px] text-white/50">Choose your path for a tailored menu</p>
            <SectionLabel>Menu</SectionLabel>
            {neutralNavLinks.map((link) => {
              if (link.userType) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setNavigationUserType(link.userType!);
                      onClose();
                    }}
                    className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${
                      linkActive(pathname, link.href)
                        ? "border-l-2 border-l-[#C9A84C] pl-[22px] font-medium text-[#C9A84C]"
                        : "border-l-2 border-l-transparent font-normal text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <DrawerRowLink key={link.href} href={link.href} pathname={pathname} onClose={onClose}>
                  {link.label}
                </DrawerRowLink>
              );
            })}
          </>
        ) : null}

        {userType === "employer" ? (
          <>
            <div
              className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color: GOLD }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                Employer
              </span>
              <button type="button" onClick={clearUserType} className="text-[11px] text-white/40 hover:text-white/60">
                Change
              </button>
            </div>
            <SectionLabel>Main</SectionLabel>
            {premiumEmployerCenter.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} external={item.external} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>More</SectionLabel>
            {premiumEmployerMore.map((item) => (
              <DrawerRowLink key={item.href} href={item.href} pathname={pathname} external={item.external} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <div className="border-t border-white/[0.06] px-6 py-5">
              <Link
                href="/request"
                onClick={onClose}
                className="block w-full rounded-[10px] py-3.5 text-center text-[14px] font-bold text-[#0f1923]"
                style={{ background: GOLD }}
              >
                Request Candidates
              </Link>
            </div>
          </>
        ) : null}

        {userType === "candidate" ? (
          <>
            <div
              className="flex items-center justify-between border-b border-white/[0.06] px-6 py-3"
              style={{ background: "rgba(201,168,76,0.08)" }}
            >
              <span className="inline-flex items-center gap-2 text-[12px] font-medium" style={{ color: GOLD }}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                Candidate
              </span>
              <button type="button" onClick={clearUserType} className="text-[11px] text-white/40 hover:text-white/60">
                Change
              </button>
            </div>
            <SectionLabel>Main</SectionLabel>
            {premiumCandidateCenter.map((item) => (
              <DrawerRowLink key={item.href + item.label} href={item.href} pathname={pathname} external={item.external} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <SectionLabel>More</SectionLabel>
            {premiumCandidateMore.map((item) => (
              <DrawerRowLink key={item.href + item.label} href={item.href} pathname={pathname} external={item.external} onClose={onClose}>
                {item.label}
              </DrawerRowLink>
            ))}
            <div className="border-t border-white/[0.06] px-6 py-5">
              <Link
                href="/candidates"
                onClick={onClose}
                className="block w-full rounded-[10px] py-3.5 text-center text-[14px] font-bold text-[#0f1923]"
                style={{ background: GOLD }}
              >
                Create Profile
              </Link>
            </div>
          </>
        ) : null}
      </nav>
    </>
  );
}
