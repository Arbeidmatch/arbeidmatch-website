import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const URL = "https://www.arbeidmatch.no/bemanning-horeca";

export const metadata: Metadata = {
  title: "Bemanning HoReCa og servering",
  description:
    "Kjøkken, servering og drift til hotell og restaurant. EU/EEA-bemanning med hygienefokus. Ta kontakt.",
  alternates: { canonical: URL, languages: { nb: URL, "x-default": URL } },
};

/** Hospitality staffing on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningHorecaPage() {
  return (
    <SeoLanding
      eyebrow="Bemanning HoReCa"
      title="Bemanning HoReCa når gjesteøkningen kommer over natta"
      intro={[
        <>
          Serveringsbransjen lever av topper: konferanser, høytider og sesongarbeid. ArbeidMatch rekrutterer
          EU/EEA-personell til kjøkkenhjelp, renhold i front og drift som tåler høyt tempo uten å gå på kompromiss med
          hygienestandarder.
        </>,
        <>
          Vi kartlegger skift, språk i møte med gjester og mattrygghet. Kandidater presenteres med tydelig erfaring fra
          tilsvarende miljø. Målet er forutsigbar bemanning som kan skaleres - uten å love ubegrenset kapasitet i alle
          topper. Les mer om <Link href="/for-employers">arbeidsgiverløsning</Link> eller send{" "}
          <Link href="/request" data-rask-foresporsel>
            forespørsel
          </Link>
          .
        </>,
      ]}
      cards={{
        items: [
          ["Mattrygghet", "Erfaring fra storkjøkken og hotell - avklart før presentasjon."],
          ["Skift og språk", "Vi matcher behov mot reell erfaring i gjestemøte."],
          ["Sesongtopper", "Vi skalerer der markedet tillater - uten absolutte løfter om volum."],
        ],
      }}
      seeAlso={[
        { href: "/bemanning-renhold", label: "Renhold & facility" },
        { href: "/bemanningsbyrå-bergen", label: "Bemanning Bergen" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      primary="Planlegg bemanning"
      secondary={{ label: "Kontakt oss", href: "/contact" }}
    />
  );
}
