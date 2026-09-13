import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-trondheim";
const TITLE = "Bemanningsbyrå i Trondheim - arbeidskraft fra EU/EØS | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Trondheim til bygg og anlegg, industri og logistikk. Rekruttering fra EU/EØS med dokumentert kandidatkvalitet.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
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

export default function BemanningsbyraTrondheimPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold-ink">Lokal bemanning</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning i Trondheim til prosjekter innen teknologi, bygg og drift
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Trondheimsregionen kombinerer marin industri, byutvikling og industriell vekst. ArbeidMatch holder til på
            Ranheim og bistår med bemanning i Trondheim med tett oppfølging, tydelig screening og praktisk matching mot
            rollen.
          </p>
          <p>
            Typiske oppdrag er bygg og anlegg, logistikk og produksjon. Les mer om{" "}
            <Link href="/electricians-norway" className="font-medium text-gold-ink hover:underline">
              elektrikere i Norge
            </Link>{" "}
            der det er relevant, eller send en{" "}
            <Link href="/request" className="font-medium text-gold-ink hover:underline">
              bemanningsforespørsel
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#C9A84C]">
          <h2 className="text-lg font-semibold text-navy">Typiske roller i regionen</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Betong- og tømrerstøtte til bolig- og næringsprosjekter</li>
            <li>Industrioperatører til prosess- og pakkelinjer</li>
            <li>Lager- og truckteam til logistikknutepunkter</li>
            <li>Stillas- og riggelag for infrastrukturentreprenører</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Lokal tilstedeværelse", "Rask koordinering med rekrutteringsansvarlige og prosjektledere i Midt-Norge."],
            ["Sikkerhetsforventninger", "Strukturert screening tilpasset strenge sikkerhetskrav."],
            ["Tydelige avtaler", "Et tydelig leveranseomfang, slik at HR og byggeplassledelsen er samstemte."],
          ].map(([t, b]) => (
            <article
              key={t}
              className="rounded-xl border border-border bg-white transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]"
              style={{ padding: "28px 24px" }}
            >
              <h3 className="text-base font-semibold text-navy">{t}</h3>
              <p className="mt-2 text-sm text-text-secondary">{b}</p>
            </article>
          ))}
        </section>
        <section className="mx-auto mt-10 max-w-[800px] px-0 md:px-4">
          <h2 className="am-h3 font-semibold text-navy">Vanlige spørsmål</h2>
          <p className="mt-3 text-sm text-text-secondary">
            Hvor raskt kan bemanningen starte? Det avhenger av rollen og tilgjengeligheten i markedet, og vi setter
            realistiske tidsrammer tidlig.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg og anlegg" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/bemanning-industri", label: "Industri" },
            { href: "/about", label: "Om ArbeidMatch" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Kontakt oss for bemanning i Trondheim. Vi tar utgangspunkt i kravene deres og leverer profiler som er
          forberedt på lokale arbeidsforhold.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-gold-hover sm:w-auto"
          >
            Send forespørsel
          </Link>
          <Link
            href="/for-employers"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy sm:w-auto"
          >
            Les mer for arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
