import Link from "next/link";
import type { Metadata } from "next";
import HowItWorksInteractive from "@/components/home/HowItWorksInteractive";
import Testimonials from "@/components/Testimonials";
import ScrollReveal from "@/components/ScrollReveal";
import PreFooterCrossLinks from "@/components/PreFooterCrossLinks";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import ForEmployersExtendedServices from "@/components/for-employers/ForEmployersExtendedServices";
import OurServicesSection from "@/components/for-employers/OurServicesSection";
import WeldingSpecialistsCard from "@/components/welding/WeldingSpecialistsCard";
import ForEmployersHero from "@/components/for-employers/ForEmployersHero";

export const metadata: Metadata = {
  title: "Hire EU/EEA Workers in Norway | ArbeidMatch",
  description:
    "Get pre-screened EU/EEA professionals for construction, logistics, and industry in Norway. Submit your staffing request to ArbeidMatch.",
};

export default function ForEmployersPage() {
  return (
    <div className="bg-[#06090e] text-white">
      <section className="recruiter-network-hero flex min-h-[88vh] flex-col justify-center py-12 md:py-20">
        <ForEmployersHero />
      </section>

      <HowItWorksInteractive sectionClassName="section-y-home border-t border-white/5 bg-[#06090e]" />

      <section className="border-t border-white/5 bg-[#06090e] py-16 md:py-24 lg:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6 lg:px-12 xl:px-20">
          <ScrollReveal variant="fadeUp">
            <BemanningLegalSection />
          </ScrollReveal>
        </div>
      </section>

      <OurServicesSection />

      <ForEmployersExtendedServices />

      <section className="border-t border-white/5 bg-[#06090e] py-16 md:py-24 lg:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <WeldingSpecialistsCard />
        </div>
      </section>

      <Testimonials sectionClassName="section-y-home border-t border-white/5 bg-[#06090e]" />

      <section className="mesh-cta-wrap border-t border-white/5 bg-[#06090e] py-16 text-center md:py-24 lg:py-32">
        <div className="mx-auto w-full max-w-content px-4 md:px-6">
          <ScrollReveal variant="fadeUp">
            <h2 className="text-balance font-sans text-3xl font-extrabold tracking-[-0.03em] text-white md:text-4xl">
              Need workers now?
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/65 md:text-[17px]">
              Send your staffing request and our team will start sourcing as soon as possible.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium mt-10 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:mx-auto sm:w-auto sm:max-w-none"
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
