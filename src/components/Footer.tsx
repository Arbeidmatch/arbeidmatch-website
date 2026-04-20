import Link from "next/link";
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
  return <p className="mb-4 text-[11px] uppercase tracking-[0.1em] text-[rgba(255,255,255,0.4)]">{children}</p>;
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="mb-2.5 block text-sm text-[rgba(255,255,255,0.65)] transition-colors hover:text-white">
      {label}
    </Link>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0a0f18] text-white">
      <div className="w-full border-t border-[rgba(201,168,76,0.15)]" />

      <div className="bg-[#0a0f18] py-16 pb-12">
        <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-10 px-6 md:grid-cols-2 md:px-12 lg:grid-cols-5 lg:gap-8 lg:px-20">
          <div className="lg:col-span-1">
            <p className="text-2xl leading-none whitespace-nowrap">
              <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "1.25rem" }}>Arbeid</span>
              <span style={{ color: "#C9A84C", fontWeight: 700, fontSize: "1.25rem" }}>Match</span>
            </p>
            <p className="mt-4 text-[13px] text-[rgba(255,255,255,0.5)]">EU/EEA Workforce Solutions for Norway</p>
            <p className="mt-4 text-sm font-medium text-[#C9A84C]">post@arbeidmatch.no</p>
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.35)]">Org.nr 935 667 089 MVA</p>
          </div>

          <div>
            <FooterHeading>Company</FooterHeading>
            {companyLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
          </div>

          <div>
            <FooterHeading>Services</FooterHeading>
            {servicesLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
          </div>

          <div>
            <FooterHeading>Locations</FooterHeading>
            {locationLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
          </div>

          <div>
            <FooterHeading>Resources</FooterHeading>
            {resourcesLinks.map(([label, href]) => (
              <FooterLink key={href} href={href} label={label} />
            ))}
            <p className="mt-2 text-sm text-[rgba(255,255,255,0.65)]">Looking for jobs?</p>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-semibold text-[#C9A84C] hover:text-[#d8bc6a]"
            >
              Browse open positions
            </a>
          </div>
        </div>
      </div>

      <div className="border-y border-[rgba(201,168,76,0.08)] bg-[rgba(255,255,255,0.02)]">
        <div className="mx-auto flex w-full max-w-content flex-col items-start justify-between gap-6 px-6 py-8 md:px-12 lg:flex-row lg:items-center lg:px-20">
          <div>
            <p className="text-base font-bold text-[#C9A84C]">ArbeidMatch App</p>
            <p className="mt-1 text-sm text-white/70">Find work. Track applications. Stay connected.</p>
            <p className="mt-1 text-xs text-white/40">Available on iOS and Android</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/download"
              className="rounded-lg border border-[rgba(201,168,76,0.3)] px-5 py-2.5 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.03)]"
            >
              App Store
            </Link>
            <Link
              href="/download"
              className="rounded-lg border border-[rgba(201,168,76,0.3)] px-5 py-2.5 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.03)]"
            >
              Google Play
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] bg-[#0a0f18]">
        <div className="mx-auto flex w-full max-w-content flex-col justify-between gap-2 px-6 py-5 md:px-12 lg:flex-row lg:items-center lg:px-20">
          <p className="text-xs text-[rgba(255,255,255,0.35)]">© 2026 ArbeidMatch Norge AS. All rights reserved.</p>
          <p className="text-xs text-[rgba(255,255,255,0.35)]">
            Org.nr 935 667 089 MVA | Sverre Svendsens veg 38, 7056 Ranheim, Trondheim
          </p>
        </div>
      </div>
    </footer>
  );
}
