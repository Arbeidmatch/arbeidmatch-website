"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/dsb-support", label: "DSB Support" },
  { href: "/download", label: "Download App" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/feedback", label: "Feedback" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-shadow ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <div className="mx-auto flex w-full max-w-content items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-2xl">
          <span className="font-bold text-navy">Arbeid</span>
          <span className="font-bold text-gold">Match</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] text-navy transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/request"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-hover"
          >
            Request Candidates
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-md border border-border p-2 text-navy lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white lg:hidden">
          <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-4 md:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-[15px] text-navy transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/request"
              onClick={() => setOpen(false)}
              className="rounded-md bg-gold px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gold-hover"
            >
              Request Candidates
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
