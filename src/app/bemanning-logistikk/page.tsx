import Link from "next/link";
import type { Metadata } from "next";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning logistikk og lager",
  description:
    "Vikarbyrå logistikk: truckførere, lagerarbeidere og terminalpersonell fra EU/EØS. Rask bemanning med dokumentasjon – ta kontakt.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanning-logistikk" },
};

export default function BemanningLogistikkPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning logistikk</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning logistikk med folk som behersker terminaltempo
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Norske distribusjonsnett presser kapasiteten: sesongtopper, JIT-leveranser og strengere krav til sikker
            truck- og truckløyve. ArbeidMatch rekrutterer EU/EEA-kandidater til lager, terminal og kjøring der
            dokumentasjon og språkbehov er avklart på forhånd. Vi tilstreber tydelig forventningsstyring før{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              bestilling
            </Link>
            .
          </p>
          <p>
            Vi kartlegger skift, truckklasser, terminalerfaring og ordreplukk, og støtter i dialog om innleie og
            onboarding. Målet vårt er færre avbrudd i flyt og mer forutsigbar bemanning — i tråd med{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              arbeidsgiverløsningen
            </Link>{" "}
            deres.
          </p>
        </div>
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Typiske roller</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Truckførere", "Terminalarbeidere", "Lager- og ordreplukk", "Co-drivere / logistikkassistenter"].map((r) => (
              <li
                key={r}
                className="group rounded-xl border border-border bg-surface px-5 py-4 text-sm font-medium text-navy transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]"
                style={{ padding: "28px 24px" }}
              >
                {r}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Trygg dokumentasjon", "Vi arbeider for å strukturere papirflyt og førerkortklasser før presentasjon."],
            ["Skift og tempo", "Kandidater vurderes opp mot reelle krav til terminaltempo og HMS."],
            ["Ingen absolutte løfter", "Leveransetid avhenger av marked og krav — vi er åpne om begrensninger."],
          ].map(([t, b]) => (
            <article
              key={t}
              className="group rounded-xl border border-border bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]"
              style={{ padding: "28px 24px" }}
            >
              <h3 className="text-base font-semibold text-navy">{t}</h3>
              <p className="mt-2 text-sm text-text-secondary">{b}</p>
            </article>
          ))}
        </section>
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Korte svar</h2>
          <dl className="mt-4 space-y-4 text-sm text-text-secondary">
            <div>
              <dt className="font-semibold text-navy">Kan dere dekke korte topper?</dt>
              <dd className="mt-1">Ja, innenfor rammer som passer utleie og prosjekt — vi avklarer kapasitet tidlig.</dd>
            </div>
            <div>
              <dt className="font-semibold text-navy">Hva med språk?</dt>
              <dd className="mt-1">Vi vurderer språk opp mot rolle og sikkerhetsbrief — uten å love «perfekt norsk».</dd>
            </div>
          </dl>
        </section>
        <BemanningLegalSection />
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-industri", label: "Industri & produksjon" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Diskuter behov
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            For arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
