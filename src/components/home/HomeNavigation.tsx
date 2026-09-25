"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Menu, UserPlus, X } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import { CANDIDATE_PORTAL_LOGIN_URL, CANDIDATE_PORTAL_SIGNUP_URL } from "@/lib/candidatePortal";
import { JOBS_PORTAL_URL } from "@/lib/featureFlags";

const desktopNavTail = [
  { href: "/recruiter-network", label: "Recruiter Network", labelNo: "Rekrutterernettverk" },
  { href: "/contact", label: "Contact", labelNo: "Kontakt" },
] as const;

function goToCandidateSignup() {
  window.location.assign(CANDIDATE_PORTAL_SIGNUP_URL);
}

function navigateAfterClose(closeMenu: () => void, navigate: () => void) {
  closeMenu();
  requestAnimationFrame(() => navigate());
}

export function HomeNavigation({ lang }: { lang: "en" | "no" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [candidatesMenuOpen, setCandidatesMenuOpen] = useState(false);
  const no = lang === "no";

  const closeMenu = () => setOpen(false);
  const closeCandidatesMenu = () => setCandidatesMenuOpen(false);
  const navigateAfterCloseCandidates = (navigate: () => void) => navigateAfterClose(closeCandidatesMenu, navigate);
  const navItemClass =
    "shrink-0 text-[15px] font-normal text-white/70 transition-[color,font-weight,text-decoration-color] duration-150 hover:font-medium hover:text-white";

  return (
    <header className="sticky top-0 z-[210] border-b border-[rgba(255,255,255,0.06)] bg-[#0D1B2A] text-white">
      <div className="mx-auto flex h-[60px] min-h-[60px] w-full max-w-content items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 md:h-16 md:min-h-[64px] md:px-10 xl:h-[72px] xl:min-h-[72px] xl:gap-10 xl:px-20">
        <BrandMark href={no ? "/no" : "/"} logoSize={34} />

        <nav aria-label={no ? "Hovedmeny" : "Main navigation"} className="hidden min-w-0 flex-1 items-center justify-center gap-6 xl:flex xl:gap-8 2xl:gap-10">
          <Link href="/for-employers" className={navItemClass}>
            {no ? "For bedrifter" : "For Employers"}
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setCandidatesMenuOpen(true)}
            onMouseLeave={closeCandidatesMenu}
            onFocusCapture={() => setCandidatesMenuOpen(true)}
            onBlurCapture={(e) => {
              const next = e.relatedTarget;
              if (next instanceof Node && e.currentTarget.contains(next)) return;
              closeCandidatesMenu();
            }}
          >
            <button
              type="button"
              className={`${navItemClass} inline-flex items-center gap-1 whitespace-nowrap`}
              aria-expanded={candidatesMenuOpen}
              aria-haspopup="true"
              aria-label={no ? "Meny for kandidater" : "For candidates menu"}
            >
              {no ? "For kandidater" : "For Candidates"}
              <ChevronDown
                className={`h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 ${candidatesMenuOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            <div
              className={`absolute left-1/2 top-full z-[300] w-[min(92vw,280px)] -translate-x-1/2 pt-2 transition-[opacity,visibility] duration-150 ${
                candidatesMenuOpen
                  ? "pointer-events-auto visible opacity-100"
                  : "pointer-events-none invisible opacity-0"
              }`}
              role="region"
              aria-label={no ? "For kandidater" : "For candidates"}
              aria-hidden={!candidatesMenuOpen}
            >
              <div className="rounded-lg border border-white/10 bg-[#0D1B2A] p-2 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
                <a
                  href={JOBS_PORTAL_URL}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)]"
                >
                  <span>{no ? "Se ledige jobber" : "Browse open jobs"}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </a>
                <div className="mx-2 my-2 border-t border-white/10" role="separator" aria-hidden />
                <button
                  type="button"
                  onClick={() => navigateAfterCloseCandidates(goToCandidateSignup)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-[13px] font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)]"
                >
                  <span>{no ? "Registrer deg" : "Sign Up"}</span>
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                </button>
                <div className="mx-2 my-2 border-t border-white/10" role="separator" aria-hidden />
                <a
                  href={CANDIDATE_PORTAL_LOGIN_URL}
                  className="flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold text-[#C9A84C] transition-colors hover:bg-[rgba(201,168,76,0.08)]"
                >
                  <span>{no ? "Ansattportal" : "Employee portal"}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </a>
                <div className="mx-2 my-2 border-t border-white/10" role="separator" aria-hidden />
                <Link
                  href="/for-candidates"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateAfterCloseCandidates(() => router.push("/for-candidates"));
                  }}
                  className="block rounded-md px-3 py-2 text-[13px] text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {no ? "Informasjon for kandidater" : "Information for candidates"}
                </Link>
              </div>
            </div>
          </div>
          {desktopNavTail.map((link) => (
            <Link key={link.href} href={link.href} className={navItemClass}>
              {no ? link.labelNo : link.label}
            </Link>
          ))}
        </nav>

        {/* HIS CHANGE, 25 September 2026: the gold button signs a candidate up.
            The jobs stay one step away, under For Candidates. */}
        <div className="hidden shrink-0 xl:block">
          <a
            href={CANDIDATE_PORTAL_SIGNUP_URL}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[6px] bg-[#C9A84C] px-4 py-2 text-[14px] font-semibold text-[#0D1B2A] transition-colors hover:bg-[#b8953f]"
          >
            {no ? "Registrer deg" : "Sign Up"}
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? (no ? "Lukk meny" : "Close menu") : (no ? "Apne meny" : "Open menu")}
          aria-expanded={open}
          aria-controls="home-mobile-nav"
          onClick={() => setOpen(!open)}
          className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-md border-0 bg-transparent xl:hidden"
        >
          <span className="sr-only">Menu</span>
          {open ? <X className="h-6 w-6 text-[#C9A84C]" strokeWidth={1.75} /> : <Menu className="h-6 w-6 text-[#C9A84C]" strokeWidth={1.75} />}
        </button>
      </div>
      {open ? (
        <nav
          id="home-mobile-nav"
          aria-label={no ? "Mobilmeny" : "Mobile navigation"}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeMenu();
          }}
          className="border-t border-white/10 px-5 py-3 xl:hidden"
        >
          <Link href="/for-employers" onClick={closeMenu} className="block rounded-lg px-3 py-3 text-sm hover:bg-white/10">
            {no ? "For bedrifter" : "For Employers"}
          </Link>
          <Link href="/for-candidates" onClick={closeMenu} className="block rounded-lg px-3 py-3 text-sm hover:bg-white/10">
            {no ? "For kandidater" : "For Candidates"}
          </Link>
          <Link href="/recruiter-network" onClick={closeMenu} className="block rounded-lg px-3 py-3 text-sm hover:bg-white/10">
            {no ? "Rekrutterernettverk" : "Recruiter Network"}
          </Link>
          <Link href="/contact" onClick={closeMenu} className="block rounded-lg px-3 py-3 text-sm hover:bg-white/10">
            {no ? "Kontakt" : "Contact"}
          </Link>
          <a href={JOBS_PORTAL_URL} onClick={closeMenu} className="block rounded-lg px-3 py-3 text-sm hover:bg-white/10">
            {no ? "Se ledige jobber" : "Browse open jobs"}
          </a>
          <a href={CANDIDATE_PORTAL_SIGNUP_URL} onClick={closeMenu} className="block rounded-lg px-3 py-3 text-sm font-semibold text-[#C9A84C]">
            {no ? "Registrer deg" : "Sign Up"}
          </a>
        </nav>
      ) : null}
    </header>
  );
}
