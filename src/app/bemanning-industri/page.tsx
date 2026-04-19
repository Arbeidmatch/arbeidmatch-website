import Link from "next/link";
import type { Metadata } from "next";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
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
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Bemanning industri</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning industri for linjestopp som ikke kan vente
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Produksjonslinjer er avhengige av presisjon, skiftrykk og dokumentert kompetanse på verktøy og prosedyrer.
            ArbeidMatch leverer EU/EEA-kandidater til industriprosjekter der krav til erfaring, sertifikater og
            sikkerhetsbrief er tydelig definert før oppstart.
          </p>
          <p>
            Vi jobber med operatører, montører, sveisehjelp og tekniske assistenter. Screening fokuserer på reell
            erfaring fra tilsvarende miljø. Når prosjektet krever dokumentasjon mot internkontroll, hjelper vi med å
            strukturere informasjonen slik at verksleder og HMS får det de trenger. Vi tilstreber ryddige prosesser og
            viser vei til{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              kapasitetsavklaring
            </Link>{" "}
            og{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              arbeidsgiverinformasjon
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Operatører og montører", "Screening mot reell fabrikkerfaring og skift."],
            ["Dokumentasjon", "Vi samler relevant info for internkontroll uten å love mer enn markedet tillater."],
            ["HMS i praksis", "Sikkerhetsbrief og prosedyrer avstemmes tidlig — målet er trygg oppstart."],
          ].map(([t, b]) => (
            <article
              key={t}
              className="group rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]"
              style={{ padding: "28px 24px" }}
            >
              <h3 className="text-base font-semibold text-navy">{t}</h3>
              <p className="mt-2 text-sm text-text-secondary">{b}</p>
            </article>
          ))}
        </section>
        <section className="mx-auto mt-10 max-w-[800px] px-0 md:px-4">
          <h2 className="am-h3 font-semibold text-navy">Korte svar</h2>
          <dl className="mt-4 space-y-3 text-sm text-text-secondary">
            <div>
              <dt className="font-semibold text-navy">Dekker dere korte vedlikeholdsvinduer?</dt>
              <dd className="mt-1">Ofte ja — avhengig av kompetanse og tilgjengelighet. Vi er åpne om tidslinje.</dd>
            </div>
          </dl>
        </section>
        <BemanningLegalSection />
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-logistikk", label: "Logistikk & lager" },
            { href: "/bemanningsbyrå-stavanger", label: "Bemanning Stavanger" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Avklar kapasitet
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center text-sm font-semibold text-gold underline sm:w-auto"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </article>
  );
}
