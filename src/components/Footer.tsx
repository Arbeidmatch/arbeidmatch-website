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

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid w-full max-w-content grid-cols-1 justify-items-center gap-12 px-4 py-14 text-center lg:grid-cols-4 lg:justify-items-stretch lg:gap-10 lg:text-left md:px-6">
        <div className="w-full max-w-sm space-y-3 lg:max-w-none">
          <p className="text-2xl">
            <span className="font-bold text-[#f5f5f5]">Arbeid</span>
            <span className="font-bold text-[#B8860B]">Match</span>
          </p>
          <p className="text-sm text-white/90">Rekruttering og bemanning · Norway</p>
          <p className="text-sm text-white/90">Org.nr. 935 667 089 (MVA)</p>
          <p className="text-sm text-white/90">Sverre Svendsens veg 38, 7056 Ranheim</p>
        </div>

        <div className="w-full max-w-sm space-y-2 lg:max-w-none">
          {[
            ["For Employers", "/for-employers"],
            ["For Candidates", "/for-candidates"],
            ["Request Candidates", "/request"],
            ["DSB Support", "/dsb-support"],
            ["Partners", "/partners"],
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Feedback", "/feedback"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="footer-link-premium block text-sm text-white/90">
              {label}
            </Link>
          ))}
          <p className="pt-4 text-xs font-semibold uppercase tracking-wide text-white/85">Network</p>
          <Link href="/recruiter-network" className="footer-link-premium block text-sm text-white/90">
            Recruiter Network
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-3 lg:max-w-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/85">Resources</p>
          <Link href="/dsb-support" className="footer-link-premium block text-sm text-white/90">
            DSB Authorization Guide
          </Link>
          <Link href="/dsb-checklist" className="footer-link-premium block text-sm text-white/90">
            Free DSB Checklist
          </Link>
          <p className="text-sm text-white/90">Looking for jobs?</p>
          <a href="/score" className="block text-xl font-semibold text-gold">
            Browse open positions →
          </a>
          <a href="mailto:post@arbeidmatch.no" className="footer-link-premium text-sm text-white/90">
            post@arbeidmatch.no
          </a>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-4 border-t border-white/10 pt-10 lg:max-w-none lg:border-t-0 lg:pt-0 lg:items-end lg:text-right">
          <SmartphoneIcon />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gold">ArbeidMatch App</p>
            <p className="text-sm leading-relaxed text-white/85">Find work. Track your applications. Stay connected.</p>
            <p className="text-xs text-white/55">Available on iOS and Android</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center lg:w-full lg:flex-col lg:items-end">
            <a
              href="/download"
              aria-label="Download on the App Store (coming soon)"
              className="footer-app-store-btn"
            >
              <IconApple size={22} />
              <span className="text-left leading-tight">
                Download on the <span className="block text-[0.95rem] text-white">App Store</span>
              </span>
            </a>
            <a href="/download" aria-label="Get it on Google Play (coming soon)" className="footer-app-store-btn">
              <IconPlay size={22} />
              <span className="text-left leading-tight">
                Get it on <span className="block text-[0.95rem] text-white">Google Play</span>
              </span>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto w-full max-w-content px-4 py-4 text-sm text-white/85 md:px-6">
          © 2026{" "}
          <span className="font-medium text-[#f5f5f5]">Arbeid</span>
          <span className="font-medium text-[#B8860B]">Match</span> Norge AS · All rights reserved
        </p>
      </div>
    </footer>
  );
}
