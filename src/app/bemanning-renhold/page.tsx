import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const URL = "https://www.arbeidmatch.no/bemanning-renhold";

export const metadata: Metadata = {
  title: "Bemanning renhold og service",
  description:
    "Renholdsoperatører til kontor, handel og borettslag. EU/EEA-bemanning med fokus på kvalitet og rutiner. Ta kontakt.",
  alternates: { canonical: URL, languages: { nb: URL, "x-default": URL } },
};

/** Cleaning staffing on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningRenholdPage() {
  return (
    <SeoLanding
      eyebrow="Bemanning renhold"
      title="Bemanning renhold med fokus på kvalitet og trygghet"
      intro={[
        <>
          Renhold påvirker merkevare, arbeidsmiljø og kundetrafikk. ArbeidMatch leverer EU/EEA-profiler som forstår
          rutiner for desinfeksjon, soner og materialbruk, enten det gjelder handel, kontor eller borettslag med hyppige
          vaktbytter.
        </>,
        <>
          Vi avklarer arbeidstid, transport og språkbehov tidlig. Bemanning renhold skal være forutsigbar: faste team der
          det er behov, og fleksible vikarer når topper oppstår. Vi hjelper dere å finne riktig balanse og viser vei til{" "}
          <Link href="/request" data-rask-foresporsel>
            forespørsel
          </Link>{" "}
          når dere er klare.
        </>,
      ]}
      cards={{
        items: [
          ["Rutiner og soner", "Avklaring av desinfeksjon, materialbruk og arbeidssted."],
          ["Trygg bemanning", "Vi tilstreber tydelige forventninger om vakt og transport."],
          ["Skalerbart", "Fleksibilitet uten å love ubegrenset kapasitet i alle topper."],
        ],
      }}
      faq={{
        heading: "Kort FAQ",
        items: [
          { q: "Kan dere dekke helgevakter?", a: "Avhengig av tilgjengelighet og område; vi avklarer før oppstart." },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-horeca", label: "HoReCa" },
        { href: "/bemanning-helse", label: "Helse & omsorg" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      primary="Få tilbud"
      secondary={{ label: "Arbeidsgiver", href: "/for-employers" }}
    />
  );
}
