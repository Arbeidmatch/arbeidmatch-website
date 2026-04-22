import Link from "next/link";
import type { Metadata } from "next";
import HowItWorksInteractive from "@/components/home/HowItWorksInteractive";
import Testimonials from "@/components/Testimonials";
import ScrollReveal from "@/components/ScrollReveal";
import StaggerHero from "@/components/premium/StaggerHero";
import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import ForEmployersExtendedServices from "@/components/for-employers/ForEmployersExtendedServices";
import OurServicesSection from "@/components/for-employers/OurServicesSection";
import WeldingSpecialistsCard from "@/components/welding/WeldingSpecialistsCard";

export const metadata: Metadata = {
  title: "Hire EU/EEA Workers in Norway | ArbeidMatch",
  description:
    "Get pre-screened EU/EEA professionals for construction, logistics, and industry in Norway. Submit your staffing request to ArbeidMatch.",
};

export default function ForEmployersPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 text-center md:px-12 lg:px-20">
          <StaggerHero className="flex flex-col items-center">
            <h1 className="heading-premium-xl font-display text-4xl text-white md:text-5xl">
              Qualified EU/EEA workforce for Norwegian businesses
            </h1>
            <p className="subtitle-premium mx-auto mt-5 max-w-2xl text-lg text-white/70">
              We help employers in construction, logistics and industry secure reliable workers quickly, legally and with
              full support.
            </p>
            <Link
              href="/request"
              className="btn-gold-premium mt-8 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:mx-auto sm:w-auto sm:max-w-none"
            >
              Request candidates
            </Link>
            <Link
              href="/engineers-technical"
              className="mt-4 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md border border-[rgba(201,168,76,0.35)] px-8 py-3 font-medium text-white transition-colors hover:bg-[rgba(201,168,76,0.08)] sm:mx-auto sm:w-auto sm:max-w-none"
            >
              Explore Engineers &amp; Technical
            </Link>
          </StaggerHero>
        </div>
      </section>

      <HowItWorksInteractive />

      <section className="bg-[#0D1B2A] py-10 md:py-12 lg:py-14">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <BemanningLegalSection />
        </div>
      </section>

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <OurServicesSection />
      </section>

      <ForEmployersExtendedServices />

      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <WeldingSpecialistsCard />
      </section>

      <Testimonials />

      <section className="mesh-cta-wrap bg-navy py-12 text-center md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 heading-premium-xl font-extrabold text-white">Need workers now?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-4 max-w-2xl text-white/70">
              Send your staffing request and our team will start sourcing immediately.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium mt-8 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:mx-auto sm:w-auto sm:max-w-none"
            >
              Request candidates
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <PreFooterCrossLinks variant="employers" />
    </div>
  );
}
