import Link from "next/link";
import type { Metadata } from "next";
import DsbPillarFromMarkdown from "@/components/dsb/DsbPillarFromMarkdown";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";
import { nbPageMetadata } from "@/lib/nbPageMetadata";
import DsbTypeSelectorLoader from "./DsbTypeSelectorLoader";

export const metadata: Metadata = nbPageMetadata(
  "/dsb-support",
  "DSB-godkjenning elektriker utenlandsk – komplett guide | ArbeidMatch",
  "Lær om DSB autorisasjon elektriker, dokumentasjon, tidslinje og vanlige avslagsårsaker. Veiledning for arbeidsgivere og kandidater – ta kontakt for støtte.",
);

export default function DsbSupportPage() {
  return (
    <>
      <DsbTypeSelectorLoader disableAutoOpen />
      <section className="border-b border-border bg-white">
        <div className="mx-auto w-full max-w-content px-4 py-10 md:px-6 md:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Fagartikkel</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-navy md:text-4xl">
            DSB-godkjenning for utenlandske elektrikere i Norge: Komplett guide 2025
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-text-secondary">
            Arbeidsgivere trenger trygg dokumentasjon før elektrisk arbeid starter. Denne guiden forklarer DSB-godkjenning
            elektriker utenlandsk i et arbeidsrettet språk, med vekt på prosess, dokumentasjon og realistisk tidsbruk.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dsb-support/eu"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-gold-hover"
            >
              EU/EEA-guide
            </Link>
            <Link
              href="/dsb-support/non-eu"
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-navy px-5 py-2.5 text-sm font-semibold text-navy hover:bg-surface"
            >
              Utenfor EU/EEA-guide
            </Link>
            <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
              Kontakt oss
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
          { href: "/for-employers", label: "For arbeidsgivere" },
          { href: "/for-candidates", label: "For kandidater" },
          { href: "/dsb-checklist", label: "Last ned DSB-sjekkliste" },
          { href: "/bemanningsbyrå-trondheim", label: "Bemanning Trondheim" },
        ]}
      />
    </>
  );
}
