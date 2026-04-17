import Link from "next/link";
import TrafficSignals from "@/components/TrafficSignals";

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-14 md:grid-cols-3 md:px-6">
        <div className="space-y-3">
          <p className="text-2xl">
            <span className="font-bold">Arbeid</span>
            <span className="font-bold text-gold">Match</span>
          </p>
          <p className="text-sm text-white/80">Rekruttering og bemanning · Norway</p>
          <p className="text-sm text-white/80">Org.nr. 935 667 089 (MVA)</p>
          <p className="text-sm text-white/80">Sverre Svendsens veg 38, 7056 Ranheim</p>
        </div>

        <div className="space-y-2">
          {[
            ["For Employers", "/for-employers"],
            ["For Candidates", "/for-candidates"],
            ["About", "/about"],
            ["Contact", "/contact"],
            ["Feedback", "/feedback"],
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="block text-sm text-white/80 hover:text-gold">
              {label}
            </Link>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-white/80">Looking for jobs?</p>
          <a
            href="/score"
            className="block text-xl font-semibold text-gold"
          >
            Browse open positions →
          </a>
          <a href="mailto:post@arbeidmatch.no" className="text-sm text-white/80 hover:text-gold">
            post@arbeidmatch.no
          </a>
          <TrafficSignals className="mt-3" />
        </div>
      </div>
      <div className="border-t border-white/15">
        <p className="mx-auto w-full max-w-content px-4 py-4 text-sm text-white/70 md:px-6">
          © 2025 ArbeidMatch Norge AS · All rights reserved
        </p>
      </div>
    </footer>
  );
}
