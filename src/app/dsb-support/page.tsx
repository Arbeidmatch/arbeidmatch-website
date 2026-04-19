import Link from "next/link";
import type { Metadata } from "next";
import DsbApplicationChecklist from "@/components/dsb/DsbApplicationChecklist";
import DsbEmployerGuide from "@/components/dsb/DsbEmployerGuide";
import DsbPillarFromMarkdown from "@/components/dsb/DsbPillarFromMarkdown";
import DsbRequestPopup from "@/components/dsb/DsbRequestPopup";
import DsbCompleteGuide from "@/components/dsb/DsbCompleteGuide";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";
import DsbTypeSelectorLoader from "./DsbTypeSelectorLoader";

const SITE = "https://www.arbeidmatch.no";
const canonical = `${SITE}/dsb-support`;

export const metadata: Metadata = {
  title: { absolute: "DSB Authorization for Electricians in Norway | ArbeidMatch" },
  description:
    "Complete guide and checklist for EU/EEA electricians applying for DSB authorization in Norway. Documents required, processing times, and step-by-step guidance.",
  alternates: {
    canonical,
    languages: {
      nb: canonical,
      en: `${SITE}/en`,
      ro: `${SITE}/ro`,
      pl: `${SITE}/pl`,
    },
  },
  openGraph: {
    title: "DSB Authorization for Electricians in Norway | ArbeidMatch",
    description:
      "Complete guide and checklist for EU/EEA electricians applying for DSB authorization in Norway. Documents required, processing times, and step-by-step guidance.",
    locale: "en_US",
    siteName: "ArbeidMatch",
    type: "website",
    url: canonical,
  },
  twitter: {
    card: "summary_large_image",
    title: "DSB Authorization for Electricians in Norway | ArbeidMatch",
    description:
      "Complete guide and checklist for EU/EEA electricians applying for DSB authorization in Norway. Documents required, processing times, and step-by-step guidance.",
  },
};

export default function DsbSupportPage() {
  return (
    <>
      <DsbTypeSelectorLoader disableAutoOpen />
      <section className="border-b border-border bg-white">
        <div className="mx-auto w-full max-w-content px-4 py-10 md:px-6 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Guide</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-navy md:text-4xl">
            DSB authorisation for foreign electricians in Norway: complete overview 2025
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-text-secondary">
            Employers need reliable documentation before electrical work starts. This guide explains DSB authorisation for
            foreign electricians in practical terms, with emphasis on process, documentation, and realistic timelines.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dsb-support/eu"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-gold-hover"
            >
              EU/EEA guide
            </Link>
            <Link
              href="/dsb-support/non-eu"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-surface"
            >
              Outside EU/EEA guide
            </Link>
            <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
              Contact us
            </Link>
          </div>
        </div>
      </section>
      <section className="bg-surface">
        <DsbPillarFromMarkdown />
      </section>
      <SeeAlsoSection
        variant="white"
        items={[
          { href: "/for-employers", label: "For employers" },
          { href: "/for-candidates", label: "For candidates" },
          { href: "/dsb-support", label: "DSB Authorization Guide" },
          { href: "/bemanningsbyrå-trondheim", label: "Bemanning Trondheim" },
        ]}
      />
      <DsbEmployerGuide />
      <DsbApplicationChecklist />
      <DsbRequestPopup />
      <DsbCompleteGuide />
    </>
  );
}
