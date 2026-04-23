"use client";

import Link from "next/link";
import { X } from "lucide-react";

const mobileLinks = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

export default function MobileDrawerContent({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-[#0D1B2A] px-6 py-5">
      <div className="flex shrink-0 items-center justify-between">
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
      <nav className="flex min-h-0 flex-1 flex-col justify-center gap-6">
        {mobileLinks.map((item) => (
          <Link key={item.href} href={item.href} onClick={onClose} className="text-3xl font-semibold tracking-tight text-white transition hover:text-[#C9A84C]">
            {item.label}
          </Link>
        ))}
      </nav>
      <Link
        href="/request"
        onClick={onClose}
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#C9A84C] px-5 py-3.5 text-base font-bold text-[#0D1B2A]"
      >
        Request Candidates
      </Link>
    </div>
  );
}
