import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning Kristiansand og Agder",
  description:
    "Bemanning Kristiansand til industri, logistikk og bygg. EU/EEA-rekruttering med dokumentasjon – ta kontakt i Agder.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-kristiansand" },
};

export default function BemanningsbyraKristiansandPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning Kristiansand – broen mellom industri, logistikk og byutvikling
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Kristiansand og Agder er i praktisk vekst: batteriindustri, etableringer langs E39 og økt lager- og
            havneaktivitet gir behov for arbeidskraft som både forstår prosess og tåler skift. Samtidig bygges det bolig
            og næring i bysonen, som krever tradisjonell byggkompetanse i perioder der lokale team er utnyttet.
          </p>
          <p>
            ArbeidMatch leverer bemanning Kristiansand med fokus på dokumentasjon og pendling: mange kandidater flytter
            inn til Grimstad eller Arendal for prosjekter langs kysten. Vi avklarer bolig, transport og arbeidstid tidlig,
            slik at oppdragsgiver får stabile team. Våre profiler hentes fra EU/EEA med erfaring fra industri, logistikk
            og bygg – avhengig av deres behov.
          </p>
          <p>
            Vekstsektorer i regionen er prosessindustri, elektrifisering og sjømat med økt automasjon. Det øker behovet
            for elektrohjelp der autorisasjon er avklart, operatører som kan jobbe i batch-produksjon og logistikkfolk som
            behersker terminalsystemer. Vi stiller spørsmål om reell erfaring, ikke bare «har jobbet på fabrikk».
          </p>
          <p>
            Agder-arbeidslivet er ofte familieorientert og langsiktig. Derfor er det viktig for oss at bemanningen ikke
            skaper friksjon i lokalmiljøet: vi kommuniserer tydelig om kontraktsformer og forventninger til språk i
            sikkerhetsbrief. Målet er at både verksleder og tillitsvalgte opplever prosessen som ryddig.
          </p>
          <p>
            ArbeidMatch har nasjonal dekning og støtter Agder-prosjekter med samme metodikk som i større byer: krav først,
            deretter sourcing, deretter kvalitetssikring før presentasjon. Dere får partner som forstår at avstand til
            hovedkontor ikke skal bety avstand i oppfølging – digital dialog og planlagte befaringer sørger for det.
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">Typiske roller i Kristiansand og Agder</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industrioperatører til prosess og pakking</li>
            <li>Logistikk, truck og lager mot hav og motorvei</li>
            <li>Byggfag til bolig og infrastrukturprosjekter</li>
            <li>Teknisk assistanse i vedlikeholdsesong</li>
          </ul>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-industri", label: "Industri & produksjon" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Kristiansand – vi bygger leveransen rundt deres prosjekt og lokale realiteter.
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
