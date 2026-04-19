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

const ressurserLinks = [
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
  "mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]";
const megaLinkClass =
  "block rounded-md px-3 py-2 text-[14px] text-navy transition-colors duration-150 hover:bg-black/[0.04]";

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

  const navItemClass =
    "shrink-0 text-[15px] font-normal text-[#555555] transition-[color,font-weight] duration-150 hover:font-medium hover:text-[#0D1B2A]";

  const headerSurface = scrolled
    ? "border-b border-black/[0.06] bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-md"
    : "border-b border-black/[0.06] bg-white/90 backdrop-blur-sm";

  return (
    <header className={`sticky top-0 z-[100] transition-colors duration-200 ${headerSurface}`}>
      <div className="mx-auto flex h-[72px] min-h-[72px] w-full max-w-content items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="block shrink-0 text-2xl">
          <span className="font-bold text-[#0D1B2A]">Arbeid</span>
          <span className="font-bold text-[#B8860B]">Match</span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-10 xl:flex">
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
              className={`inline-flex cursor-default items-center gap-1 ${navItemClass} ${
                megaHasActive(pathname) ? "font-medium text-[#0D1B2A] underline decoration-[#C9A84C] decoration-2 underline-offset-8" : ""
              }`}
            >
              Mer
              <ChevronDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
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
            className="btn-gold-premium inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-[15px] font-medium text-white hover:bg-gold-hover"
          >
            Request Candidates
          </Link>
        </div>

        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border border-border text-navy xl:hidden"
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-white text-[#555555] xl:hidden"
          >
            <div className="mx-auto flex max-w-content flex-col gap-1 px-4 py-3 md:px-6">
              {primaryDesktopLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`min-h-[44px] rounded-md px-2 py-3 text-[15px] hover:bg-surface ${linkActive(pathname, link.href) ? "font-medium text-navy underline decoration-gold" : ""}`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                aria-expanded={mobileSub === "mer"}
                onClick={() => setMobileSub((s) => (s === "mer" ? null : "mer"))}
                className="flex min-h-[44px] items-center justify-between rounded-md px-2 py-3 text-left text-[15px] hover:bg-surface"
              >
                Mer
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${mobileSub === "mer" ? "rotate-180" : ""}`} />
              </button>
              {mobileSub === "mer" && (
                <div className="ml-2 flex flex-col gap-4 border-l border-black/10 pl-3 pb-2">
                  <div>
                    <p className={megaColLabelClass}>Tjenester</p>
                    <div className="mt-1 flex flex-col">
                      {tjenesterLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="min-h-[40px] py-2 text-[14px] hover:text-navy"
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
                          onClick={() => setOpen(false)}
                          className="min-h-[40px] py-2 text-[14px] hover:text-navy"
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
                          onClick={() => setOpen(false)}
                          className="min-h-[40px] py-2 text-[14px] hover:text-navy"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
