import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-kristiansand";
const TITLE = "Bemanning i Kristiansand og Agder | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Kristiansand til industri, logistikk og bygg og anlegg. Rekruttering fra EU/EØS med tydelige krav til dokumentasjon.";

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

/** Staffing in Kristiansand on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningsbyraKristiansandPage() {
  return (
    <SeoLanding
      eyebrow="Lokal bemanning"
      title="Bemanning i Kristiansand innen industri, logistikk og byutvikling"
      intro={[
        <>
          Kristiansand og Agder fortsetter å vokse innen industri, logistikk og boligutvikling. ArbeidMatch bistår med
          bemanning i Kristiansand med tydelige forventninger til dokumentasjon, mobilitet og skiftarbeid.
        </>,
        <>
          Vi avklarer bolig, transport og forventninger til arbeidstid tidlig. Send en{" "}
          <Link href="/request" data-rask-foresporsel>
            bemanningsforespørsel
          </Link>{" "}
          eller les mer <Link href="/for-employers">for arbeidsgivere</Link>.
        </>,
      ]}
      roleList={{
        heading: "Typiske roller i Kristiansand og Agder",
        items: [
          "Industrioperatører til prosess- og pakkelinjer",
          "Logistikk-, truck- og lagerteam knyttet til havn og hovedveinett",
          "Byggfag til bolig- og infrastrukturprosjekter",
          "Tekniske støtteroller i vedlikeholdsperioder",
        ],
      }}
      cards={{
        items: [
          ["Dokumentert erfaring", "Screeningen handler om reell prosesserfaring, ikke generelle titler."],
          ["Regional logistikk", "Pendling og bolig avklares tidlig, slik at teamene blir stabile."],
          ["Operativ oppfølging", "Jevn kommunikasjon uansett hvor prosjektet ligger."],
        ],
      }}
      faq={{
        heading: "Vanlige spørsmål",
        items: [
          {
            q: "Dekker dere hele Agder?",
            a: "Ja, vi bruker den samme prosessen i hele regionen, med kravene deres som utgangspunkt.",
          },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-industri", label: "Industri og produksjon" },
        { href: "/bemanning-logistikk", label: "Logistikk" },
        { href: "/for-employers", label: "For arbeidsgivere" },
      ]}
      closing={{
        heading: "Kontakt oss for bemanning i Kristiansand.",
        body: "Vi bygger leveransen rundt rammene for prosjektet og de lokale forholdene.",
      }}
      primary="Send forespørsel"
      secondary={{ label: "For arbeidsgivere", href: "/for-employers" }}
    />
  );
}
