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
  { href: "/bemanningsbyrå-oslo", label: "Oslo" },
  { href: "/bemanningsbyrå-bergen", label: "Bergen" },
  { href: "/bemanningsbyrå-stavanger", label: "Stavanger" },
  { href: "/bemanningsbyrå-kristiansand", label: "Kristiansand" },
];

const mainLinks = [
  { href: "/for-employers", label: "For Employers" },
  { href: "/for-candidates", label: "For Candidates" },
  { href: "/recruiter-network", label: "Partner Program" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/dsb-support", label: "DSB" },
  { href: "/feedback", label: "Feedback" },
];

function linkActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function dropdownHasActive(pathname: string, items: { href: string }[]): boolean {
  return items.some((i) => linkActive(pathname, i.href));
}

const dropdownPanelClass =
  "min-w-[200px] rounded-lg border-[0.5px] border-black/10 bg-white py-2 shadow-none";
const dropdownItemClass =
  "block px-4 py-2.5 text-left text-[14px] text-navy transition-colors duration-150 hover:bg-black/[0.04]";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileSub, setMobileSub] = useState<null | "tjenester" | "steder">(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
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

  const navText = scrolled ? "text-[#cccccc] hover:text-white" : "text-[#555555] hover:text-[#0D1B2A]";
  const navTextBase = `shrink-0 text-[14px] transition-colors duration-300 ease-out 2xl:text-[15px] ${navText}`;

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

        <nav className="hidden items-center gap-5 xl:flex xl:gap-5 2xl:gap-6">
          {mainLinks.slice(0, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-premium ${navTextBase} ${linkActive(pathname, link.href) ? "font-medium underline decoration-gold decoration-2 underline-offset-4" : ""}`}
            >
              {link.label}
            </Link>
          ))}

          <div className="group/tjen relative">
            <span
              className={`nav-link-premium inline-flex cursor-default items-center gap-1 ${navTextBase} ${
                dropdownHasActive(pathname, tjenesterLinks) ? "font-medium underline decoration-gold decoration-2 underline-offset-4" : ""
              }`}
            >
              Tjenester
              <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </span>
            <div className="pointer-events-none absolute left-0 top-full z-[130] pt-2 opacity-0 transition-[opacity,transform] duration-[180ms] ease-out translate-y-[-4px] group-hover/tjen:pointer-events-auto group-hover/tjen:translate-y-0 group-hover/tjen:opacity-100">
              <div className={dropdownPanelClass}>
                {tjenesterLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${dropdownItemClass} ${linkActive(pathname, item.href) ? "font-medium underline decoration-gold/80" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="group/sted relative">
            <span
              className={`nav-link-premium inline-flex cursor-default items-center gap-1 ${navTextBase} ${
                dropdownHasActive(pathname, stederLinks) ? "font-medium underline decoration-gold decoration-2 underline-offset-4" : ""
              }`}
            >
              Steder
              <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
            </span>
            <div className="pointer-events-none absolute left-0 top-full z-[130] pt-2 opacity-0 transition-[opacity,transform] duration-[180ms] ease-out translate-y-[-4px] group-hover/sted:pointer-events-auto group-hover/sted:translate-y-0 group-hover/sted:opacity-100">
              <div className={dropdownPanelClass}>
                {stederLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${dropdownItemClass} ${linkActive(pathname, item.href) ? "font-medium underline decoration-gold/80" : ""}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {mainLinks.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link-premium ${navTextBase} ${linkActive(pathname, link.href) ? "font-medium underline decoration-gold decoration-2 underline-offset-4" : ""}`}
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
              {mainLinks.slice(0, 2).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`min-h-[44px] rounded-md px-2 py-3 text-[15px] transition-colors duration-300 ${
                    scrolled ? "text-white/90 hover:bg-white/5 hover:text-white" : "hover:bg-surface hover:text-[#0D1B2A]"
                  } ${linkActive(pathname, link.href) ? "font-medium underline decoration-gold" : ""}`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                type="button"
                aria-expanded={mobileSub === "tjenester"}
                onClick={() => setMobileSub((s) => (s === "tjenester" ? null : "tjenester"))}
                className={`flex min-h-[44px] items-center justify-between rounded-md px-2 py-3 text-left text-[15px] ${
                  scrolled ? "text-white/90 hover:bg-white/5" : "hover:bg-surface"
                }`}
              >
                Tjenester
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${mobileSub === "tjenester" ? "rotate-180" : ""}`} />
              </button>
              {mobileSub === "tjenester" && (
                <div
                  className={`ml-2 flex flex-col border-l pl-3 ${scrolled ? "border-white/15" : "border-black/10"}`}
                >
                  {tjenesterLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`min-h-[40px] py-2 text-[14px] ${scrolled ? "text-white/85" : "text-[#444]"}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              <button
                type="button"
                aria-expanded={mobileSub === "steder"}
                onClick={() => setMobileSub((s) => (s === "steder" ? null : "steder"))}
                className={`flex min-h-[44px] items-center justify-between rounded-md px-2 py-3 text-left text-[15px] ${
                  scrolled ? "text-white/90 hover:bg-white/5" : "hover:bg-surface"
                }`}
              >
                Steder
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${mobileSub === "steder" ? "rotate-180" : ""}`} />
              </button>
              {mobileSub === "steder" && (
                <div
                  className={`ml-2 flex flex-col border-l pl-3 ${scrolled ? "border-white/15" : "border-black/10"}`}
                >
                  {stederLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`min-h-[40px] py-2 text-[14px] ${scrolled ? "text-white/85" : "text-[#444]"}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {mainLinks.slice(2).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`min-h-[44px] rounded-md px-2 py-3 text-[15px] transition-colors duration-300 ${
                    scrolled ? "text-white/90 hover:bg-white/5 hover:text-white" : "hover:bg-surface hover:text-[#0D1B2A]"
                  } ${linkActive(pathname, link.href) ? "font-medium underline decoration-gold" : ""}`}
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
