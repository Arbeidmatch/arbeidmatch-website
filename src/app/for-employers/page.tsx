import Link from "next/link";
import type { Metadata } from "next";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerHero from "@/components/premium/StaggerHero";
import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";

export const metadata: Metadata = {
  title: "For Employers - Find EU/EEA Workers",
  description:
    "Request pre-screened EU/EEA candidates for your Norwegian company. Construction, offshore, transport, automotive and more.",
};

export default function ForEmployersPage() {
  return (
    <>
      <section className="bg-white py-28 lg:py-32">
        <div className="mx-auto w-full max-w-content px-4 text-center md:px-6">
          <StaggerHero className="flex flex-col items-center">
            <h1 className="heading-premium-xl font-display text-4xl text-navy md:text-5xl">
              Qualified EU/EEA workforce for Norwegian businesses
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-text-secondary">
              We help employers in construction, logistics and industry secure reliable workers quickly, legally and with
              full support.
            </p>
            <Link
              href="/request"
              className="btn-gold-premium mt-8 inline-block rounded-md bg-gold px-8 py-3 font-medium text-white hover:bg-gold-hover"
            >
              Request candidates
            </Link>
          </StaggerHero>
        </div>
      </section>

      <HowItWorks />

      <section className="bg-surface py-28 lg:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp" className="text-center">
            <h2 className="heading-premium-xl font-display text-4xl text-navy">Our services</h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              [
                "Sourcing",
                "Targeted outreach across EU/EEA countries to identify candidates that match your exact needs.",
              ],
              [
                "Screening",
                "Structured interviews, documentation checks and trade relevance validation before presentation.",
              ],
              [
                "Staffing & Compliance",
                "Support with contracts, onboarding and compliance with Norwegian labor requirements.",
              ],
            ].map(([title, text]) => (
              <ScrollReveal key={title} variant="fadeUp">
                <article className="card-premium rounded-xl border border-border bg-white p-8">
                  <h3 className="text-xl font-semibold text-navy">{title}</h3>
                  <p className="mt-3 text-text-secondary">{text}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="mesh-cta-wrap bg-navy py-24 text-center lg:py-28">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp">
            <h2 className="heading-premium-xl text-3xl text-white">Need workers now?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-4 max-w-2xl text-white/70">
              Send your staffing request and our team will start sourcing immediately.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium mt-8 inline-block rounded-md bg-gold px-8 py-3 font-medium text-white hover:bg-gold-hover"
            >
              Request candidates
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <PreFooterCrossLinks variant="employers" />
    </>
  );
}
