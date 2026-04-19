import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning Bergen – maritim og bygg",
  description:
    "Bemanning Bergen til verft, logistikk og byggeplass. EU/EEA-fagarbeidere med dokumentasjon – ta kontakt for bemanning i Bergen.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-bergen" },
};

export default function BemanningsbyraBergenPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning Bergen der havn, byfjell og byutvikling møtes
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Bergensøkonomien er formet av sjøtransport, maritim teknologi og en bykjerne som presses av boligbehov og
            infrastruktur i bratte terreng. Det gir et arbeidsmarked der erfaring fra havn og verft er like relevant som
            tradisjonell byggbemanning. Når prosjekter i Fyllingsdalen eller Åsane skal ha folk på plass, er det avgjørende
            med kandidater som forstår værforbehold, adkomst og sikring mot fall.
          </p>
          <p>
            ArbeidMatch leverer bemanning Bergen til både maritim klynge og landbasert bygg. Vi rekrutterer EU/EEA-folk
            med dokumentert erfaring fra stillas, sveising, overflate og logistikk i havnemiljø. Samtidig støtter vi
            entreprenører som bygger boligblokker og næring langs Bybanen, der HMS-krav og støyhensyn krever modenhet i
            planlegging.
          </p>
          <p>
            Vekstsektorer vi ser tydelig er oppgradering av kaier, elektrifisering av flåter og mer lagerkapasitet knyttet
            til import. Det krever truckførere, terminalarbeidere og tekniske assistenter som tåler skift og har orden i
            papirene. Vi avklarer truckklasser, språk og sertifikater før kandidater presenteres, slik at driftsleder
            slipper overraskelser i oppstartsuka.
          </p>
          <p>
            Bergensk arbeidsliv er også personlig: tillit bygges i gatekjøkkenkø og på foreldremøter. Derfor legger vi
            vekt på at bemanningen føles trygg for både verksleder og fagforeninger som følger prosjektet. Vi kommuniserer
            åpent om lønnsrammer, tariff og allmenngjøring der det gjelder, og vi dokumenterer avtaler slik at
            innkjøpsløpet tåler revisjon.
          </p>
          <p>
            ArbeidMatch har nasjonal dekning og følger bergenske prosjekter digitalt og med fysiske befaringer ved behov.
            Målet er at dere opplever lokal forståelse kombinert med internasjonal rekrutteringskapasitet.
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">Typiske roller i Bergensregionen</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Maritime sveisere og overflatearbeidere</li>
            <li>Stillas og rigg mot infrastruktur og industri</li>
            <li>Lager og terminal mot hav og motorvei</li>
            <li>Byggfag til fortetting i sentrum og i dagligvarekjeder</li>
          </ul>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-horeca", label: "HoReCa" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Bergen – vi starter med deres prosjektforutsetninger og leverer ryddige
          kandidatprofiler.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Send forespørsel
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            For arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
