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
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning renhold</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning renhold med fokus på kvalitet og trygghet
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Renhold påvirker merkevare, arbeidsmiljø og kundetrafikk. ArbeidMatch leverer EU/EEA-profiler som forstår
            rutiner for desinfeksjon, soner og materialbruk – enten det gjelder handel, kontor eller borettslag med
            hyppige vaktbytter.
          </p>
          <p>
            Vi avklarer arbeidstid, transport og språkbehov tidlig. Kandidater presenteres med tydelig erfaringsbasis
            slik at driftsleder slipper å bruke verdifull tid på uforberedte intervjuer.
          </p>
          <p>
            Bemanning renhold skal være forutsigbar: faste team der det er behov, og fleksible vikarer når sykdom eller
            topper oppstår. Vi hjelper dere å finne riktig balanse.
          </p>
        </div>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-horeca", label: "HoReCa" },
            { href: "/bemanning-helse", label: "Helse & omsorg" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Få tilbud
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            Arbeidsgiver
          </Link>
        </div>
      </div>
    </article>
  );
}
