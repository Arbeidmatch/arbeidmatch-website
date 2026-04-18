"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/recruiter-network", label: "Partner Program" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/feedback", label: "Feedback" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-[100] transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ease-out ${
        scrolled
          ? "border-b border-[rgba(184,134,11,0.15)] bg-[rgba(10,12,20,0.92)] shadow-[0_1px_40px_rgba(0,0,0,0.28)] backdrop-blur-[20px] backdrop-saturate-[180%] md:min-h-[64px]"
          : "border-b border-white/20 bg-[rgba(255,255,255,0.88)] py-1 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md md:min-h-[80px]"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-content items-center justify-between px-4 transition-[padding] duration-300 ease-out md:px-6 ${
          scrolled ? "py-2 md:py-3" : "py-4"
        }`}
      >
        <Link
          href="/"
          className={`block origin-left text-2xl transition-transform duration-300 ease-out ${
            scrolled ? "scale-[0.95] md:scale-[0.95]" : "scale-100"
          }`}
        >
          <span className={`font-bold ${scrolled ? "text-[#f5f5f5]" : "text-[#0D1B2A]"}`}>Arbeid</span>
          <span className="font-bold text-[#B8860B]">Match</span>
        </Link>

        <nav className="hidden items-center gap-5 xl:gap-7 2xl:gap-8 xl:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-premium shrink-0 text-[14px] transition-colors duration-300 ease-out 2xl:text-[15px] ${
                scrolled
                  ? "text-[#cccccc] hover:text-white"
                  : "text-[#555555] hover:text-[#0D1B2A]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden xl:block">
          <Link
            href="/request"
            className="btn-gold-premium relative inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
          >
            Request Candidates
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border p-0 xl:hidden ${
            scrolled ? "border-white/20 text-white" : "border-border text-navy"
          }`}
        >
          <span className="sr-only">Menu</span>
          <span className="flex h-4 w-5 flex-col justify-center gap-1.5">
            <motion.span
              className={`block h-0.5 w-5 rounded-full ${scrolled ? "bg-[#f5f5f5]" : "bg-[#0D1B2A]"}`}
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className={`block h-0.5 w-5 rounded-full ${scrolled ? "bg-[#f5f5f5]" : "bg-[#0D1B2A]"}`}
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className={`block h-0.5 w-5 rounded-full ${scrolled ? "bg-[#f5f5f5]" : "bg-[#0D1B2A]"}`}
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`overflow-hidden border-t transition-colors duration-300 xl:hidden ${
              scrolled
                ? "border-white/10 bg-[#0c0f18] text-white"
                : "border-border bg-white text-[#555555]"
            }`}
          >
            <div className="mx-auto flex max-w-content flex-col gap-1 px-4 py-3 md:px-6">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`min-h-[44px] rounded-md px-2 py-3 text-[15px] transition-colors duration-300 ${
                    scrolled ? "text-white/90 hover:bg-white/5 hover:text-white" : "hover:bg-surface hover:text-[#0D1B2A]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/request"
                onClick={() => setOpen(false)}
                className="btn-gold-premium mt-1 flex min-h-[48px] items-center justify-center rounded-md bg-gold py-3 text-center text-sm font-medium text-white hover:bg-gold-hover"
              >
                Request Candidates
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
