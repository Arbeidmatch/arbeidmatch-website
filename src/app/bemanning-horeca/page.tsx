import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning HoReCa og servering",
  description:
    "Kjøkken, servering og drift til hotell og restaurant. EU/EEA-bemanning med hygienefokus – ta kontakt.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanning-horeca" },
};

export default function BemanningHorecaPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning HoReCa</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning HoReCa når gjesteøkningen kommer over natta
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Serveringsbransjen lever av topper: konferanser, høytider og sesongarbeid. ArbeidMatch rekrutterer
            EU/EEA-personell til kjøkkenhjelp, renhold i front og drift som tåler høyt tempo uten å gå på kompromiss
            med hygienestandarder.
          </p>
          <p>
            Vi kartlegger skift, språk i møte med gjester og interne krav til mattrygghet. Kandidater presenteres med
            tydelig erfaring fra tilsvarende miljø – fra storkjøkken til boutique-hotell.
          </p>
          <p>
            Målet er at kjøkkensjefer og hotellsjefer får forutsigbar bemanning som kan skaleres opp og ned uten å
            belaste kjerneteamet unødig.
          </p>
        </div>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-renhold", label: "Renhold & facility" },
            { href: "/bemanningsbyrå-bergen", label: "Bemanning Bergen" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Planlegg bemanning
          </Link>
          <Link href="/contact" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-gold underline">
            Kontakt oss
          </Link>
        </div>
      </div>
    </article>
  );
}
