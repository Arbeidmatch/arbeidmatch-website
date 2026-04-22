"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import MobileDrawerContent from "@/components/MobileDrawerContent";
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

import type { DualNavLink } from "@/lib/navigationDualLinks";

const DRAWER_EASE = [0.32, 0.72, 0, 1] as const;
const MORE_EASE = [0.22, 1, 0.36, 1] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/" || href.startsWith("http")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function moreHasActive(pathname: string, links: DualNavLink[]): boolean {
  return links.some((l) => !l.external && linkActive(pathname, l.href));
}

const navLinkClass =
  "text-sm font-medium text-white/70 transition-colors duration-200 hover:text-white";
const navLinkActiveClass = "text-white";

function NavRowLink({
  pathname,
  item,
  onNavigate,
}: {
  pathname: string;
  item: DualNavLink;
  onNavigate?: () => void;
}) {
  const active = item.external ? false : linkActive(pathname, item.href);
  const cls = `${navLinkClass} ${active ? navLinkActiveClass : ""}`;

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onNavigate}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={cls} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

function MoreMenu({
  pathname,
  label,
  links,
  isOpen,
  onOpenChange,
}: {
  pathname: string;
  label: string;
  links: DualNavLink[];
  isOpen: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onOpenChange]);

  const activeMore = moreHasActive(pathname, links);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => onOpenChange(!isOpen)}
        onMouseEnter={() => onOpenChange(true)}
        className={`inline-flex items-center gap-1 rounded-md px-1 py-1.5 text-sm font-medium transition-colors duration-200 ${
          activeMore || isOpen ? "text-white" : "text-white/70 hover:text-white"
        }`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 opacity-50 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="more-dd"
            role="menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: MORE_EASE }}
            className="absolute right-0 top-full z-[60] mt-2 min-w-[220px] rounded-xl border border-[rgba(201,168,76,0.12)] bg-[rgba(13,27,42,0.98)] py-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md"
            onMouseLeave={() => onOpenChange(false)}
          >
            {links.map((item) => (
              <div key={item.href + item.label} role="none">
                {item.external ? (
                  <a
                    role="menuitem"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                    onClick={() => onOpenChange(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    role="menuitem"
                    href={item.href}
                    className={`block px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.06] ${
                      linkActive(pathname, item.href) ? "text-[#C9A84C]" : "text-white/75 hover:text-white"
                    }`}
                    onClick={() => onOpenChange(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [userType, setUserType] = useState<NavigationUserType | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const hasPremium = document.cookie.split(";").some((c) => c.trim().startsWith("premium_token="));
    setIsPremium(hasPremium);
  }, []);

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

  useEffect(() => {
    startTransition(() => {
      setIsOpen(false);
      setMoreOpen(false);
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
              className="fixed bottom-0 right-0 top-0 z-[281] flex h-[100dvh] w-[min(100vw,360px)] flex-col overflow-hidden border-l border-[rgba(201,168,76,0.12)] bg-[#0D1B2A] shadow-[-12px_0_40px_rgba(0,0,0,0.35)] lg:hidden"
            >
              <MobileDrawerContent pathname={pathname} onClose={closeMenu} isPremium={isPremium} />
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
            {userType === null ? (
              <>
                {neutralNavLinks.map((link) => {
                  const active = linkActive(pathname, link.href);
                  if (link.userType) {
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setNavigationUserType(link.userType!)}
                        className={`${navLinkClass} ${active ? navLinkActiveClass : ""}`}
                      >
                        {link.label}
                      </Link>
                    );
                  }
                  return (
                    <Link key={link.href} href={link.href} className={`${navLinkClass} ${active ? navLinkActiveClass : ""}`}>
                      {link.label}
                    </Link>
                  );
                })}
              </>
            ) : userType === "employer" ? (
              <>
                {premiumEmployerCenter.map((item) => (
                  <NavRowLink key={item.href} pathname={pathname} item={item} />
                ))}
                <MoreMenu pathname={pathname} label="More" links={premiumEmployerMore} isOpen={moreOpen} onOpenChange={setMoreOpen} />
              </>
            ) : (
              <>
                {premiumCandidateCenter.map((item) => (
                  <NavRowLink key={item.href + item.label} pathname={pathname} item={item} />
                ))}
                <MoreMenu pathname={pathname} label="More" links={premiumCandidateMore} isOpen={moreOpen} onOpenChange={setMoreOpen} />
              </>
            )}
          </nav>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {userType === "candidate" ? (
              <Link
                href="/candidates"
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#C9A84C] px-5 py-2 text-sm font-bold text-[#0D1B2A] transition hover:brightness-105"
              >
                Create Profile
              </Link>
            ) : (
              <Link
                href="/request"
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#C9A84C] px-5 py-2 text-sm font-bold text-[#0D1B2A] transition hover:brightness-105"
              >
                Request Candidates
              </Link>
            )}
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
