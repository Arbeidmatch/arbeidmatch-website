import Link from "next/link";
import type { Metadata } from "next";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning Bergen – maritim og bygg",
  description:
    "Bemanning Bergen til verft, logistikk og byggeplass. EU/EEA-fagarbeidere med dokumentasjon – ta kontakt for bemanning i Bergen.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-bergen" },
};

export default function BemanningsbyraBergenPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning Bergen der havn, byfjell og byutvikling møtes
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Bergensøkonomien er formet av sjøtransport, maritim teknologi og byutvikling i krevende terreng. ArbeidMatch
            leverer bemanning Bergen til maritim klynge og landbasert bygg, med fokus på dokumentert EU/EEA-erfaring,
            HMS og forutsigbar oppstart. Vi tilstreber tydelig avklaring før presentasjon.
          </p>
          <p>
            Vi avklarer truckklasser, språk og sertifikater tidlig, og støtter i dialog om tariff og allmenngjøring der
            det er relevant. Ta kontakt via{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              forespørsel
            </Link>{" "}
            eller les mer for{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              arbeidsgivere
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#C9A84C]">
          <h2 className="text-lg font-semibold text-navy">Typiske roller i Bergensregionen</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Maritime sveisere og overflatearbeidere</li>
            <li>Stillas og rigg mot infrastruktur og industri</li>
            <li>Lager og terminal mot hav og motorvei</li>
            <li>Byggfag til fortetting i sentrum og i dagligvarekjeder</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Maritim forståelse", "Kandidater vurderes opp mot havn, verft og logistikk i regionen."],
            ["Dokumentasjon", "Vi arbeider for ryddig papirflyt som tåler innkjøp og revisjon."],
            ["Lokal + nasjonal", "Basert på vår erfaring kombinerer vi regional innsikt med EU/EEA-sourcing."],
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
          <h2 className="am-h3 font-semibold text-navy">Kort FAQ</h2>
          <p className="mt-3 text-sm text-text-secondary">
            Dekker dere hele Vestland? - Vi vurderer oppdrag nasjonalt; bergenske prosjekter får lokal kontekst i
            screening.
          </p>
        </section>
        <BemanningLegalSection />
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-horeca", label: "HoReCa" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Bergen – vi starter med deres prosjektforutsetninger og leverer ryddige
          kandidatprofiler.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
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
