import { CheckCircle2, DollarSign, Factory, HardHat, Home, Hotel, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";

import TradeSpecialistCards from "@/components/candidates/TradeSpecialistCards";
import CandidateAuthorityDisclaimerBar from "@/components/for-candidates/CandidateAuthorityDisclaimerBar";
import CandidateFeedbackPill from "@/components/for-candidates/CandidateFeedbackPill";
import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerHero from "@/components/premium/StaggerHero";
import { nbPageMetadata } from "@/lib/nbPageMetadata";

export const metadata: Metadata = nbPageMetadata(
  "/for-candidates",
  "Jobb i Norge for EU/EEA-borgere | ArbeidMatch",
  "Finn lovlig arbeid i Norge. ArbeidMatch kobler deg med norske arbeidsgivere innen bygg, logistikk og industri. Søk nå - reelle muligheter, trygge kontrakter.",
);

export default function ForCandidatesPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="bg-[#0D1B2A] py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-6 text-center md:px-12 lg:px-20">
          <StaggerHero className="flex flex-col items-center">
            <h1 className="heading-premium-xl font-display text-4xl text-white md:text-5xl">
              Find legal, quality jobs in Norway
            </h1>
            <p className="subtitle-premium mx-auto mt-5 max-w-2xl text-lg text-white/70">
              We connect qualified EU/EEA workers with Norwegian employers. Contract terms and conditions vary by employer
              and role.
            </p>
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-premium mt-8 inline-block rounded-md bg-gold px-8 py-4 text-lg font-medium text-white hover:bg-gold-hover"
            >
              Browse open positions
            </a>
          </StaggerHero>
        </div>
      </section>

      <TradeSpecialistCards />

      <section className="bg-[#0D1B2A] py-12 md:py-20">
        <div className="mx-auto grid w-full max-w-content grid-cols-1 items-stretch gap-6 px-4 md:grid-cols-2 md:px-6">
          {[
            [
              CheckCircle2,
              "Legal employment",
              "Employment contracts under Norwegian labor law (permanent or temporary depending on the role)",
            ],
            [DollarSign, "Competitive pay", "Salary based on role, experience, and employer terms"],
            [Home, "Accommodation support", "Help finding housing when you arrive in Norway"],
            [Users, "Full support", "Dedicated support throughout your entire process"],
          ].map(([Icon, title, text]) => (
            <ScrollReveal key={title as string} variant="fadeUp">
              <article className="card-premium flex h-full flex-col rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-8 text-white">
                <Icon className="text-gold" size={30} />
                <h3 className="mt-4 text-xl font-semibold text-white">{title as string}</h3>
                <p className="mt-2 text-white/70">{text as string}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-display text-4xl text-white">Industries hiring now</h2>
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
                <a
                  href="https://jobs.arbeidmatch.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="industry-card card-premium card-premium-gold group block h-full cursor-pointer rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-6 no-underline text-white"
                >
                  <Icon className="text-gold" size={26} />
                  <h3 className="mt-4 font-semibold text-white">{title as string}</h3>
                  <span className="mt-3 inline-block text-sm text-gold transition-colors group-hover:text-gold-hover">
                    View jobs →
                  </span>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-12 md:py-20">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-display text-4xl text-white">How to apply</h2>
          </ScrollReveal>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4">
            {[
              "Complete the work readiness check",
              "Apply with your CV in about 2 minutes",
              "Our goal is to contact you within 5 business days",
            ].map((step, i) => (
              <ScrollReveal key={step} variant="fadeUp">
                <p className="rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-6 text-lg text-white">
                  <span className="mr-2 font-bold text-gold">{i + 1}.</span>
                  {step}
                </p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy py-12 text-center md:py-20">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
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

      <section className="bg-[#0D1B2A] py-12 text-center md:py-20">
        <div className="space-y-4">
          <ScrollReveal variant="fadeUp">
            <a
              href="https://jobs.arbeidmatch.no"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold-premium inline-block rounded-md bg-gold px-10 py-4 text-lg font-medium text-white hover:bg-gold-hover"
            >
              Browse all open positions
            </a>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-navy">
        <CandidateAuthorityDisclaimerBar />
      </section>

      <PreFooterCrossLinks variant="candidates" />
      <CandidateFeedbackPill />
    </div>
  );
}
