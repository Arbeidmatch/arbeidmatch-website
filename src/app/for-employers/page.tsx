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

const TITLE = "Arbeidskraft fra EU/EØS til norske bedrifter | ArbeidMatch";
const DESCRIPTION =
  "Forhåndskontrollerte fagfolk fra EU/EØS til bygg og anlegg, logistikk og industri i Norge. Send en bemanningsforespørsel til ArbeidMatch.";

export const metadata: Metadata = {
  alternates: { canonical: "/for-employers" },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: "/for-employers",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch | Rekruttering fra EU/EØS til Norge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function ForEmployersPage() {
  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="bg-[#0D1B2A] py-12 md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 text-center md:px-12 lg:px-20">
          <StaggerHero className="flex flex-col items-center">
            <h1 className="heading-premium-xl font-display text-4xl text-white md:text-5xl">
              Kvalifisert arbeidskraft fra EU/EØS for norske bedrifter
            </h1>
            <p className="subtitle-premium mx-auto mt-5 max-w-2xl text-lg text-white/70">
              Vi hjelper arbeidsgivere innen bygg og anlegg, logistikk og industri med å sikre seg pålitelige
              arbeidstakere raskt, lovlig og med full oppfølging.
            </p>
            <Link
              href="/request"
              className="btn-gold-premium mt-8 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:mx-auto sm:w-auto sm:max-w-none"
            >
              Be om kandidater
            </Link>
            <Link
              href="/annonse/ny"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center text-sm font-medium text-white/75 underline decoration-[#C9A84C] underline-offset-4 hover:text-white"
            >
              Publiser en stillingsannonse selv
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

      <Testimonials lang="nb" />

      <section className="mesh-cta-wrap bg-navy py-12 text-center md:py-16 lg:py-[100px]">
        <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
          <ScrollReveal variant="fadeUp">
            <h2 className="am-h2 heading-premium-xl font-extrabold text-white">Trenger dere folk nå?</h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <p className="mx-auto mt-4 max-w-2xl text-white/70">
              Send oss en bemanningsforespørsel, så begynner teamet vårt å lete etter kandidater med en gang.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp">
            <Link
              href="/request"
              className="btn-gold-premium mt-8 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 font-medium text-[#0D1B2A] hover:bg-gold-hover sm:mx-auto sm:w-auto sm:max-w-none"
            >
              Be om kandidater
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <PreFooterCrossLinks variant="employers" lang="nb" />
    </div>
  );
}
