import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-kristiansand";
const TITLE = "Bemanning i Kristiansand og Agder | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Kristiansand til industri, logistikk og bygg og anlegg. Rekruttering fra EU/EØS med tydelige krav til dokumentasjon.";

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

export default function BemanningsbyraKristiansandPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold-ink">Lokal bemanning</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning i Kristiansand innen industri, logistikk og byutvikling
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Kristiansand og Agder fortsetter å vokse innen industri, logistikk og boligutvikling. ArbeidMatch bistår med
            bemanning i Kristiansand med tydelige forventninger til dokumentasjon, mobilitet og skiftarbeid.
          </p>
          <p>
            Vi avklarer bolig, transport og forventninger til arbeidstid tidlig. Send en{" "}
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
          <h2 className="text-lg font-semibold text-navy">Typiske roller i Kristiansand og Agder</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industrioperatører til prosess- og pakkelinjer</li>
            <li>Logistikk-, truck- og lagerteam knyttet til havn og hovedveinett</li>
            <li>Byggfag til bolig- og infrastrukturprosjekter</li>
            <li>Tekniske støtteroller i vedlikeholdsperioder</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Dokumentert erfaring", "Screeningen handler om reell prosesserfaring, ikke generelle titler."],
            ["Regional logistikk", "Pendling og bolig avklares tidlig, slik at teamene blir stabile."],
            ["Operativ oppfølging", "Jevn kommunikasjon uansett hvor prosjektet ligger."],
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
            Dekker dere hele Agder? Ja, vi bruker den samme prosessen i hele regionen, med kravene deres som
            utgangspunkt.
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
          Kontakt oss for bemanning i Kristiansand. Vi bygger leveransen rundt rammene for prosjektet og de lokale
          forholdene.
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
            For arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
