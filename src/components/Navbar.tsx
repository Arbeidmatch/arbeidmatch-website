"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ExternalLink, X } from "lucide-react";

const tjenesterLinks = [
  { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
  { href: "/bemanning-logistikk", label: "Logistikk" },
  { href: "/bemanning-industri", label: "Industri" },
  { href: "/bemanning-renhold", label: "Renhold" },
  { href: "/bemanning-horeca", label: "HoReCa" },
  { href: "/bemanning-helse", label: "Helse" },
];

const stederLinks = [
  { href: "/bemanningsbyrå-trondheim", label: "Trondheim" },
  { href: "/bemanningsbyrå-bergen", label: "Bergen" },
  { href: "/bemanningsbyrå-stavanger", label: "Stavanger" },
  { href: "/bemanningsbyrå-kristiansand", label: "Kristiansand" },
];

const ressurserLinks: { href: string; label: string; premium?: boolean }[] = [
  { href: "/premium", label: "ArbeidMatch Premium", premium: true },
  { href: "/about", label: "Om oss" },
  { href: "/dsb-support", label: "DSB-godkjenning" },
  { href: "/blog", label: "Blog" },
  { href: "/recruiter-network", label: "Partner Program" },
  { href: "/for-staffing-agencies", label: "For bemanningsbyråer" },
  { href: "/contact", label: "Kontakt" },
];

const primaryDesktopLinks = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/for-candidates", label: "For Candidates" },
] as const;

const megaAllHrefs = [...tjenesterLinks, ...stederLinks, ...ressurserLinks];

const mobileEmployersLinks = [
  { href: "/for-employers", label: "For arbeidsgivere" },
  { href: "/bemanning-bygg-anlegg", label: "Bygg og Anlegg" },
  { href: "/bemanning-logistikk", label: "Logistikk" },
  { href: "/bemanning-industri", label: "Industri" },
  { href: "/bemanning-renhold", label: "Renhold" },
  { href: "/bemanning-horeca", label: "HoReCa" },
  { href: "/bemanning-helse", label: "Helse" },
  { href: "/for-staffing-agencies", label: "For bemanningsbyråer" },
] as const;

const mobileCandidatesLinks = [
  { href: "/for-candidates", label: "Find Work in Norway" },
  { href: "/dsb-support", label: "DSB Authorization Guide" },
  { href: "/premium", label: "Premium Guides", premium: true },
  { href: "https://jobs.arbeidmatch.no", label: "Job Openings", external: true },
] as const;

const mobileCompanyLinks = [
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/recruiter-network", label: "Partner Program" },
  { href: "/contact", label: "Contact" },
] as const;

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function megaHasActive(pathname: string): boolean {
  return megaAllHrefs.some((i) => linkActive(pathname, i.href));
}

const megaColLabelClass =
  "am-eyebrow mb-3 font-semibold uppercase tracking-[0.1em] text-[#C9A84C]";
const megaLinkClass =
  "flex min-h-[44px] min-w-[44px] items-center rounded-md px-6 py-3 text-[14px] text-navy transition-colors duration-150 hover:bg-black/[0.04] lg:min-h-0 lg:min-w-0 lg:px-3 lg:py-2";

const megaPanelInnerClass =
  "rounded-2xl border border-black/[0.06] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)]";

const mobileSectionHeaderClass =
  "px-6 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]";

const mobileLinkRowBase =
  "block border-b border-white/[0.04] py-3.5 text-[15px] transition-colors duration-150";

