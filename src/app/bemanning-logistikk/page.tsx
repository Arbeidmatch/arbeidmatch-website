import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const URL = "https://www.arbeidmatch.no/bemanning-logistikk";

export const metadata: Metadata = {
  title: "Bemanning logistikk og lager",
  description:
    "Vikarbyrå logistikk: truckførere, lagerarbeidere og terminalpersonell fra EU/EØS. Rask bemanning med dokumentasjon. Ta kontakt.",
  alternates: { canonical: URL, languages: { nb: URL, "x-default": URL } },
};

/** Logistics staffing on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningLogistikkPage() {
  return (
    <SeoLanding
      eyebrow="Bemanning logistikk"
      title="Bemanning logistikk med folk som behersker terminaltempo"
      intro={[
        <>
          Norske distribusjonsnett presser kapasiteten: sesongtopper, JIT-leveranser og strengere krav til sikker truck-
          og truckløyve. ArbeidMatch rekrutterer EU/EEA-kandidater til lager, terminal og kjøring der dokumentasjon og
          språkbehov er avklart på forhånd. Vi tilstreber tydelig forventningsstyring før{" "}
          <Link href="/request" data-rask-foresporsel>
            bestilling
          </Link>
          .
        </>,
        <>
          Vi kartlegger skift, truckklasser, terminalerfaring og ordreplukk, og støtter i dialog om innleie og onboarding.
          Målet vårt er færre avbrudd i flyt og mer forutsigbar bemanning - i tråd med{" "}
          <Link href="/for-employers">arbeidsgiverløsningen</Link> deres.
        </>,
      ]}
      roleList={{
        heading: "Typiske roller",
        items: ["Truckførere", "Terminalarbeidere", "Lager- og ordreplukk", "Co-drivere / logistikkassistenter"],
      }}
      cards={{
        items: [
          ["Trygg dokumentasjon", "Vi arbeider for å strukturere papirflyt og førerkortklasser før presentasjon."],
          ["Skift og tempo", "Kandidater vurderes opp mot reelle krav til terminaltempo og HMS."],
          ["Ingen absolutte løfter", "Leveransetid avhenger av marked og krav - vi er åpne om begrensninger."],
        ],
      }}
      faq={{
        heading: "Korte svar",
        items: [
          {
            q: "Kan dere dekke korte topper?",
            a: "Ja, innenfor rammer som passer utleie og prosjekt - vi avklarer kapasitet tidlig.",
          },
          { q: "Hva med språk?", a: "Vi vurderer språk opp mot rolle og sikkerhetsbrief - uten å love «perfekt norsk»." },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
        { href: "/bemanning-industri", label: "Industri & produksjon" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      primary="Diskuter behov"
      secondary={{ label: "For arbeidsgivere", href: "/for-employers" }}
    />
  );
}
