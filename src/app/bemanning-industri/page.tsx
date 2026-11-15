import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const URL = "https://www.arbeidmatch.no/bemanning-industri";

export const metadata: Metadata = {
  title: "Bemanning industri og produksjon",
  description:
    "Operatører, montører og tekniske hjelpearbeidere til industri i Norge. EU/EEA-bemanning med kvalitetssikring. Ta kontakt.",
  alternates: { canonical: URL, languages: { nb: URL, "x-default": URL } },
};

/** Industry staffing on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningIndustriPage() {
  return (
    <SeoLanding
      eyebrow="Bemanning industri"
      title="Bemanning industri for linjestopp som ikke kan vente"
      intro={[
        <>
          Produksjonslinjer er avhengige av presisjon, skiftrykk og dokumentert kompetanse på verktøy og prosedyrer.
          ArbeidMatch leverer EU/EEA-kandidater til industriprosjekter der krav til erfaring, sertifikater og
          sikkerhetsbrief er tydelig definert før oppstart.
        </>,
        <>
          Vi jobber med operatører, montører, sveisehjelp og tekniske assistenter. Screening fokuserer på reell erfaring
          fra tilsvarende miljø. Når prosjektet krever dokumentasjon mot internkontroll, hjelper vi med å strukturere
          informasjonen slik at verksleder og HMS får det de trenger. Vi tilstreber ryddige prosesser og viser vei til{" "}
          <Link href="/request" data-rask-foresporsel>
            kapasitetsavklaring
          </Link>{" "}
          og <Link href="/for-employers">arbeidsgiverinformasjon</Link>.
        </>,
      ]}
      cards={{
        items: [
          ["Operatører og montører", "Screening mot reell fabrikkerfaring og skift."],
          ["Dokumentasjon", "Vi samler relevant info for internkontroll uten å love mer enn markedet tillater."],
          ["HMS i praksis", "Sikkerhetsbrief og prosedyrer avstemmes tidlig - målet er trygg oppstart."],
        ],
      }}
      faq={{
        heading: "Korte svar",
        items: [
          {
            q: "Dekker dere korte vedlikeholdsvinduer?",
            a: "Ofte ja - avhengig av kompetanse og tilgjengelighet. Vi er åpne om tidslinje.",
          },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-logistikk", label: "Logistikk & lager" },
        { href: "/bemanningsbyrå-stavanger", label: "Bemanning Stavanger" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      primary="Avklar kapasitet"
      secondary={{ label: "Kontakt", href: "/contact" }}
    />
  );
}
