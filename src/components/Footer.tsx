"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
const companyLinks: [string, string][] = [
  ["For Employers", "/for-employers"],
  ["For Candidates", "/for-candidates"],
  ["Request Candidates", "/request"],
  ["Partners", "/partners"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Recruiter Network", "/recruiter-network"],
];

const servicesLinks: [string, string][] = [
  ["Construction", "/bemanning-bygg-anlegg"],
  ["Logistics", "/bemanning-logistikk"],
  ["Industry", "/bemanning-industri"],
  ["Cleaning", "/bemanning-renhold"],
  ["Hospitality", "/bemanning-horeca"],
  ["Healthcare", "/bemanning-helse"],
  ["Welding Specialists", "/welding-specialists"],
];

const locationLinks: [string, string][] = [
  ["Trondheim", "/bemanningsbyrå-trondheim"],
  ["Bergen", "/bemanningsbyrå-bergen"],
  ["Stavanger", "/bemanningsbyrå-stavanger"],
  ["Kristiansand", "/bemanningsbyrå-kristiansand"],
];

const resourcesLinks: [string, string][] = [
  ["Premium Guides", "/premium"],
  ["Electricians in Norway", "/electricians-norway"],
  ["Welding Specialists", "/welding-specialists"],
  ["DSB Authorization Guide", "/dsb-support"],
  ["Blog", "/blog"],
];

function FooterHeading({ children }: { children: string }) {
  return <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)]">{children}</p>;
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-3 block text-sm text-[rgba(255,255,255,0.6)] transition-colors hover:text-white">
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0a0f18] text-white">
      <div className="border-t border-[rgba(201,168,76,0.15)] bg-[#0a0f18] py-16">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-3">
            <p className="text-2xl leading-none whitespace-nowrap">
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.3rem" }}>Arbeid</span>
              <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: "1.3rem" }}>Match</span>
            </p>
            <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.5)]">EU/EEA Workforce Solutions for Norway</p>
            <div className="mt-6">
              <p className="text-sm text-[#C9A84C]">post@arbeidmatch.no</p>
              <p className="mt-1 text-xs text-[rgba(255,255,255,0.35)]">Org.nr 935 667 089 MVA</p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>Company</FooterHeading>
            {companyLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>Services</FooterHeading>
            {servicesLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
          </div>

          <div className="lg:col-span-2">
            <FooterHeading>Locations</FooterHeading>
            {locationLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
          </div>

          <div className="lg:col-span-3">
            <FooterHeading>Resources</FooterHeading>
            {resourcesLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
            <p className="mt-2 text-xs text-[rgba(255,255,255,0.5)]">Looking for jobs?</p>
            <Link
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent("footer_jobs_click")}
              className="mt-2 block text-[15px] font-semibold text-[#C9A84C] transition-colors hover:text-[#d8bc6a]"
            >
              Browse open positions →
            </Link>
            <p className="mt-2 text-[13px] text-[rgba(255,255,255,0.5)]">post@arbeidmatch.no</p>
          </div>
        </div>
      </div>

      <div className="border-y border-[rgba(201,168,76,0.08)] bg-[rgba(255,255,255,0.02)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-center gap-6 px-6 py-7 md:flex-row md:items-center md:justify-between md:gap-12">
          <div>
            <p className="text-base font-bold text-[#C9A84C]">ArbeidMatch App</p>
            <p className="mt-1 text-sm text-white/70">Find work. Track applications. Stay connected.</p>
            <p className="mt-1 text-xs text-white/55">Mobile app coming soon</p>
            <Link
              href="/download"
              className="mt-3 inline-block text-sm font-semibold text-[#C9A84C] transition-colors hover:text-[#d8bc6a]"
            >
              Join the waitlist →
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] bg-[#0a0f18]">
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-2 px-6 py-4 md:flex-row md:items-center">
          <p className="text-xs text-[rgba(255,255,255,0.35)]">© 2026 ArbeidMatch Norge AS. All rights reserved.</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">
            Org.nr 935 667 089 MVA | Sverre Svendsens veg 38, 7056 Ranheim, Trondheim
          </p>
        </div>
      </div>
    </footer>
  );
}
