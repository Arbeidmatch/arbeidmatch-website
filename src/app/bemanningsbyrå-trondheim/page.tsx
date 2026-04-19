import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanningsbyrå Trondheim – EU/EEA",
  description:
    "Bemanningsbyrå Trondheim med fagarbeidere til bygg, industri og logistikk. Rekruttering EU/EEA – ta kontakt for bemanning i Trondheim.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-trondheim" },
};

export default function BemanningsbyraTrondheimPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanningsbyrå Trondheim for prosjekter i teknologibyen som bygger videre
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Trondheim-regionen kombinerer marin næring, byutvikling på Lade og Sluppen, campusvekst og et industrielt
            tyngdepunkt på Heimdal og Ranheim. Det gir et arbeidsmarked der små og mellomstore entreprenører ofte
            konkurrerer om de samme fagpersonene samtidig som store infrastrukturprosjekter trekker folk ut av byen.
            Resultatet er lengre ledig tid før oppstart og mer press på lønns- og innkjøpsledd.
          </p>
          <p>
            For mange bedrifter er derfor et lokalt forankret bemanningsbyrå Trondheim et praktisk førstevalg: dere får
            partner som forstår pendling, kollektivknutepunkt og logistikk rundt Trondheimsfjorden. ArbeidMatch har
            hovedkontor i Ranheim og kjenner hverdagen til leverandørkjeder som opererer inn mot Orkanger, Stjørdal og
            Melhus. Vi rekrutterer EU/EEA-arbeidere til roller der dokumentasjon og språk er avklart før folk møter på
            anlegg eller i produksjon.
          </p>
          <p>
            Typiske oppdrag i regionen omfatter betongarbeidere til boligblokker, elektrohjelp der autorisasjon er på
            plass, logistikkpersonell til nye lagerhuber og industrioperatører til mat og prosess. Vi jobber strukturert
            med HMS-forventninger som er høye i norske byggeplassmiljøer, og vi tør å si nei når krav og kompetanse ikke
            matcher – det beskytter både prosjekt og kandidat.
          </p>
          <p>
            Vekstsektorer vi ser nå er elektrifisering av industri, energieffektivisering i boligmasse og økt behov for
            terminalarbeid knyttet til import. Det krever arbeidskraft som tåler skift og dokumentasjon som tåler
            kontroll. Vår modell er å koble rekruttering med tydelige kontraktsrammer slik at HR og prosjektleder ser
            samme bilde av leveransen.
          </p>
          <p>
            ArbeidMatch leverer til hele Norge, men nettopp i Trondheim har vi kort vei til kundemøter, befaring og
            oppfølging i oppstartsuka. Det gir trygghet når dere skal skalere bemanning raskt uten å miste kontroll på
            kvalitet.
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">Relevante roller i regionen</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Betong og tømrerhjelp til bolig- og næringsbygg</li>
            <li>Industrioperatører til prosess og pakking</li>
            <li>Lager- og truckteam mot nye logistikksenter</li>
            <li>Stillas og rigg mot infrastrukturunderentreprise</li>
          </ul>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/bemanning-industri", label: "Industri" },
            { href: "/about", label: "Om ArbeidMatch" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Trondheim – vi starter med krav og leverer profiler som er forberedt på
          norske forhold.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Send forespørsel
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            Les mer for arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
