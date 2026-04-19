import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning Stavanger olje og industri",
  description:
    "Bemanning Stavanger olje industri og logistikk. EU/EEA-fagarbeidere til vedlikehold og bygg – ta kontakt i Stavanger.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanningsbyrå-stavanger" },
};

export default function BemanningsbyraStavangerPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Lokalside</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning Stavanger olje industri – når sikkerhetskrav og tempo møtes
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Rogaland er et kraftsentrum for energi, leverandørindustri og havnæring, med bolig- og infrastrukturprosjekter
            som krever dokumentert kompetanse og tydelig sikkerhetsbrief. ArbeidMatch leverer bemanning Stavanger med
            forventningsstyring: vi avklarer kurs, adgang og roller før presentasjon. Vi tilstreber profiler som kan
            verifiseres - ikke «ukjente navn på liste».
          </p>
          <p>
            Vi rekrutterer fra EU/EEA med fokus på regulerte miljø og prosjektmodus. Ta kontakt via{" "}
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
          <h2 className="text-lg font-semibold text-navy">Etterspurte roller i Rogaland</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-text-secondary">
            <li>Industri- og vedlikeholdsassistenter med dokumentert erfaring</li>
            <li>Sveis og mekanisk hjelp til verksted og modulbygging</li>
            <li>Logistikk og truck mot havn og forbundsårer</li>
            <li>Byggfag til bolig og næring i storbyregionen</li>
          </ul>
        </section>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Sikkerhetskrav", "Vi matcher kandidater mot dokumentasjon og offshore/HMS-forventninger."],
            ["Nasjonal oppfølging", "Kort vei til koordinering når innkjøps- og sikkerhetsløp er avklart."],
            ["Ingen absolutte løfter", "Leveranse avhenger av marked og kompetanse - vi er åpne om det."],
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
            Dekker dere offshore? - Avhengig av kurs og autorisasjoner; vi avklarer før vi presenterer kandidater.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-industri", label: "Industri & produksjon" },
            { href: "/bemanning-logistikk", label: "Logistikk" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <p className="mt-10 text-lg font-semibold text-navy">
          Ta kontakt med oss for bemanning i Stavanger – vi kobler sikkerhetskrav med reell rekrutteringskapasitet.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Avklar behov
          </Link>
          <Link
            href="/contact"
            className="inline-flex min-h-[48px] w-full min-w-[44px] items-center justify-center text-sm font-semibold text-gold underline sm:w-auto"
          >
            Kontakt oss
          </Link>
        </div>
      </div>
    </article>
  );
}
