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
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[rgba(255,255,255,0.5)]">Influence. Source. Earn.</p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-5 lg:gap-x-8 lg:gap-y-12">
          <div>
            <FooterColumnTitle>For Employers</FooterColumnTitle>
            <FooterNavLink href="/request" label="Request Candidates" />
            <FooterNavLink href="/#how-it-works" label="How it works" />
            <FooterNavLink href="/for-staffing-agencies" label="Become a partner agency" />
            <FooterNavLink href="/contact" label="Contact" />
          </div>

          <div>
            <FooterColumnTitle>For Candidates</FooterColumnTitle>
            <FooterNavLink href="/for-candidates" label="For candidates" />
            <FooterExternalLink href={JOBS_PORTAL_URL} label="Browse jobs and apply" />
            <FooterNavLink href="/dsb-support" label="DSB Authorization Guide" />
            <FooterNavLink href="/premium" label="Premium Guides" />
            <FooterNavLink href="/outside-eu-eea" label="Non-EU Workers" />
            <FooterNavLink href="/electricians-norway" label="Electricians in Norway" />
          </div>

          <div>
            <FooterColumnTitle>Industries & Locations</FooterColumnTitle>
            <FooterNavLink href="/bemanning-bygg-anlegg" label="Construction" />
            <FooterNavLink href="/bemanning-industri" label="Industry" />
            <FooterNavLink href="/bemanning-logistikk" label="Logistics" />
            <FooterNavLink href="/bemanning-renhold" label="Cleaning" />
            <FooterNavLink href="/bemanning-horeca" label="Hospitality" />
            <FooterNavLink href="/welding-specialists" label="Welding Specialists" />
            <FooterNavLink href="/bemanningsbyrå-trondheim" label="Trondheim" />
            <FooterNavLink href="/bemanningsbyrå-bergen" label="Bergen" />
            <FooterNavLink href="/bemanningsbyrå-stavanger" label="Stavanger" />
            <FooterNavLink href="/bemanningsbyrå-kristiansand" label="Kristiansand" />
          </div>

          <div>
            <FooterColumnTitle>Resources & Partners</FooterColumnTitle>
            <FooterNavLink href="/about" label="About" />
            <FooterNavLink href="/blog" label="Blog" />
            <FooterNavLink href="/recruiter-network" label="Recruiter Network" />
            <FooterNavLink href="/partners" label="Our partner agencies" />
          </div>

          <div>
            <FooterColumnTitle>Legal</FooterColumnTitle>
            <FooterNavLink href="/privacy" label="Privacy Policy" />
            <FooterNavLink href="/terms" label="Terms of Service" />
            <FooterNavLink href="/dpa" label="Data Processing Agreement" />
            <FooterNavLink href="/legal-request" label="Legal Request" />
          </div>
        </div>

        <p className="mt-10 text-xs leading-relaxed text-[rgba(255,255,255,0.45)] md:mt-12">
          © 2026 ArbeidMatch Norge AS. Org.nr: 935 667 089 MVA
        </p>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center text-xs leading-relaxed text-[rgba(255,255,255,0.5)] md:px-10 lg:px-12">
          Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway · support@arbeidmatch.no · arbeidmatch.no
        </div>
      </div>
    </footer>
  );
}
