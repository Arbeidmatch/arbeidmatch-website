import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning renhold og service",
  description:
    "Renholdsoperatører til kontor, handel og borettslag. EU/EEA-bemanning med fokus på kvalitet og rutiner – ta kontakt.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanning-renhold" },
};

export default function BemanningRenholdPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Bemanning renhold</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning renhold med fokus på kvalitet og trygghet
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Renhold påvirker merkevare, arbeidsmiljø og kundetrafikk. ArbeidMatch leverer EU/EEA-profiler som forstår
            rutiner for desinfeksjon, soner og materialbruk – enten det gjelder handel, kontor eller borettslag med
            hyppige vaktbytter.
          </p>
          <p>
            Vi avklarer arbeidstid, transport og språkbehov tidlig. Bemanning renhold skal være forutsigbar: faste team
            der det er behov, og fleksible vikarer når topper oppstår. Vi hjelper dere å finne riktig balanse og viser vei
            til{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              forespørsel
            </Link>{" "}
            når dere er klare.
          </p>
        </div>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Rutiner og soner", "Avklaring av desinfeksjon, materialbruk og arbeidssted."],
            ["Trygg bemanning", "Vi tilstreber tydelige forventninger om vakt og transport."],
            ["Skalerbart", "Fleksibilitet uten å love ubegrenset kapasitet i alle topper."],
          ].map(([t, b]) => (
            <article
              key={t}
              className="rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]"
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
            Kan dere dekke helgevakter? - Avhengig av tilgjengelighet og område; vi avklarer før oppstart.
          </p>
        </section>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-horeca", label: "HoReCa" },
            { href: "/bemanning-helse", label: "Helse & omsorg" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Få tilbud
          </Link>
          <Link
            href="/for-employers"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy sm:w-auto"
          >
            Arbeidsgiver
          </Link>
        </div>
      </div>
    </article>
  );
}