function MobileNavRow({
  href,
  children,
  delaySec,
  pathname,
  external,
  premium,
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  delaySec: number;
  pathname: string;
  external?: boolean;
  premium?: boolean;
  onNavigate: () => void;
}) {
  const active = !external && linkActive(pathname, href);
  const activeClass = active
    ? "border-l-2 border-l-[#C9A84C] pl-[22px] font-medium text-[#C9A84C]"
    : "border-l-2 border-l-transparent pl-6 text-white";

  const inner = (
    <span className="inline-flex items-center gap-2">
      <span>{children}</span>
      {premium ? <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden /> : null}
      {external ? <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden /> : null}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delaySec, duration: 0.28, ease: "easeOut" }}
    >
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${mobileLinkRowBase} ${activeClass}`}
          onClick={onNavigate}
        >
          {inner}
        </a>
      ) : (
        <Link href={href} className={`${mobileLinkRowBase} ${activeClass}`} onClick={onNavigate}>
          {inner}
        </Link>
      )}
    </motion.div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const onMq = () => {
      if (!mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (!open) {
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
  }, [open]);

  const navItemClass =
    "shrink-0 text-[15px] font-normal text-[#555555] transition-[color,font-weight] duration-150 hover:font-medium hover:text-[#0D1B2A]";

  const headerSurface = scrolled
    ? "border-b border-black/[0.06] bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md"
    : "border-b border-black/[0.06] bg-white/90 backdrop-blur-sm";

  const closeMenu = () => {
    setOpen(false);
  };

  const hamburgerEase = [0.32, 0.72, 0, 1] as const;

  return (
    <header className={`sticky top-0 z-[210] transition-colors duration-200 ${headerSurface}`}>
      <div className="mx-auto flex h-[60px] min-h-[60px] w-full max-w-content items-center justify-between gap-4 px-6 md:h-16 md:min-h-[64px] md:px-12 lg:h-[72px] lg:min-h-[72px] lg:gap-10 lg:px-20">
        <Link href="/" className="block min-h-[44px] shrink-0 text-2xl leading-[44px]">
          <span className="font-bold text-[#0D1B2A]">Arbeid</span>
          <span className="font-bold text-[#B8860B]">Match</span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-10 lg:flex">
          {primaryDesktopLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${navItemClass} ${linkActive(pathname, link.href) ? "font-medium text-[#0D1B2A] underline decoration-[#C9A84C] decoration-2 underline-offset-8" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          <div className="group/mer relative">
            <span
              className={`inline-flex min-h-[44px] cursor-default items-center gap-1 ${navItemClass} ${
                megaHasActive(pathname) ? "font-medium text-[#0D1B2A] underline decoration-[#C9A84C] decoration-2 underline-offset-8" : ""
              }`}
            >
              Mer
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            </span>
            <div className="pointer-events-none invisible absolute left-1/2 top-full z-[130] w-[min(920px,calc(100vw-2rem))] -translate-x-1/2 pt-3 opacity-0 transition-[opacity,transform,visibility] duration-[180ms] ease-out translate-y-[-6px] group-hover/mer:pointer-events-auto group-hover/mer:visible group-hover/mer:translate-y-0 group-hover/mer:opacity-100">
              <div className={megaPanelInnerClass}>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
                  <div>
                    <p className={megaColLabelClass}>Tjenester</p>
                    <ul className="space-y-0.5">
                      {tjenesterLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`${megaLinkClass} ${linkActive(pathname, item.href) ? "font-medium text-gold" : ""}`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className={megaColLabelClass}>Steder</p>
                    <ul className="space-y-0.5">
                      {stederLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`${megaLinkClass} ${linkActive(pathname, item.href) ? "font-medium text-gold" : ""}`}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className={megaColLabelClass}>Ressurser</p>
                    <ul className="space-y-0.5">
                      {ressurserLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`${megaLinkClass} ${linkActive(pathname, item.href) ? "font-medium text-gold" : ""}`}
                          >
                            <span className="inline-flex items-center gap-2">
                              {item.premium ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                              ) : null}
                              <span>{item.label}</span>
                            </span>
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

        <div className="hidden shrink-0 md:block">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-[15px] font-medium text-white hover:bg-gold-hover"
          >
            Request Candidates
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent lg:hidden"
          style={{ width: 44, height: 44 }}
        >
          <span className="sr-only">Menu</span>
          <span className="flex h-[14px] w-[22px] flex-col justify-center gap-[5px]">
            <motion.span
              className="block h-0.5 w-[22px] rounded-[2px] bg-[#C9A84C]"
              style={{ height: 2 }}
              animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: hamburgerEase }}
            />
            <motion.span
              className="block h-0.5 w-[22px] rounded-[2px] bg-[#C9A84C]"
              style={{ height: 2 }}
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.3, ease: hamburgerEase }}
            />
            <motion.span
              className="block h-0.5 w-[22px] rounded-[2px] bg-[#C9A84C]"
              style={{ height: 2 }}
              animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: hamburgerEase }}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Navigasjon"
            className="fixed inset-0 z-[220] flex flex-col bg-[#0a0f19] lg:hidden"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-6 py-5">
              <Link href="/" className="text-xl font-bold" onClick={closeMenu}>
                <span className="text-white">Arbeid</span>
                <span className="text-[#C9A84C]">Match</span>
              </Link>
              <button
                type="button"
                aria-label="Lukk meny"
                className="flex h-11 w-11 items-center justify-center text-white"
                onClick={closeMenu}
              >
                <X className="h-6 w-6" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex shrink-0 gap-3 border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
              <Link
                href="/for-employers"
                onClick={closeMenu}
                className="rounded-full border border-[rgba(201,168,76,0.3)] px-4 py-2 text-[13px] font-medium text-[#C9A84C]"
              >
                Arbeidsgiver
              </Link>
              <Link
                href="/for-candidates"
                onClick={closeMenu}
                className="rounded-full border border-white/[0.15] px-4 py-2 text-[13px] font-medium text-white/[0.6]"
              >
                Candidate
              </Link>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <p className={mobileSectionHeaderClass}>For employers</p>
              {mobileEmployersLinks.map((item, i) => (
                <MobileNavRow
                  key={item.href}
                  href={item.href}
                  delaySec={0.1 + i * 0.05}
                  pathname={pathname}
                  onNavigate={closeMenu}
                >
                  {item.label}
                </MobileNavRow>
              ))}

              <p className={mobileSectionHeaderClass}>For candidates</p>
              {mobileCandidatesLinks.map((item, i) => (
                <MobileNavRow
                  key={item.href}
                  href={item.href}
                  delaySec={0.3 + i * 0.05}
                  pathname={pathname}
                  external={"external" in item && item.external}
                  premium={"premium" in item && item.premium}
                  onNavigate={closeMenu}
                >
                  {item.label}
                </MobileNavRow>
              ))}

              <p className={mobileSectionHeaderClass}>Locations</p>
              <div className="grid grid-cols-2 gap-2 px-6 py-2">
                {stederLinks.map((item, i) => (
                  <MobileNavRow
                    key={item.href}
                    href={item.href}
                    delaySec={0.5 + i * 0.05}
                    pathname={pathname}
                    onNavigate={closeMenu}
                  >
                    {item.label}
                  </MobileNavRow>
                ))}
              </div>

              <p className={mobileSectionHeaderClass}>Company</p>
              {mobileCompanyLinks.map((item, i) => (
                <MobileNavRow
                  key={item.href}
                  href={item.href}
                  delaySec={0.6 + i * 0.05}
                  pathname={pathname}
                  onNavigate={closeMenu}
                >
                  {item.label}
                </MobileNavRow>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
