import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-14 md:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <p className="text-2xl">
            <span className="font-bold text-[#f5f5f5]">Arbeid</span>
            <span className="font-bold text-[#B8860B]">Match</span>
          </p>
          <p className="text-sm text-white/90">Rekruttering og bemanning · Norway</p>
          <p className="text-sm text-white/90">Org.nr. 935 667 089 (MVA)</p>
          <p className="text-sm text-white/90">Sverre Svendsens veg 38, 7056 Ranheim</p>
        </div>

        <div className="space-y-2">
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

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/85">Resources</p>
          <Link href="/dsb-support" className="footer-link-premium block text-sm text-white/90">
            DSB Authorization Guide
          </Link>
          <Link href="/dsb-checklist" className="footer-link-premium block text-sm text-white/90">
            Free DSB Checklist
          </Link>
          <p className="text-sm text-white/90">Looking for jobs?</p>
          <a
            href="/score"
            className="block text-xl font-semibold text-gold"
          >
            Browse open positions →
          </a>
          <a href="mailto:post@arbeidmatch.no" className="footer-link-premium text-sm text-white/90">
            post@arbeidmatch.no
          </a>
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
