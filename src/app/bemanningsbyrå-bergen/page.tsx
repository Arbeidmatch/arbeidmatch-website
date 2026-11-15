import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-bergen";
const TITLE = "Bemanning i Bergen - maritim sektor og bygg | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Bergen til verft, logistikk og bygg og anlegg. Rekruttering fra EU/EØS med kontrollert dokumentasjon.";

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

/** Staffing in Bergen on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningsbyraBergenPage() {
  return (
    <SeoLanding
      eyebrow="Lokal bemanning"
      title="Bemanning i Bergen, der maritim virksomhet og byutvikling møtes"
      intro={[
        <>
          Bergen kombinerer maritim logistikk, marin teknologi og komplekse byggeprosjekter. ArbeidMatch bistår med
          bemanning i Bergen med kontrollert erfaring fra EU/EØS, sikkerhetsbevisst screening og forutsigbar oppstart.
        </>,
        <>
          Vi avklarer sertifiseringer, forventninger til språk og praktisk match med rollen tidlig. Kontakt oss via en{" "}
          <Link href="/request" data-rask-foresporsel>
            bemanningsforespørsel
          </Link>{" "}
          eller les mer <Link href="/for-employers">for arbeidsgivere</Link>.
        </>,
      ]}
      roleList={{
        heading: "Typiske roller i Bergensregionen",
        items: [
          "Maritime sveisere og team for overflatebehandling",
          "Stillas- og riggelag til infrastruktur og industri",
          "Lager- og terminalarbeidere til havne- og veilogistikk",
          "Byggfag til tette byutviklingsprosjekter",
        ],
      }}
      cards={{
        items: [
          ["Maritim forståelse", "Kandidatene matches mot hverdagen på verft, i havn og i logistikk."],
          ["Dokumentasjon av høy kvalitet", "Vi prioriterer ryddig dokumentasjonsflyt for innkjøp og revisjoner."],
          ["Lokal og nasjonal rekkevidde", "Regional innsikt kombinert med rekruttering fra hele EU/EØS."],
        ],
      }}
      faq={{
        heading: "Vanlige spørsmål",
        items: [
          {
            q: "Dekker dere hele Vestland?",
            a: "Ja, vi vurderer prosjekter i hele landet og tar hensyn til lokale forhold i screeningen.",
          },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-bygg-anlegg", label: "Bygg og anlegg" },
        { href: "/bemanning-horeca", label: "Hotell, restaurant og catering" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      closing={{
        heading: "Kontakt oss for bemanning i Bergen.",
        body: "Vi tar utgangspunkt i rammene for prosjektet deres og leverer tydelige kandidatprofiler.",
      }}
      primary="Send forespørsel"
      secondary={{ label: "For arbeidsgivere", href: "/for-employers" }}
    />
  );
}
