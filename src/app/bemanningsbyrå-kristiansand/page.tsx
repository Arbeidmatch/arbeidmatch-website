import Link from "next/link";
import type { Metadata } from "next";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning Kristiansand og Agder",
  description:
    "Bemanning Kristiansand til industri, logistikk og bygg. EU/EEA-rekruttering med dokumentasjon – ta kontakt i Agder.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-kristiansand" },
};

export default function BemanningsbyraKristiansandPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning Kristiansand – broen mellom industri, logistikk og byutvikling
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Kristiansand og Agder er i vekst med industri, logistikk og boligbygging som krever arbeidskraft som forstår
            prosess og skift. ArbeidMatch leverer bemanning Kristiansand med fokus på dokumentasjon, pendling og tydelige
            forventninger til språk i sikkerhetsbrief. Vi tilstreber ryddig dialog med verksleder og tillitsvalgte.
          </p>
          <p>
            Vi avklarer bolig, transport og arbeidstid tidlig. Send{" "}
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
          <h2 className="text-lg font-semibold text-navy">Typiske roller i Kristiansand og Agder</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industrioperatører til prosess og pakking</li>
            <li>Logistikk, truck og lager mot hav og motorvei</li>
            <li>Byggfag til bolig og infrastrukturprosjekter</li>
            <li>Teknisk assistanse i vedlikeholdsesong</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Reell erfaring", "Vi stiller spørsmål om konkrete prosesser - ikke bare generelle etiketter."],
            ["Regional logikk", "Pendling og bolig avklares tidlig for stabile team."],
            ["Digital oppfølging", "Avstand til hovedkontor skal ikke bety avstand i dialog."],
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
            Dekker dere hele Agder? - Ja, med samme metodikk som i større byer - krav først, deretter sourcing.
          </p>
        </section>
        <BemanningLegalSection />
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-industri", label: "Industri & produksjon" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Kristiansand – vi bygger leveransen rundt deres prosjekt og lokale realiteter.
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
