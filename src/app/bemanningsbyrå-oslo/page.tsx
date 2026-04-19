import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanningsbyrå Oslo bygg og anlegg",
  description:
    "Bemanningsbyrå Oslo bygg: EU/EEA-fagarbeidere til storbyprosjekter. Rask bemanning med dokumentasjon – ta kontakt i Oslo.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-oslo" },
};

export default function BemanningsbyraOsloPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanningsbyrå Oslo bygg – kapasitet til storhusholdningen av prosjekter
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Oslo er landets største anskaffelsesmarked for bygg og anlegg: fortetting langs kollektivkorridorer,
            komplekse samspillskontrakter og parallelle høyder samtidig som infrastruktur under bakken skal oppgraderes.
            Det skaper et arbeidsmarked der små avvik i bemanning gir store kostnader i fremdrift. Når flere underleverandører
            trenger de samme fagprofilene i samme uke, er det ikke nok å «legge ut en annonse» – man må ha aktiv
            sourcing i flere land og samtidig ivareta norske krav til dokumentasjon og lønn.
          </p>
          <p>
            ArbeidMatch leverer bemanningsbyrå Oslo bygg med fokus på forutsigbarhet: vi kartlegger skift, sikkerhetskrav,
            adgangskort og språkbehov før vi presenterer kandidater. Mange av våre kunder har prosjekter i Bjørvika,
            Fornebu og vestkorridoren der pendling og logistikk må planlegges tidlig. Vi er vant til å koordinere
            ankomst, boligløsning og HMS-brief på kort varsel når fremdriftsplanen krever det.
          </p>
          <p>
            Typiske roller i hovedstadsregionen er betong, stillas, elektrohjelp der autorisasjon er bekreftet,
            rørleggingsassistenter og logistikkpersonell til byggeplasslager. Vi jobber tett med prosjektledere som må
            dokumentere innleie overfor byggherre, og vi forstår at pris alltid må ses i sammenheng med risiko og
            kvalitet.
          </p>
          <p>
            Veksten i Oslo ligger særlig i bolig, næring og infrastruktur knyttet til elektrifisering. Det øker behovet
            for arbeidslag som kan jobbe i trange soner med høy sikkerhetsmodenhet. Vår modell er å levere team som er
            forberedt på norske byggeplasskulturer – ikke bare teknisk kompetanse, men også forståelse for orden,
            møterituale og rapportlinjer.
          </p>
          <p>
            ArbeidMatch har nasjonal dekning med hovedkontor i Trondheim, men vi opererer like fullt i Oslo-markedet med
            hyppige leveranser og digital oppfølging. Det betyr at dere får samme prosesskvalitet som i mindre byer,
            tilpasset tempoet i storbyen.
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">Etterspurte roller i Oslo</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Stillas- og betongteam til høyhus</li>
            <li>Logistikk og riggtransport innen ring 3</li>
            <li>Industrioppdrag i Groruddalen og langs E18</li>
            <li>Renhold og service i næringsbygg under ombygging</li>
          </ul>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/bemanning-industri", label: "Industri" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Oslo – vi prioriterer krav og leverer dokumenterte profiler.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Diskuter behov
          </Link>
          <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
            Kontakt
          </Link>
        </div>
      </div>
    </article>
  );
}
