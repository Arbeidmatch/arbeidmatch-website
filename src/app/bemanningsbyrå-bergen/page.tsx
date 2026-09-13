import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const CANONICAL = "https://www.arbeidmatch.no/bemanningsbyrå-bergen";
const TITLE = "Bemanning i Bergen - maritim sektor og bygg | ArbeidMatch";
const DESCRIPTION =
  "Bemanning i Bergen til verft, logistikk og bygg og anlegg. Rekruttering fra EU/EØS med kontrollert dokumentasjon.";

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

export default function BemanningsbyraBergenPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold-ink">Lokal bemanning</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning i Bergen, der maritim virksomhet og byutvikling møtes
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Bergen kombinerer maritim logistikk, marin teknologi og komplekse byggeprosjekter. ArbeidMatch bistår med
            bemanning i Bergen med kontrollert erfaring fra EU/EØS, sikkerhetsbevisst screening og forutsigbar oppstart.
          </p>
          <p>
            Vi avklarer sertifiseringer, forventninger til språk og praktisk match med rollen tidlig. Kontakt oss via en{" "}
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
          <h2 className="text-lg font-semibold text-navy">Typiske roller i Bergensregionen</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Maritime sveisere og team for overflatebehandling</li>
            <li>Stillas- og riggelag til infrastruktur og industri</li>
            <li>Lager- og terminalarbeidere til havne- og veilogistikk</li>
            <li>Byggfag til tette byutviklingsprosjekter</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Maritim forståelse", "Kandidatene matches mot hverdagen på verft, i havn og i logistikk."],
            ["Dokumentasjon av høy kvalitet", "Vi prioriterer ryddig dokumentasjonsflyt for innkjøp og revisjoner."],
            ["Lokal og nasjonal rekkevidde", "Regional innsikt kombinert med rekruttering fra hele EU/EØS."],
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
            Dekker dere hele Vestland? Ja, vi vurderer prosjekter i hele landet og tar hensyn til lokale forhold i
            screeningen.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg og anlegg" },
            { href: "/bemanning-horeca", label: "Hotell, restaurant og catering" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Kontakt oss for bemanning i Bergen. Vi tar utgangspunkt i rammene for prosjektet deres og leverer tydelige
          kandidatprofiler.
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
