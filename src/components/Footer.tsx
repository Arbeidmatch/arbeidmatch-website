import Link from "next/link";

function SmartphoneIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="footer-app-phone-float shrink-0"
      style={{ filter: "drop-shadow(0 0 12px rgba(184,134,11,0.4))" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="footerPhoneStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#C9A84C" />
        </linearGradient>
      </defs>
      <rect
        x="11"
        y="5"
        width="18"
        height="30"
        rx="3"
        fill="none"
        stroke="url(#footerPhoneStrokeGrad)"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="9"
        x2="24"
        y2="9"
        stroke="url(#footerPhoneStrokeGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="31" r="1.25" fill="url(#footerPhoneStrokeGrad)" />
    </svg>
  );
}

function IconApple({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0 text-[#f5f5f5]">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function IconPlay({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-[#f5f5f5]">
      <path
        d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11z"
        stroke="currentColor"
        strokeWidth="1.25"
        opacity="0.9"
      />
      <path d="M10 9.5v5l4.5-2.5L10 9.5z" fill="currentColor" />
    </svg>
  );
}

const tjenesterCol: [string, string][] = [
  ["Bygg & Anlegg", "/bemanning-bygg-anlegg"],
  ["Logistikk", "/bemanning-logistikk"],
  ["Industri", "/bemanning-industri"],
  ["Renhold", "/bemanning-renhold"],
  ["HoReCa", "/bemanning-horeca"],
  ["Helse", "/bemanning-helse"],
  ["Welding Specialists", "/welding-specialists"],
];

const stederCol: [string, string][] = [
  ["Trondheim", "/bemanningsbyrå-trondheim"],
  ["Bergen", "/bemanningsbyrå-bergen"],
  ["Stavanger", "/bemanningsbyrå-stavanger"],
  ["Kristiansand", "/bemanningsbyrå-kristiansand"],
];

const ressurserCol: [string, string][] = [
  ["Premium Guides", "/premium"],
  ["Electricians in Norway", "/electricians-norway"],
  ["Welding Specialists", "/welding-specialists"],
  ["DSB Authorization Guide", "/dsb-support"],
  ["Blog", "/blog"],
  ["Guide: ansette EU-arbeidere", "/blog/ansette-utenlandske-arbeidere-lovlig"],
];

const quickLinks: [string, string][] = [
  ["For Employers", "/for-employers"],
  ["For Candidates", "/for-candidates"],
  ["Request Candidates", "/request"],
  ["Partners", "/partners"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Feedback", "/feedback"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Recruiter Network", "/recruiter-network"],
];

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 justify-items-stretch gap-8 px-6 py-12 text-center sm:grid-cols-2 sm:gap-10 sm:text-left md:px-12 md:py-16 lg:grid-cols-3 lg:gap-12 lg:py-20 xl:grid-cols-5 xl:gap-10">
        <div className="w-full max-w-sm space-y-3 justify-self-center sm:col-span-2 sm:justify-self-start lg:col-span-1 xl:max-w-none">
          <p className="text-2xl">
            <span className="font-bold text-[#f5f5f5]">Arbeid</span>
            <span className="font-bold text-[#B8860B]">Match</span>
          </p>
          <p className="text-sm text-white/90">Rekruttering og bemanning · Norway</p>
        </div>

        <div className="w-full max-w-sm space-y-1 justify-self-center sm:justify-self-start lg:max-w-none">
          <p className="am-eyebrow font-semibold uppercase tracking-wide text-white/85">Snarveier</p>
          {quickLinks.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="footer-link-premium flex min-h-[44px] items-center text-sm text-white/90 sm:min-h-0 sm:py-1"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-1 justify-self-center sm:justify-self-start lg:max-w-none">
          <p className="am-eyebrow font-semibold uppercase tracking-wide text-white/85">Tjenester</p>
          {tjenesterCol.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="footer-link-premium flex min-h-[44px] items-center text-sm text-white/90 sm:min-h-0 sm:py-1"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-1 justify-self-center sm:justify-self-start lg:max-w-none">
          <p className="am-eyebrow font-semibold uppercase tracking-wide text-white/85">Steder</p>
          {stederCol.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="footer-link-premium flex min-h-[44px] items-center text-sm text-white/90 sm:min-h-0 sm:py-1"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="w-full max-w-sm space-y-1 justify-self-center sm:col-span-2 sm:justify-self-start lg:col-span-1 lg:max-w-none">
          <p className="am-eyebrow font-semibold uppercase tracking-wide text-white/85">Ressurser</p>
          {ressurserCol.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="footer-link-premium flex min-h-[44px] items-center text-sm text-white/90 sm:min-h-0 sm:py-1"
            >
              {label}
            </Link>
          ))}
          <p className="pt-3 text-sm text-white/90">Looking for jobs?</p>
          <a
            href="https://jobs.arbeidmatch.no"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-[44px] items-center text-xl font-semibold text-gold"
          >
            Browse open positions →
          </a>
          <a
            href="mailto:post@arbeidmatch.no"
            className="footer-link-premium mt-1 inline-flex min-h-[44px] items-center text-sm text-white/90"
          >
            post@arbeidmatch.no
          </a>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-4 border-t border-white/10 pt-8 sm:col-span-2 sm:pt-10 lg:col-span-1 lg:border-t-0 lg:pt-0 xl:max-w-none xl:items-end xl:text-right">
          <SmartphoneIcon />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gold">ArbeidMatch App</p>
            <p className="text-sm leading-relaxed text-white/85">Find work. Track your applications. Stay connected.</p>
            <p className="text-xs text-white/55">Available on iOS and Android</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center xl:w-full xl:flex-col xl:items-end">
            <Link href="/download" aria-label="Download on the App Store (coming soon)" className="footer-app-store-btn">
              <IconApple size={22} />
              <span className="text-left leading-tight">
                Download on the <span className="block text-[0.95rem] text-white">App Store</span>
              </span>
            </Link>
            <Link href="/download" aria-label="Get it on Google Play (coming soon)" className="footer-app-store-btn">
              <IconPlay size={22} />
              <span className="text-left leading-tight">
                Get it on <span className="block text-[0.95rem] text-white">Google Play</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto w-full max-w-content px-6 py-6 text-center md:px-12 md:text-left lg:px-20">
          <p className="text-sm text-white/85">
            © 2026{" "}
            <span className="font-medium text-[#f5f5f5]">Arbeid</span>
            <span className="font-medium text-[#B8860B]">Match</span> Norge AS · All rights reserved
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/55">
            ArbeidMatch Norge AS · Org.nr. 935 667 089 · Sverre Svendsens veg 38, 7056 Ranheim · post@arbeidmatch.no
          </p>
        </div>
      </div>
    </footer>
  );
}
