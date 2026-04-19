import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning industri og produksjon",
  description:
    "Operatører, montører og tekniske hjelpearbeidere til industri i Norge. EU/EEA-bemanning med kvalitetssikring – ta kontakt.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanning-industri" },
};

export default function BemanningIndustriPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning industri</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning industri for linjestopp som ikke kan vente
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Produksjonslinjer er avhengige av presisjon, skiftrykk og dokumentert kompetanse på verktøy og prosedyrer.
            ArbeidMatch leverer EU/EEA-kandidater til industriprosjekter der krav til erfaring, sertifikater og
            sikkerhetsbrief er tydelig definert før oppstart.
          </p>
          <p>
            Vi jobber med operatører, montører, sveisehjelp og tekniske assistenter. Screening fokuserer på reell
            erfaring fra tilsvarende miljø – ikke generelle «industri»-etiketter. Målet er stabil kvalitet i skift og
            forutsigbarhet for vedlikeholdsvinduer.
          </p>
          <p>
            Når prosjektet krever dokumentasjon mot internkontroll, hjelper vi med å strukturere informasjonen slik at
            verksleder og HMS får det de trenger uten å miste tempo i rekrutteringen.
          </p>
        </div>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-logistikk", label: "Logistikk & lager" },
            { href: "/bemanningsbyrå-stavanger", label: "Bemanning Stavanger" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Avklar kapasitet
          </Link>
          <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
            Kontakt
          </Link>
        </div>
      </div>
    </article>
  );
}
