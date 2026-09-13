import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-stavanger";
const TITLE = "Bemanning i Stavanger - energi og industri | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Stavanger til energi-, industri- og logistikkprosjekter. Rekruttering fra EU/EØS med dokumenterte kandidatprofiler.";

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

export default function BemanningsbyraStavangerPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold-ink">Lokal bemanning</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning i Stavanger, der sikkerhetskrav og prosjekttempo må gå hånd i hånd
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Rogaland er en region med høy aktivitet innen energi, leverandørindustri og maritim virksomhet. Vi leverer
            bemanning i Stavanger med tydelig forhåndsscreening av opplæring, adgangskrav og match med rollen.
          </p>
          <p>
            Vi rekrutterer fra EU/EØS til regulerte miljøer og prosjektbaserte team. Ta kontakt via en{" "}
            <Link href="/request" className="font-medium text-gold-ink hover:underline">
              bemanningsforespørsel
            </Link>{" "}
            eller les mer{" "}
            <Link href="/for-employers" className="font-medium text-gold-ink hover:underline">
              for arbeidsgivere
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#C9A84C]">
          <h2 className="text-lg font-semibold text-navy">Etterspurte roller i Rogaland</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industri- og vedlikeholdsmedarbeidere med dokumentert erfaring</li>
            <li>Sveising og mekanisk støtte til verksteder og modulbygging</li>
            <li>Logistikk- og truckroller knyttet til havn og transport</li>
            <li>Byggfag til bolig- og næringsprosjekter</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Sikkerhetskrav", "Kandidatene matches mot forventningene til dokumentasjon og sikkerhet."],
            ["Operativ oppfølging", "Rask koordinering når innkjøp og sikkerhetsomfang er avtalt."],
            ["Realistiske løfter", "Leveransen avhenger av markedet og hvor krevende rollen er."],
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
            Dekker dere offshoreroller? Det avhenger av hvilken opplæring og hvilke godkjenninger som kreves, og det
            kontrollerer vi først.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-industri", label: "Industri og produksjon" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Kontakt oss for bemanning i Stavanger. Vi samordner sikkerhetskravene med en realistisk rekrutteringsleveranse.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-gold-hover sm:w-auto"
          >
            Avklar bemanningsbehovet
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center text-sm font-semibold text-gold-ink underline sm:w-auto"
          >
            Kontakt oss
          </Link>
        </div>
      </div>
    </article>
  );
}
