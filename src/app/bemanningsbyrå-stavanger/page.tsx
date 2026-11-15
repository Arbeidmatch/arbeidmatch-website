import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-stavanger";
const TITLE = "Bemanning i Stavanger - energi og industri | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Stavanger til energi-, industri- og logistikkprosjekter. Rekruttering fra EU/EØS med dokumenterte kandidatprofiler.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL, languages: { nb: CANONICAL, "x-default": CANONICAL } },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: CANONICAL,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch | Rekruttering fra EU/EØS til Norge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

/** Staffing in Stavanger on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningsbyraStavangerPage() {
  return (
    <SeoLanding
      eyebrow="Lokal bemanning"
      title="Bemanning i Stavanger, der sikkerhetskrav og prosjekttempo må gå hånd i hånd"
      intro={[
        <>
          Rogaland er en region med høy aktivitet innen energi, leverandørindustri og maritim virksomhet. Vi leverer
          bemanning i Stavanger med tydelig forhåndsscreening av opplæring, adgangskrav og match med rollen.
        </>,
        <>
          Vi rekrutterer fra EU/EØS til regulerte miljøer og prosjektbaserte team. Ta kontakt via en{" "}
          <Link href="/request" data-rask-foresporsel>
            bemanningsforespørsel
          </Link>{" "}
          eller les mer <Link href="/for-employers">for arbeidsgivere</Link>.
        </>,
      ]}
      roleList={{
        heading: "Etterspurte roller i Rogaland",
        items: [
          "Industri- og vedlikeholdsmedarbeidere med dokumentert erfaring",
          "Sveising og mekanisk støtte til verksteder og modulbygging",
          "Logistikk- og truckroller knyttet til havn og transport",
          "Byggfag til bolig- og næringsprosjekter",
        ],
      }}
      cards={{
        items: [
          ["Sikkerhetskrav", "Kandidatene matches mot forventningene til dokumentasjon og sikkerhet."],
          ["Operativ oppfølging", "Rask koordinering når innkjøp og sikkerhetsomfang er avtalt."],
          ["Realistiske løfter", "Leveransen avhenger av markedet og hvor krevende rollen er."],
        ],
      }}
      faq={{
        heading: "Vanlige spørsmål",
        items: [
          {
            q: "Dekker dere offshoreroller?",
            a: "Det avhenger av hvilken opplæring og hvilke godkjenninger som kreves, og det kontrollerer vi først.",
          },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-industri", label: "Industri og produksjon" },
        { href: "/bemanning-logistikk", label: "Logistikk" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      closing={{
        heading: "Kontakt oss for bemanning i Stavanger.",
        body: "Vi samordner sikkerhetskravene med en realistisk rekrutteringsleveranse.",
      }}
      primary="Avklar bemanningsbehovet"
      secondary={{ label: "Kontakt oss", href: "/contact" }}
    />
  );
}
