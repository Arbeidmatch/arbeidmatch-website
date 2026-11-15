import Link from "next/link";
import type { Metadata } from "next";

import SeoLanding from "@/components/site/seo/SeoLanding";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-trondheim";
const TITLE = "Bemanningsbyrå i Trondheim - arbeidskraft fra EU/EØS | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Trondheim til bygg og anlegg, industri og logistikk. Rekruttering fra EU/EØS med dokumentert kandidatkvalitet.";

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

/** Staffing in Trondheim on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningsbyraTrondheimPage() {
  return (
    <SeoLanding
      eyebrow="Lokal bemanning"
      title="Bemanning i Trondheim til prosjekter innen teknologi, bygg og drift"
      intro={[
        <>
          Trondheimsregionen kombinerer marin industri, byutvikling og industriell vekst. ArbeidMatch holder til på
          Ranheim og bistår med bemanning i Trondheim med tett oppfølging, tydelig screening og praktisk matching mot
          rollen.
        </>,
        <>
          Typiske oppdrag er bygg og anlegg, logistikk og produksjon. Les mer om{" "}
          <Link href="/electricians-norway">elektrikere i Norge</Link> der det er relevant, eller send en{" "}
          <Link href="/request" data-rask-foresporsel>
            bemanningsforespørsel
          </Link>
          .
        </>,
      ]}
      roleList={{
        heading: "Typiske roller i regionen",
        items: [
          "Betong- og tømrerstøtte til bolig- og næringsprosjekter",
          "Industrioperatører til prosess- og pakkelinjer",
          "Lager- og truckteam til logistikknutepunkter",
          "Stillas- og riggelag for infrastrukturentreprenører",
        ],
      }}
      cards={{
        items: [
          ["Lokal tilstedeværelse", "Rask koordinering med rekrutteringsansvarlige og prosjektledere i Midt-Norge."],
          ["Sikkerhetsforventninger", "Strukturert screening tilpasset strenge sikkerhetskrav."],
          ["Tydelige avtaler", "Et tydelig leveranseomfang, slik at HR og byggeplassledelsen er samstemte."],
        ],
      }}
      faq={{
        heading: "Vanlige spørsmål",
        items: [
          {
            q: "Hvor raskt kan bemanningen starte?",
            a: "Det avhenger av rollen og tilgjengeligheten i markedet, og vi setter realistiske tidsrammer tidlig.",
          },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-bygg-anlegg", label: "Bygg og anlegg" },
        { href: "/bemanning-logistikk", label: "Logistikk" },
        { href: "/bemanning-industri", label: "Industri" },
        { href: "/about", label: "Om ArbeidMatch" },
      ]}
      closing={{
        heading: "Kontakt oss for bemanning i Trondheim.",
        body: "Vi tar utgangspunkt i kravene deres og leverer profiler som er forberedt på lokale arbeidsforhold.",
      }}
      primary="Send forespørsel"
      secondary={{ label: "Les mer for arbeidsgivere", href: "/for-employers" }}
    />
  );
}
