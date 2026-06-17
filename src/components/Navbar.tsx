"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

import MobileDrawerContent from "@/components/MobileDrawerContent";
import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import { NAV_CITY_LINKS, NAV_INDUSTRY_LINKS } from "@/lib/navIndustriesLocations";
import { ArrowRight, ChevronDown, UserPlus } from "lucide-react";

const desktopNavTail = [
  { href: "/recruiter-network", label: "Recruiter Network" },
  { href: "/contact", label: "Contact" },
] as const;

function goToCandidateLogin() {
  window.location.assign(CANDIDATE_PORTAL_LOGIN_URL);
}

function goToCandidateSignup() {
  window.location.assign(CANDIDATE_PORTAL_SIGNUP_URL);
}

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
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
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1279px)");
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
    const mq = window.matchMedia("(max-width: 1279px)");
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
              className="fixed inset-0 bg-[#0a0f18]/85 xl:hidden"
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
              className="fixed bottom-0 right-0 top-0 flex w-[min(100vw,320px)] flex-col overflow-y-auto bg-[#0a0f19] xl:hidden"
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
        <div className="mx-auto flex h-[60px] min-h-[60px] w-full max-w-content items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 md:h-16 md:min-h-[64px] md:px-10 xl:h-[72px] xl:min-h-[72px] xl:gap-10 xl:px-20">
          <Link
            href="/"
            className="flex min-h-[44px] min-w-0 shrink-0 items-center gap-2 whitespace-nowrap text-inherit no-underline"
          >
            <span className="shrink-0 text-[1.25rem] font-bold leading-none text-[#C9A84C]" style={{ fontWeight: 700 }}>
              ArbeidMatch
            </span>
            <span
              className="inline-flex shrink-0 items-center justify-center rounded-[4px] bg-[#C9A84C] px-[6px] py-[2px] text-[10px] font-semibold uppercase leading-none tracking-[0.05em] text-[#0D1B2A]"
              aria-hidden
            >
              BETA
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 xl:flex xl:gap-8 2xl:gap-10">
            <Link
              href="/request"
              className={`${navItemClass} ${linkActive(pathname, "/request") ? "font-medium text-white underline decoration-[#C9A84C] decoration-2 underline-offset-[10px]" : ""}`}
            >
              For Employers
            </Link>
            <div className="group relative">
              <button
                type="button"
                className={`${navItemClass} inline-flex items-center gap-1 whitespace-nowrap ${linkActive(pathname, "/for-candidates") ? "font-medium text-white underline decoration-[#C9A84C] decoration-2 underline-offset-[10px]" : ""}`}
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="For candidates menu"
              >
                For Candidates
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 group-hover:rotate-180" aria-hidden />
              </button>
              <div
                className="pointer-events-none invisible absolute left-1/2 top-full z-[300] w-[min(92vw,280px)] -translate-x-1/2 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
                role="region"
                aria-label="For candidates"
              >
                <div className="rounded-lg border border-white/10 bg-[#0D1B2A] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                  <Link
                    href="/for-candidates"
                    className="block rounded-md px-3 py-2 text-[13px] text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    Information for candidates
                  </Link>
                  <div className="mx-2 my-2 border-t border-white/10" role="separator" aria-hidden />
                  <button
                    type="button"
                    onClick={goToCandidateLogin}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)]"
                  >
                    <span>Sign in to your profile</span>
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                  <div className="mx-2 my-2 border-t border-white/10" role="separator" aria-hidden />
                  <button
                    type="button"
                    onClick={goToCandidateSignup}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)]"
                  >
                    <span>Create your profile</span>
                    <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
            {desktopNavTail.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${navItemClass} ${linkActive(pathname, link.href) ? "font-medium text-white underline decoration-[#C9A84C] decoration-2 underline-offset-[10px]" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <div className="group relative">
              <button
                type="button"
                className={`${navItemClass} inline-flex items-center gap-1 whitespace-nowrap`}
                aria-expanded="false"
                aria-haspopup="true"
                aria-label="Industries and locations menu"
              >
                More
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 group-hover:rotate-180" aria-hidden />
              </button>
              <div
                className="pointer-events-none invisible absolute left-1/2 top-full z-[300] w-[min(92vw,440px)] -translate-x-1/2 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
                role="region"
                aria-label="Industries and locations"
              >
                <div className="rounded-lg border border-white/10 bg-[#0D1B2A] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/90">Industries</p>
                      <ul className="space-y-1">
                        {NAV_INDUSTRY_LINKS.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="block rounded-md px-2 py-1.5 text-[13px] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9A84C]/90">Locations</p>
                      <ul className="space-y-1">
                        {NAV_CITY_LINKS.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="block rounded-md px-2 py-1.5 text-[13px] text-white/75 transition-colors hover:bg-white/5 hover:text-white"
                            >
                              {item.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="hidden shrink-0 xl:block">
            <Link
              href="/request"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[6px] bg-[#C9A84C] px-4 py-2 text-[14px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
            >
              Request candidates
            </Link>
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent xl:hidden"
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
