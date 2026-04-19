import Link from "next/link";
import type { Metadata } from "next";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export const metadata: Metadata = {
  title: "Bemanning logistikk og lager",
  description:
    "Vikarbyrå logistikk: truckførere, lagerarbeidere og terminalpersonell fra EU/EØS. Rask bemanning med dokumentasjon – ta kontakt.",
  alternates: { canonical: "https://www.arbeidmatch.no/bemanning-logistikk" },
};

export default function BemanningLogistikkPage() {
  return (
    <article className="bg-white">
      <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning logistikk</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-extrabold text-navy md:text-4xl">
          Bemanning logistikk med folk som behersker terminaltempo
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Norske distribusjonsnett presser kapasiteten: sesongtopper, JIT-leveranser og strengere krav til sikker
            truck- og truckløyve. ArbeidMatch rekrutterer EU/EEA-kandidater til lager, terminal og kjøring der
            dokumentasjon og språkbehov er avklart på forhånd.
          </p>
          <p>
            Vi kartlegger skift, truckklasser, terminalerfaring og ordreplukk. Teamene får profiler som tåler fysisk
            tempo samtidig som HMS og kvalitetsrutiner følges. For oppdragsgiver betyr det færre avbrudd i flyt og
            tydeligere planlegging av bemanning.
          </p>
          <p>
            Kombiner bemanning logistikk med trygg kontraktsoppfølging: vi støtter i dialog om innleie, onboarding og
            praktisk koordinering slik at drift og HR slipper unødvendig friksjon.
          </p>
        </div>
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-bygg-anlegg", label: "Bygg & Anlegg" },
            { href: "/bemanning-industri", label: "Industri & produksjon" },
            { href: "/bemanningsbyrå-oslo", label: "Bemanning Oslo" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/request" className="btn-gold-premium inline-flex min-h-[44px] items-center rounded-md px-6 py-3 text-sm font-semibold text-white">
            Diskuter behov
          </Link>
          <Link href="/for-employers" className="inline-flex min-h-[44px] items-center rounded-md border border-navy px-6 py-3 text-sm font-semibold text-navy">
            For arbeidsgivere
          </Link>
        </div>
      </div>
    </article>
  );
}
