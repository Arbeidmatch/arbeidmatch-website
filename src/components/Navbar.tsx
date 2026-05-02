"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import MobileDrawerContent from "@/components/MobileDrawerContent";

const employersSubLinks = [
  { href: "/request", label: "Request candidates" },
  { href: "/for-staffing-agencies", label: "For staffing agencies" },
] as const;

const navLinks = [
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function employersNavActive(pathname: string): boolean {
  return employersSubLinks.some((i) => linkActive(pathname, i.href));
}

const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isEmployersOpen, setIsEmployersOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    queueMicrotask(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    startTransition(() => setIsOpen(false));
    startTransition(() => setIsEmployersOpen(false));
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

  const navItemClass =
    "shrink-0 text-[15px] font-normal text-white/70 transition-[color,font-weight,text-decoration-color] duration-150 hover:font-medium hover:text-white";

  const headerSurface = scrolled
    ? "border-b border-[rgba(255,255,255,0.06)] bg-[#0D1B2A] backdrop-blur-md"
    : "border-b border-[rgba(255,255,255,0.06)] bg-[#0D1B2A] backdrop-blur-sm";

  const closeMenu = () => setIsOpen(false);
  const closeEmployersMenu = () => setIsEmployersOpen(false);

  const dropdownLinkClass =
    "flex min-h-[44px] min-w-[44px] items-center rounded-md px-4 py-3 text-[14px] text-[rgba(255,255,255,0.85)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white lg:min-h-0 lg:min-w-0 lg:px-3 lg:py-2";

  const mobilePortal =
    mounted &&
    createPortal(
      <AnimatePresence initial={false}>
        {isOpen ? (
          <>
            <motion.button
              key="mobile-nav-backdrop"
              type="button"
              aria-label="Lukk meny"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0a0f18]/85 lg:hidden"
              style={{ zIndex: 40 }}
              onClick={closeMenu}
            />
            <motion.aside
              key="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigasjon"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: DRAWER_EASE }}
              className="fixed bottom-0 right-0 top-0 flex w-[min(100vw,320px)] flex-col overflow-y-auto bg-[#0a0f19] lg:hidden"
              style={{ zIndex: 50 }}
            >
              <MobileDrawerContent pathname={pathname} onClose={closeMenu} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <header
        className={`sticky top-0 transition-colors duration-200 ${headerSurface} ${isOpen ? "z-30" : "z-[210]"}`}
      >
        <div className="mx-auto flex h-[60px] min-h-[60px] w-full max-w-content items-center justify-between gap-4 px-6 md:h-16 md:min-h-[64px] md:px-12 lg:h-[72px] lg:min-h-[72px] lg:gap-10 lg:px-20">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-fit shrink-0 items-center whitespace-nowrap text-[1.25rem] font-bold text-[#C9A84C]"
          >
            <span className="shrink-0 leading-none">ArbeidMatch</span>
            <span
              className="ml-2 inline-flex shrink-0 items-center justify-center rounded-[4px] bg-[#C9A84C] px-[6px] py-[2px] text-[10px] font-semibold uppercase leading-none tracking-[0.05em] text-[#0D1B2A]"
              aria-hidden
            >
              BETA
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 lg:flex lg:gap-10">
            <div className="relative" onMouseEnter={() => setIsEmployersOpen(true)} onMouseLeave={closeEmployersMenu}>
              <span
                className={`inline-flex min-h-[44px] cursor-default items-center gap-1 ${navItemClass} ${
                  employersNavActive(pathname) ? "font-medium text-white underline decoration-[#C9A84C] decoration-2 underline-offset-[10px]" : ""
                }`}
              >
                For Employers
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              </span>
              <div
                className={`absolute left-1/2 top-full z-[130] min-w-[220px] -translate-x-1/2 pt-3 transition-[opacity,transform,visibility] duration-[180ms] ease-out ${
                  isEmployersOpen
                    ? "pointer-events-auto visible translate-y-0 opacity-100"
                    : "pointer-events-none invisible -translate-y-[6px] opacity-0"
                }`}
              >
                <div className="rounded-xl border border-[rgba(201,168,76,0.12)] bg-[#0D1B2A] py-2 shadow-lg">
                  {employersSubLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeEmployersMenu}
                      className={`${dropdownLinkClass} ${linkActive(pathname, item.href) ? "font-medium text-[#C9A84C]" : ""}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${navItemClass} ${linkActive(pathname, link.href) ? "font-medium text-white underline decoration-[#C9A84C] decoration-2 underline-offset-[10px]" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 md:block">
            <Link
              href="/request"
              className="inline-flex min-h-[40px] min-w-[44px] items-center justify-center rounded-[6px] bg-[#C9A84C] px-4 py-2 text-[14px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Request candidates
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent lg:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="flex h-[14px] w-[22px] flex-col justify-center gap-[5px]">
              <motion.span
                className="block h-0.5 w-[22px] rounded-[2px] bg-[#C9A84C]"
                style={{ height: 2 }}
                animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: DRAWER_EASE }}
              />
              <motion.span
                className="block h-0.5 w-[22px] rounded-[2px] bg-[#C9A84C]"
                style={{ height: 2 }}
                animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.3, ease: DRAWER_EASE }}
              />
              <motion.span
                className="block h-0.5 w-[22px] rounded-[2px] bg-[#C9A84C]"
                style={{ height: 2 }}
                animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3, ease: DRAWER_EASE }}
              />
            </span>
          </button>
        </div>
      </header>
      {mobilePortal}
    </>
  );
}
