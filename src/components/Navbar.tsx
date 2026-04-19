"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

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

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSub, setMobileSub] = useState<null | "mer">(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setOpen(false);
      setMobileSub(null);
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
    setMobileSub(null);
  };

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
          className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border border-border text-navy lg:hidden"
        >
          <span className="sr-only">Menu</span>
          <span className="flex h-4 w-5 flex-col justify-center gap-1.5">
            <motion.span
              className="block h-0.5 w-5 rounded-full bg-[#0D1B2A]"
              animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.span
              className="block h-0.5 w-5 rounded-full bg-[#0D1B2A]"
              animate={open ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.2 }}
            />
            <motion.span
              className="block h-0.5 w-5 rounded-full bg-[#0D1B2A]"
              animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Lukk meny"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[200] bg-black/40 lg:hidden"
              onClick={closeMenu}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Navigasjon"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 right-0 top-[60px] z-[201] flex max-h-[calc(100dvh-60px)] flex-col bg-white shadow-lg md:top-16 md:max-h-[calc(100dvh-4rem)] lg:hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-4 pt-2">
                {primaryDesktopLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`flex min-h-[44px] items-center rounded-md px-6 py-3 text-[15px] hover:bg-surface ${linkActive(pathname, link.href) ? "font-medium text-navy underline decoration-gold" : "text-[#555555]"}`}
                  >
                    {link.label}
                  </Link>
                ))}

                <button
                  type="button"
                  aria-expanded={mobileSub === "mer"}
                  onClick={() => setMobileSub((s) => (s === "mer" ? null : "mer"))}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-md px-6 py-3 text-left text-[15px] text-[#555555] hover:bg-surface"
                >
                  Mer
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${mobileSub === "mer" ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {mobileSub === "mer" && (
                  <div className="ml-2 flex flex-col gap-4 border-l border-black/10 pl-4 pb-2">
                    <div>
                      <p className={megaColLabelClass}>Tjenester</p>
                      <div className="mt-1 flex flex-col">
                        {tjenesterLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className="flex min-h-[44px] items-center py-2 pl-2 text-[14px] hover:text-navy"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={megaColLabelClass}>Steder</p>
                      <div className="mt-1 flex flex-col">
                        {stederLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className="flex min-h-[44px] items-center py-2 pl-2 text-[14px] hover:text-navy"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={megaColLabelClass}>Ressurser</p>
                      <div className="mt-1 flex flex-col">
                        {ressurserLinks.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMenu}
                            className="flex min-h-[44px] items-center py-2 pl-2 text-[14px] hover:text-navy"
                          >
                            <span className="inline-flex items-center gap-2">
                              {item.premium ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                              ) : null}
                              <span>{item.label}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-border bg-white px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
                <Link
                  href="/request"
                  onClick={closeMenu}
                  className="btn-gold-premium flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-center text-sm font-medium text-white hover:bg-gold-hover"
                >
                  Request Candidates
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
