import Link from "next/link";
import { CheckCircle2, DollarSign, Factory, HardHat, Home, Hotel, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";

import ForCandidatesDsbSection from "@/components/for-candidates/ForCandidatesDsbSection";
import CandidateFeedbackPill from "@/components/for-candidates/CandidateFeedbackPill";
import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerHero from "@/components/premium/StaggerHero";

export const metadata: Metadata = {
  title: "For Candidates - Jobs in Norway",
  description:
    "Find skilled jobs in Norway through ArbeidMatch. EU/EEA workers welcome. Construction, offshore, transport and more.",
};

export default function ForCandidatesPage() {
  return (
    <>
      <section className="bg-white py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <StaggerHero className="flex flex-col items-center">
            <h1 className="heading-premium-xl font-display text-4xl text-navy md:text-5xl">
              Find legal, quality jobs in Norway
            </h1>
            <p className="subtitle-premium mx-auto mt-5 max-w-2xl text-lg">
              We connect qualified EU/EEA workers with Norwegian employers. Legal contracts, competitive conditions, and
              full support.
            </p>
            <a
              href="/score"
              className="btn-gold-premium mt-8 inline-block rounded-md bg-gold px-8 py-4 text-lg font-medium text-white hover:bg-gold-hover"
            >
              Browse open positions
            </a>
          </StaggerHero>
        </div>
      </section>

      <ForCandidatesDsbSection />

      <section className="bg-surface py-12 md:py-20">
        <div className="mx-auto grid w-full max-w-content gap-6 px-4 md:grid-cols-2 md:px-6">
          {[
            [CheckCircle2, "Legal employment", "Permanent contract under Norwegian labor law"],
            [DollarSign, "Competitive pay", "Salary based on role, experience, and employer terms"],
            [Home, "Accommodation support", "Help finding housing when you arrive in Norway"],
            [Users, "Full support", "Dedicated support throughout your entire process"],
          ].map(([Icon, title, text]) => (
            <ScrollReveal key={title as string} variant="fadeUp">
              <article className="card-premium rounded-xl border border-border bg-white p-8">
                <Icon className="text-gold" size={30} />
                <h3 className="mt-4 text-xl font-semibold text-navy">{title as string}</h3>
                <p className="mt-2 text-text-secondary">{text as string}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-white py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-display text-4xl text-navy">Industries hiring now</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              [HardHat, "Construction & Renovation"],
              [Factory, "Industry & Production"],
              [Sparkles, "Cleaning & Facility"],
              [Hotel, "Hotel, Restaurant & Café"],
              [Users, "Care & Health"],
              [DollarSign, "Logistics & Warehouse"],
            ].map(([Icon, title]) => (
              <ScrollReveal key={title as string} variant="fadeUp">
                <Link
                  href="/score"
                  className="industry-card card-premium card-premium-gold group block h-full cursor-pointer rounded-xl border border-border bg-white p-6 no-underline"
                >
                  <Icon className="text-gold" size={26} />
                  <h3 className="mt-4 font-semibold text-navy">{title as string}</h3>
                  <span className="mt-3 inline-block text-sm text-gold transition-colors group-hover:text-gold-hover">
                    View jobs →
                  </span>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-display text-4xl text-navy">How to apply</h2>
          </ScrollReveal>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4">
            {[
              "Complete the work readiness check",
              "Apply with your CV in about 2 minutes",
              "Our team contacts you within 5 business days",
            ].map((step, i) => (
              <ScrollReveal key={step} variant="fadeUp">
                <p className="rounded-xl border border-border bg-white p-6 text-lg text-navy">
                  <span className="mr-2 font-bold text-gold">{i + 1}.</span>
                  {step}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-12 text-center md:py-20">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp">
            <h2 className="heading-premium-xl text-3xl text-white">Not sure if you qualify?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mt-3 text-white/70">Take our 2-minute work readiness check.</p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <a
              href="/score"
              className="btn-outline-premium mt-6 inline-block rounded-md border border-white px-6 py-3 text-white hover:bg-white/10"
            >
              Start readiness check
            </a>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-white py-12 text-center md:py-20">
        <div className="space-y-4">
          <ScrollReveal variant="fadeUp">
            <a
              href="/score"
              className="btn-gold-premium inline-block rounded-md bg-gold px-10 py-4 text-lg font-medium text-white hover:bg-gold-hover"
            >
              Browse all open positions
            </a>
          </ScrollReveal>
        </div>
      </section>

      <PreFooterCrossLinks variant="candidates" />
      <CandidateFeedbackPill />
    </>
  );
}
