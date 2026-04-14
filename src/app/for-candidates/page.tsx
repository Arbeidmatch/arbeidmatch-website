import { CheckCircle2, DollarSign, Factory, HardHat, Home, Hotel, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Candidates — Jobs in Norway",
  description:
    "Find skilled jobs in Norway through ArbeidMatch. EU/EEA workers welcome. Construction, offshore, transport and more.",
};

export default function ForCandidatesPage() {
  return (
    <>
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <h1 className="text-4xl font-bold text-navy md:text-5xl">Find legal, well-paid work in Norway</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
            We connect qualified EU/EEA workers with Norwegian employers. Legal contracts, good pay,
            full support.
          </p>
          <a
            href="https://jobs.arbeidmatch.no"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-md bg-gold px-8 py-4 text-lg font-medium text-white hover:bg-gold-hover"
          >
            Browse open positions
          </a>
        </div>
      </section>

      <section className="bg-surface py-24">
        <div className="mx-auto grid w-full max-w-content gap-6 px-4 md:grid-cols-2 md:px-6">
          {[
            [CheckCircle2, "Legal employment", "Permanent contract under Norwegian labor law"],
            [DollarSign, "Good salary", "250–270 NOK/hour depending on trade and experience"],
            [Home, "Accommodation support", "Help finding housing when you arrive in Norway"],
            [Users, "Full support", "Dedicated support throughout your entire process"],
          ].map(([Icon, title, text]) => (
            <article key={title as string} className="rounded-xl border border-border bg-white p-8">
              <Icon className="text-gold" size={30} />
              <h3 className="mt-4 text-xl font-semibold text-navy">{title as string}</h3>
              <p className="mt-2 text-text-secondary">{text as string}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <h2 className="text-center text-4xl font-bold text-navy">Industries hiring now</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              [HardHat, "Construction & Renovation"],
              [Factory, "Industry & Production"],
              [Sparkles, "Cleaning & Facility"],
              [Hotel, "Hotel, Restaurant & Café"],
              [Users, "Care & Health"],
              [DollarSign, "Logistics & Warehouse"],
            ].map(([Icon, title]) => (
              <article key={title as string} className="rounded-xl border border-border p-6">
                <Icon className="text-gold" size={26} />
                <h3 className="mt-4 font-semibold text-navy">{title as string}</h3>
                <a
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm text-gold"
                >
                  View jobs →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-24">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <h2 className="text-center text-4xl font-bold text-navy">How to apply</h2>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4">
            {[
              "Browse jobs at jobs.arbeidmatch.no",
              "Apply with your CV — takes 2 minutes",
              "Our team contacts you within 5 business days",
            ].map((step, i) => (
              <p key={step} className="rounded-xl border border-border bg-white p-6 text-lg text-navy">
                <span className="mr-2 font-bold text-gold">{i + 1}.</span>
                {step}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-16 text-center">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <h2 className="text-3xl font-bold text-white">Not sure if you qualify?</h2>
          <p className="mt-3 text-white/70">Take our 2-minute eligibility check.</p>
          <a
            href="/score"
            className="mt-6 inline-block rounded-md border border-white px-6 py-3 text-white hover:bg-white/10"
          >
            Check eligibility
          </a>
        </div>
      </section>

      <section className="bg-white py-20 text-center">
        <a
          href="https://jobs.arbeidmatch.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md bg-gold px-10 py-4 text-lg font-medium text-white hover:bg-gold-hover"
        >
          Browse all open positions
        </a>
      </section>
    </>
  );
}
