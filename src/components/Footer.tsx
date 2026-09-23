"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { langForPath } from "@/lib/pageLang";

import { ProtectedEmail } from "@/components/ProtectedEmail";
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

export default function Footer() {
  const no = langForPath(usePathname()) === "nb";
  return (
    <footer className="overflow-x-clip border-t border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] text-[rgba(255,255,255,0.5)]">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-10 md:px-10 md:py-12 lg:px-12 lg:py-16">
        <div className="mb-10 md:mb-12">
          <Link href="/" className="inline-block text-[1.3rem] font-bold leading-none text-[#C9A84C]">
            ArbeidMatch
          </Link>
          <div className="mt-5 flex flex-col gap-2 text-sm text-white/70">
            <p>
              {no ? "Generelle henvendelser:" : "General enquiries:"}{" "}
              <ProtectedEmail username="post" domain="arbeidmatch.no" className="text-white/85 hover:underline" loadingLabel="post@arbeidmatch.no" />
            </p>
            <p>
              {no ? "Teknisk hjelp:" : "Technical support:"}{" "}
              <ProtectedEmail username="support" domain="arbeidmatch.no" className="text-white/85 hover:underline" loadingLabel="support@arbeidmatch.no" />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-12">
          <div>
            <FooterColumnTitle>{no ? "For bedrifter" : "For Employers"}</FooterColumnTitle>
            <FooterNavLink href="/request" label={no ? "Send en gratis forespørsel" : "Request Candidates"} />
            <FooterNavLink href="/#how-it-works" label={no ? "Slik jobber vi" : "How it works"} />
            <FooterNavLink href="/for-staffing-agencies" label={no ? "Bli partnerbyrå" : "Become a partner agency"} />
            <FooterNavLink href="/contact" label={no ? "Kontakt" : "Contact"} />
            <FooterNavLink href="/newsletter#employers" label={no ? "Motta relevante kandidatpresentasjoner" : "Receive matching candidate presentations"} />
          </div>

          <div>
            <FooterColumnTitle>{no ? "For kandidater" : "For Candidates"}</FooterColumnTitle>
            <FooterNavLink href={JOBS_PORTAL_URL} label={no ? "Se jobber og søk" : "Browse jobs and apply"} />
            <FooterNavLink href="/for-candidates" label={no ? "For kandidater" : "For candidates"} />
            <FooterNavLink href="/newsletter#candidates" label={no ? "Nye jobbvarsler på e-post" : "New job alerts by email"} />
            <FooterNavLink href="/contact" label={no ? "Kontakt" : "Contact"} />
          </div>

          <div>
            <FooterColumnTitle>{no ? "Vilkår og personvern" : "Legal"}</FooterColumnTitle>
            <FooterNavLink href="/privacy" label={no ? "Personvern" : "Privacy Policy"} />
            <FooterNavLink href="/terms" label={no ? "Vilkår" : "Terms of Service"} />
            <FooterNavLink href="/cookies" label={no ? "Informasjonskapsler" : "Cookie Policy"} />
          </div>
        </div>
        {/* His correction, 13 September 2026: the "not an official authority" disclaimer
            and the DSB / Arbeidstilsynet / NAV links made no sense on the page. Nobody
            mistakes a staffing company for a government office; do not put them back. */}
      </div>

      <div className="border-t border-[rgba(255,255,255,0.08)]">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-center text-xs leading-relaxed text-[rgba(255,255,255,0.5)] md:px-10 lg:px-12">
          © 2026 ArbeidMatch Norge AS · Org.nr 935 667 089 MVA · Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway ·{" "}
          <ProtectedEmail
            username="post"
            domain="arbeidmatch.no"
            className="text-[rgba(255,255,255,0.5)] no-underline hover:text-[rgba(255,255,255,0.85)]"
            loadingLabel=""
          />{" "}
          · arbeidmatch.no
        </div>
      </div>
    </footer>
  );
}
