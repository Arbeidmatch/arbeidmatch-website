"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import MobileDrawerContent from "@/components/MobileDrawerContent";
import {
  employerMegaResources,
  employerMegaSolutions,
  premiumEmployerCenter,
} from "@/lib/navigationDualLinks";

const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/" || href.startsWith("http")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const navLinkClass =
  "text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white";
const navLinkActiveClass = "text-white";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    startTransition(() => {
      setIsOpen(false);
      setMegaOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onMq = () => {
      if (!mq.matches) setIsOpen(false);
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }
    const mq = window.matchMedia("(max-width: 1023px)");
    if (!mq.matches) {
      document.body.style.overflow = "";
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  const mobilePortal =
    mounted &&
    createPortal(
      <AnimatePresence initial={false}>
        {isOpen ? (
          <>
            <motion.button
              key="mobile-nav-backdrop"
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[280] bg-[#0a0f18]/80 backdrop-blur-sm lg:hidden"
              onClick={closeMenu}
            />
            <motion.aside
              key="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: DRAWER_EASE }}
              className="fixed inset-0 z-[281] flex h-[100dvh] w-full flex-col overflow-hidden bg-[#0D1B2A] lg:hidden"
            >
              <MobileDrawerContent onClose={closeMenu} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-[rgba(201,168,76,0.1)] bg-[rgba(13,27,42,0.95)] backdrop-blur-md transition-shadow duration-200 ${
          isOpen ? "shadow-none" : "shadow-[0_1px_0_rgba(0,0,0,0.2)]"
        }`}
      >
        <div className="mx-auto flex h-16 min-h-[64px] w-full max-w-content items-center justify-between gap-6 px-5 md:px-10 lg:px-16">
          <Link href="/" className="group flex shrink-0 items-center gap-0 text-lg font-bold tracking-tight">
            <span className="text-white transition-colors group-hover:text-white">Arbeid</span>
            <span className="text-[#C9A84C]">Match</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 lg:flex">
            <div className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
              <button type="button" className={`${navLinkClass} ${linkActive(pathname, "/for-employers") ? navLinkActiveClass : ""} inline-flex items-center gap-1`}>
                For Employers
                <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform ${megaOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {megaOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 top-full z-[70] mt-3 w-[620px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0D1B2A]/95 p-6 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">Solutions</p>
                        <div className="space-y-2">
                          {employerMegaSolutions.map((item) => (
                            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white">
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">Resources</p>
                        <div className="space-y-2">
                          {employerMegaResources.map((item) => (
                            <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/5 hover:text-white">
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            {premiumEmployerCenter
              .filter((item) => item.label !== "For Employers")
              .map((item) => (
                <Link key={item.href} href={item.href} className={`${navLinkClass} ${linkActive(pathname, item.href) ? navLinkActiveClass : ""}`}>
                  {item.label}
                </Link>
              ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            <Link
              href="/request"
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#C9A84C] px-5 py-2 text-sm font-bold text-[#0D1B2A] transition hover:brightness-105"
            >
              Request Candidates
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent text-[#C9A84C] transition hover:bg-white/[0.06] lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="flex h-[14px] w-[22px] flex-col justify-center gap-[5px]">
              <motion.span
                className="block h-0.5 w-[22px] rounded-sm bg-current"
                style={{ height: 2 }}
                animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.28, ease: DRAWER_EASE }}
              />
              <motion.span
                className="block h-0.5 w-[22px] rounded-sm bg-current"
                style={{ height: 2 }}
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.2, ease: DRAWER_EASE }}
              />
              <motion.span
                className="block h-0.5 w-[22px] rounded-sm bg-current"
                style={{ height: 2 }}
                animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.28, ease: DRAWER_EASE }}
              />
            </span>
          </button>
        </div>
      </header>
      {mobilePortal}
    </>
  );
}
