import Link from "next/link";

import { JOBS_PORTAL_URL } from "@/lib/featureFlags";

function FooterColumnTitle({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[rgba(255,255,255,0.55)] md:mb-4">
      {children}
    </p>
  );
}

function FooterNavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 block min-h-[44px] py-2 text-sm leading-snug text-[rgba(255,255,255,0.5)] transition-colors hover:text-[rgba(255,255,255,0.85)] lg:min-h-0 lg:py-0"
    >
      {label}
    </Link>
  );
}

function FooterExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-3 block min-h-[44px] py-2 text-sm leading-snug text-[rgba(255,255,255,0.5)] transition-colors hover:text-[rgba(255,255,255,0.85)] lg:min-h-0 lg:py-0"
    >
      {label}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="overflow-x-clip border-t border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] text-[rgba(255,255,255,0.5)]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-10 md:px-10 md:py-12 lg:px-12 lg:py-16">
        <div className="mb-10 md:mb-12">
          <Link href="/" className="inline-block text-[1.3rem] font-bold leading-none text-[#C9A84C]">
            ArbeidMatch
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          <div>
            <FooterColumnTitle>For Employers</FooterColumnTitle>
            <FooterNavLink href="/request" label="Request Candidates" />
            <FooterNavLink href="/#how-it-works" label="How it works" />
            <FooterNavLink href="/for-staffing-agencies" label="Become a partner agency" />
            <FooterNavLink href="/contact" label="Contact" />
          </div>

          <div>
            <FooterColumnTitle>For Candidates</FooterColumnTitle>
            <FooterExternalLink href={JOBS_PORTAL_URL} label="Browse jobs and apply" />
            <FooterNavLink href="/for-candidates" label="For candidates" />
            <FooterNavLink href="/contact" label="Contact" />
          </div>

          <div>
            <FooterColumnTitle>Legal</FooterColumnTitle>
            <FooterNavLink href="/privacy" label="Privacy Policy" />
            <FooterNavLink href="/terms" label="Terms of Service" />
          </div>
        </div>

        <div className="mt-10 border-t border-[rgba(255,255,255,0.08)] pt-8 md:mt-12 md:pt-10">
          <p className="mx-auto max-w-[900px] text-center text-[11px] italic leading-relaxed text-white/45">
            ArbeidMatch is a private recruitment agency, not an official Norwegian authority. We share practical guidance to
            help foreign workers navigate the process. Always verify legal requirements with official sources.
          </p>
          <p className="mx-auto mt-2 max-w-[900px] text-center text-[11px] leading-relaxed">
            <a
              href="https://www.dsb.no/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/50 no-underline transition-colors hover:text-white/70 hover:underline"
            >
              DSB.no
            </a>
            <span className="text-white/35"> · </span>
            <a
              href="https://www.arbeidstilsynet.no/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/50 no-underline transition-colors hover:text-white/70 hover:underline"
            >
              Arbeidstilsynet.no
            </a>
            <span className="text-white/35"> · </span>
            <a
              href="https://www.nav.no/en/home"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/50 no-underline transition-colors hover:text-white/70 hover:underline"
            >
              NAV.no
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center text-xs leading-relaxed text-[rgba(255,255,255,0.5)] md:px-10 lg:px-12">
          © 2026 ArbeidMatch Norge AS · Org.nr 935 667 089 MVA · Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway ·
          support@arbeidmatch.no · arbeidmatch.no
        </div>
      </div>
    </footer>
  );
}
