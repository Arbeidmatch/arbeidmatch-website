"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const GOLD = "#C9A84C";

const employerLinks: { href: string; label: string }[] = [
  { href: "/request", label: "Request candidates" },
  { href: "/for-staffing-agencies", label: "For staffing agencies" },
];

const mainLinks: { href: string; label: string }[] = [
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

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
      className={`block border-b border-white/[0.04] px-6 py-3.5 text-[15px] transition-colors ${row}`}
      onClick={onClose}
    >
      {children}
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

export default function MobileDrawerContent({ pathname, onClose }: { pathname: string; onClose: () => void }) {
  return (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
        <Link href="/" className="text-xl font-bold text-[#C9A84C]" onClick={onClose}>
          ArbeidMatch
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
        <SectionLabel>For Employers</SectionLabel>
        {employerLinks.map((item) => (
          <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
            {item.label}
          </DrawerRowLink>
        ))}

        <SectionLabel>Menu</SectionLabel>
        {mainLinks.map((item) => (
          <DrawerRowLink key={item.href} href={item.href} pathname={pathname} onClose={onClose}>
            {item.label}
          </DrawerRowLink>
        ))}

        <div className="border-b border-white/[0.06] px-6 py-4">
          <Link
            href="/request"
            onClick={onClose}
            className="flex min-h-[44px] w-full items-center justify-center rounded-[6px] bg-[#C9A84C] text-[14px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            Request candidates
          </Link>
        </div>
      </nav>
    </>
  );
}
