"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, X } from "lucide-react";

const GOLD = "#C9A84C";

const primaryMenuLinks = [
  { href: "/request", label: "For Employers" },
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/contact", label: "Contact" },
] as const;

const moreMenuLinks = [
  { href: "/about", label: "About" },
  { href: "/dsb-support", label: "DSB Authorization Guide" },
  { href: "/premium", label: "Premium Guides" },
  { href: "/outside-eu-eea", label: "Non-EU Workers" },
  { href: "/blog", label: "Blog" },
  { href: "/bemanning-bygg-anlegg", label: "Construction" },
  { href: "/bemanning-industri", label: "Industry" },
  { href: "/bemanning-logistikk", label: "Logistics" },
  { href: "/bemanning-renhold", label: "Cleaning" },
  { href: "/bemanning-horeca", label: "Hospitality" },
  { href: "/welding-specialists", label: "Welding Specialists" },
  { href: "/electricians-norway", label: "Electricians in Norway" },
  { href: "/for-staffing-agencies", label: "Become a partner agency" },
  { href: "/partners", label: "Our partner agencies" },
  { href: "/bemanningsbyrå-trondheim", label: "Trondheim" },
  { href: "/bemanningsbyrå-bergen", label: "Bergen" },
  { href: "/bemanningsbyrå-stavanger", label: "Stavanger" },
  { href: "/bemanningsbyrå-kristiansand", label: "Kristiansand" },
] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function DrawerRowLink({
  href,
  children,
  pathname,
  onClose,
}: {
  href: string;
  children: ReactNode;
  pathname: string;
  onClose: () => void;
}) {
  const active = linkActive(pathname, href);
  const row = active
    ? "border-l-2 border-l-[#C9A84C] pl-[22px] font-medium text-[#C9A84C]"
    : "border-l-2 border-l-transparent font-normal text-white";

  return (
    <Link
      href={href}
      className={`block min-h-[44px] border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${row}`}
      onClick={onClose}
    >
      {children}
    </Link>
  );
}

function DrawerMoreLink({ href, children, pathname, onClose }: { href: string; children: ReactNode; pathname: string; onClose: () => void }) {
  const active = linkActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`block min-h-[44px] border-b border-white/[0.04] py-3 pl-10 pr-6 text-[14px] leading-snug transition-colors ${
        active ? "font-medium text-[#C9A84C]" : "font-normal text-white/70 hover:text-white/90"
      }`}
    >
      {children}
    </Link>
  );
}

export default function MobileDrawerContent({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-0 items-center gap-2 text-inherit no-underline"
          onClick={onClose}
        >
          <span className="shrink-0 text-xl font-bold leading-none text-[#C9A84C]" style={{ fontWeight: 700 }}>
            ArbeidMatch
          </span>
          <span
            className="inline-flex shrink-0 items-center justify-center rounded-[4px] bg-[#C9A84C] px-[6px] py-[2px] text-[10px] font-semibold uppercase leading-none tracking-[0.05em] text-[#0D1B2A]"
            aria-hidden
          >
            BETA
          </span>
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

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="px-6 pb-2 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
            Menu
          </p>
        </div>
        {primaryMenuLinks.map((item) => (
          <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
            {item.label}
          </DrawerRowLink>
        ))}

        <div className="border-b border-white/[0.06] px-6 py-4">
          <Link
            href="/request"
            onClick={onClose}
            className="flex min-h-[44px] w-full items-center justify-center rounded-[6px] bg-[#C9A84C] px-4 py-3 text-[14px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            Request candidates
          </Link>
        </div>

        <div className="border-b border-white/[0.06]">
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between px-6 py-3.5 text-left text-[15px] font-medium text-white"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <span>More</span>
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-white/70 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {moreOpen ? (
            <div className="pb-2">
              {moreMenuLinks.map((item) => (
                <DrawerMoreLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
                  {item.label}
                </DrawerMoreLink>
              ))}
            </div>
          ) : null}
        </div>
      </nav>
    </>
  );
}
