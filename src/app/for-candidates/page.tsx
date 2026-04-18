import Link from "next/link";
import { CheckCircle2, DollarSign, Factory, HardHat, Home, Hotel, Sparkles, Users, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Candidates - Jobs in Norway",
  description:
    "Find skilled jobs in Norway through ArbeidMatch. EU/EEA workers welcome. Construction, offshore, transport and more.",
};

export default function ForCandidatesPage() {
  return (
    <>
      <section className="bg-white py-24">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <h1 className="text-4xl font-bold text-navy md:text-5xl">Find legal, quality jobs in Norway</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
            We connect qualified EU/EEA workers with Norwegian employers. Legal contracts, competitive
            conditions, and full support.
          </p>
          <a
            href="/score"
            className="mt-8 inline-block rounded-md bg-gold px-8 py-4 text-lg font-medium text-white hover:bg-gold-hover"
          >
            Browse open positions
          </a>
        </div>
      </section>

      <section className="bg-surface py-16 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-gold/35 bg-navy px-6 py-10 shadow-[0_12px_48px_rgba(13,27,42,0.25)] md:px-10 md:py-12">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex max-w-2xl gap-4">
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold"
                aria-hidden
              >
                <Zap className="h-8 w-8" strokeWidth={2} />
              </span>
              <div>
                <h2 className="mt-1 text-2xl font-bold leading-tight text-white md:text-3xl">
                  DSB Authorization Guides
                </h2>
                <p className="mt-3 text-base leading-relaxed text-white/80 md:text-lg">
                  Everything you need to get legally approved as an electrician in Norway. Step-by-step,
                  official sources, instant access.
                </p>
              </div>
            </div>
            <div className="relative mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dsb-support"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-gold/50 hover:bg-white/10"
              >
                EU/EEA Electricians
              </Link>
              <Link
                href="/dsb-support"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-gold/50 hover:bg-white/10"
              >
                Non-EU Electricians
              </Link>
            </div>
            <p className="relative mt-5 text-sm text-white/60">Instant access after purchase. Valid for 30 days.</p>
          </div>
        </div>
      </section>

      <section className="bg-surface py-24">
        <div className="mx-auto grid w-full max-w-content gap-6 px-4 md:grid-cols-2 md:px-6">
          {[
            [CheckCircle2, "Legal employment", "Permanent contract under Norwegian labor law"],
            [DollarSign, "Competitive pay", "Salary based on role, experience, and employer terms"],
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
                  href="/score"
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
              "Complete the work readiness check",
              "Apply with your CV in about 2 minutes",
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
          <p className="mt-3 text-white/70">Take our 2-minute work readiness check.</p>
          <a
            href="/score"
            className="mt-6 inline-block rounded-md border border-white px-6 py-3 text-white hover:bg-white/10"
          >
            Start readiness check
          </a>
        </div>
      </section>

      <section className="bg-white py-20 text-center">
        <div className="space-y-4">
          <a
            href="/score"
            className="inline-block rounded-md bg-gold px-10 py-4 text-lg font-medium text-white hover:bg-gold-hover"
          >
            Browse all open positions
          </a>
          <div>
            <a href="/feedback" className="text-sm font-medium text-gold hover:text-gold-hover">
              Share feedback about your candidate experience
            </a>
          </div>
          <div>
            <a href="/dsb-assistance" className="text-sm font-medium text-gold hover:text-gold-hover">
              Need DSB support info for electricians?
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
