"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const links = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/download", label: "Download App" },
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
      className={`sticky top-0 z-[100] transition-all duration-[400ms] ease-premium ${
        scrolled
          ? "border-b border-[rgba(184,134,11,0.15)] bg-[rgba(10,12,20,0.85)] shadow-[0_1px_40px_rgba(0,0,0,0.3)] backdrop-blur-[20px] backdrop-saturate-[180%] md:min-h-[64px]"
          : "border-b border-transparent bg-white py-1 md:min-h-[80px]"
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-content items-center justify-between px-4 transition-all duration-[400ms] ease-premium md:px-6 ${
          scrolled ? "py-2 md:py-3" : "py-4"
        }`}
      >
        <Link
          href="/"
          className={`block origin-left text-2xl transition-transform duration-[400ms] ease-premium ${
            scrolled ? "scale-[0.95] md:scale-[0.95]" : "scale-100"
          }`}
        >
          <span className="font-bold text-navy">Arbeid</span>
          <span className="font-bold text-gold">Match</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-premium text-[15px] text-navy transition-colors ${
                scrolled ? "text-white/90 hover:text-gold" : "hover:text-gold"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/request"
            className="btn-gold-premium relative inline-block rounded-md bg-gold px-5 py-2.5 text-sm font-medium text-white hover:bg-gold-hover"
          >
            Request Candidates
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border p-0 lg:hidden ${
            scrolled ? "border-white/20 text-white" : "border-border text-navy"
          }`}
        >
          <span className="sr-only">Menu</span>
          <span className="flex h-4 w-5 flex-col justify-center gap-1.5">
            <motion.span
              className={`block h-0.5 w-5 rounded-full ${scrolled ? "bg-white" : "bg-navy"}`}
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className={`block h-0.5 w-5 rounded-full ${scrolled ? "bg-white" : "bg-navy"}`}
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className={`block h-0.5 w-5 rounded-full ${scrolled ? "bg-white" : "bg-navy"}`}
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
            className="overflow-hidden border-t border-border bg-white lg:hidden"
          >
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
                className="btn-gold-premium rounded-md bg-gold py-2.5 text-center text-sm font-medium text-white hover:bg-gold-hover"
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
