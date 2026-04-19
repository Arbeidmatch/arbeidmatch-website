import Link from "next/link";
import type { Metadata } from "next";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanningsbyrå Trondheim – EU/EEA",
  description:
    "Bemanningsbyrå Trondheim med fagarbeidere til bygg, industri og logistikk. Rekruttering EU/EEA – ta kontakt for bemanning i Trondheim.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-trondheim" },
};

export default function BemanningsbyraTrondheimPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanningsbyrå Trondheim for prosjekter i teknologibyen som bygger videre
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Trondheim-regionen kombinerer marin næring, byutvikling og industrielt tyngdepunkt. ArbeidMatch har
            hovedkontor i Ranheim og leverer bemanningsbyrå Trondheim med kort vei til møter, befaring og oppfølging. Vi
            rekrutterer EU/EEA-arbeidere der dokumentasjon og språk er avklart før oppstart — og vi tør å si nei når krav
            og kompetanse ikke matcher.
          </p>
          <p>
            Typiske oppdrag omfatter bygg, logistikk og industri. Les om{" "}
            <Link href="/dsb-support" className="font-medium text-gold hover:underline">
              DSB-godkjenning
            </Link>{" "}
            ved behov, eller send{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              forespørsel
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:border-[#C9A84C]">
          <h2 className="text-lg font-semibold text-navy">Relevante roller i regionen</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Betong og tømrerhjelp til bolig- og næringsbygg</li>
            <li>Industrioperatører til prosess og pakking</li>
            <li>Lager- og truckteam mot nye logistikksenter</li>
            <li>Stillas og rigg mot infrastrukturunderentreprise</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            ["Lokal nærhet", "Kort vei til kundemøter og oppstartsoppfølging i Midt-Norge."],
            ["HMS-forventninger", "Vi jobber strukturert med krav som er høye i norske byggeplassmiljøer."],
            ["Kontraktsrammer", "Målet er at HR og prosjektleder ser samme bilde av leveransen."],
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
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-navy">Kort FAQ</h2>
          <p className="mt-3 text-sm text-text-secondary">
            Hvor raskt kan dere starte? — Avhengig av rolle og marked; vi avklarer realistisk tidslinje tidlig.
          </p>
        </section>
        <BemanningLegalSection />
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/bemanning-industri", label: "Industri" },
            { href: "/about", label: "Om ArbeidMatch" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Trondheim – vi starter med krav og leverer profiler som er forberedt på
          norske forhold.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Send forespørsel
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            Les mer for arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
