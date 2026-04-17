import Link from "next/link";
import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About ArbeidMatch",
  description:
    "Learn about ArbeidMatch Norge AS, specialists in EU/EEA recruitment for Norwegian employers since 2024.",
};

export default function AboutPage() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h1 className="text-center text-4xl font-bold text-navy md:text-5xl">About ArbeidMatch Norge AS</h1>

        <div className="mb-12 mt-10 rounded-r-xl border-l-4 border-gold bg-surface p-8">
          <p className="font-semibold text-navy">ARBEIDMATCH NORGE AS</p>
          <p className="mt-2 text-text-secondary">Org.nr. 935 667 089 (MVA-registrert)</p>
          <p className="text-text-secondary">Founded: 08.05.2025</p>
          <p className="text-text-secondary">Industry: 78.200, Utleie av arbeidskraft</p>
          <p className="text-text-secondary">
            Address: Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway
          </p>
          <p className="text-text-secondary">Email: post@arbeidmatch.no | Phone: 967 34 730</p>
        </div>

        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary">
          ArbeidMatch was established in Trondheim in 2025 with one clear mission: to make it
          easier for Norwegian businesses to find qualified workers from the EU/EEA, and to give
          European workers access to legal, high-quality opportunities in Norway. We combine direct
          sourcing, structured screening and a people-first approach to deliver reliable workforce
          solutions.
        </p>

        <div className="mx-auto mt-12 max-w-2xl space-y-4">
          {[
            "2025: Company founded in Trondheim, Norway",
            "2025: Registered in Brønnøysundregistrene (Org.nr. 935 667 089)",
            "2025: VAT registered (MVA)",
            "2025: 500+ successful placements across Norway",
          ].map((item) => (
            <p key={item} className="flex items-center gap-3 text-navy">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              {item}
            </p>
          ))}
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            [CheckCircle2, "Quality", "Every candidate is pre-screened and documented before presentation"],
            [ShieldCheck, "Compliance", "Full Norwegian labor law compliance on every assignment"],
            [Users, "People-first", "We care about both our clients and the workers we place"],
          ].map(([Icon, title, text]) => (
            <article key={title as string} className="rounded-xl border border-border p-8">
              <Icon className="text-gold" />
              <h2 className="mt-4 text-xl font-semibold text-navy">{title as string}</h2>
              <p className="mt-2 text-text-secondary">{text as string}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/request"
            className="inline-block rounded-md bg-gold px-8 py-3 font-medium text-white hover:bg-gold-hover"
          >
            Request candidates
          </Link>
        </div>
      </div>
    </section>
  );
}
