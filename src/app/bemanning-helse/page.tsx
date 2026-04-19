import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning helse og omsorg",
  description:
    "Hjelpepleiere og helsefaglig støtte der godkjenning kreves. EU/EEA-rekruttering med dokumentasjon – ta kontakt.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanning-helse" },
};

export default function BemanningHelsePage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning helse</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning helse med tydelige krav til autorisasjon
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Helse og omsorg krever sporbar kompetanse. ArbeidMatch arbeider med EU/EEA-kandidater der godkjenning,
            språk og praksis er avklart i tråd med norske krav før presentasjon. Vi erstatter ikke myndighetenes
            vurdering, men hjelper med å samle dokumentasjon og forventningsstyring.
          </p>
          <p>
            Typiske roller er hjelpepleiere, helsefagarbeidere med utenlandsk utdanning som skal inn i norsk system,
            og støttefunksjoner der arbeidsgiver har definert rammer. Vi legger vekt på åpen dialog om hva som er
            realistisk innenfor gitte tidsrammer.
          </p>
          <p>
            Målet er trygg drift for institusjoner og hjemmetjenester som opplever rekrutteringspress, uten å gå på
            akkord med kvalitet og etikk.
          </p>
        </div>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-renhold", label: "Renhold & facility" },
            { href: "/for-employers", label: "For arbeidsgivere" },
            { href: "/for-candidates", label: "For kandidater" },
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Avklar behov
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            For arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
