import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning Stavanger olje og industri",
  description:
    "Bemanning Stavanger olje industri og logistikk. EU/EEA-fagarbeidere til vedlikehold og bygg – ta kontakt i Stavanger.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-stavanger" },
};

export default function BemanningsbyraStavangerPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning Stavanger olje industri – når sikkerhetskrav og tempo møtes
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Rogaland er fortsatt et kraftsentrum for energi, leverandørindustri og havnæring, samtidig som bolig- og
            infrastrukturprosjekter i Randaberg, Sandnes og Sola krever stabil arbeidskraft. I olje og gass-relaterte
            anlegg er det ikke nok med «generell håndverkererfaring» – dokumentasjon for adgang, offshore-kurs og
            sikkerhetsbrief er ofte avgjørende før kandidat kan møte på verksted eller anlegg.
          </p>
          <p>
            ArbeidMatch leverer bemanning Stavanger olje industri med tydelig forventningsstyring: vi avklarer hvilke
            kurs som allerede finnes, hva som må etterutdannes i Norge, og hvilke roller som kan besettes umiddelbart.
            Samtidig støtter vi landbaserte prosjekter der sveis, mekanisk og elektrohjelp trengs i kortere perioder rundt
            vedlikeholdsvinduer.
          </p>
          <p>
            Vekst og omstilling i regionen handler mye om elektrifisering, havvind-forberedende aktivitet og logistikk
            rundt havnene. Det gir etterspørsel etter industrioperatører, logistikkfolk og byggteam som kan jobbe i
            prosjektmodus. Vi rekrutterer fra EU/EEA med fokus på erfaring fra tilsvarende regulerte miljø, slik at
            onboarding blir forutsigbar.
          </p>
          <p>
            Stavanger-kulturen er direkte: beslutninger tas i møterom med tydelige sikkerhetsforventninger. Våre rådgivere
            er derfor forberedt på tekniske spørsmål om sveiseprosedyrer, rigg og arbeidstillatelser der det er relevant.
            Vi leverer ikke «ukjente navn på liste», men profiler med forklart bakgrunn og referanser som kan verifiseres.
          </p>
          <p>
            ArbeidMatch opererer nasjonalt med hovedkontor i Trondheim, men følger Rogaland-prosjekter tett. Vi kan
            mobilisere kandidater til oppstart når innkjøps- og sikkerhetsløp er avklart, og vi hjelper med praktisk
            koordinering av reise og innkvartering der det er behov.
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-navy">Etterspurte roller i Rogaland</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industri- og vedlikeholdsassistenter med dokumentert erfaring</li>
            <li>Sveis og mekanisk hjelp til verksted og modulbygging</li>
            <li>Logistikk og truck mot havn og forbundsårer</li>
            <li>Byggfag til bolig og næring i storbyregionen</li>
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
          Ta kontakt med oss for bemanning i Stavanger – vi kobler sikkerhetskrav med reell rekrutteringskapasitet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Avklar behov
          </Link>
          <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
            Kontakt oss
          </Link>
        </div>
      </div>
    </article>
  );
}
