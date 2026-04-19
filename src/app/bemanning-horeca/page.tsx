import Link from "next/link";
import type { Metadata } from "next";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
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
      <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold">Bemanning HoReCa</p>
        <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold text-navy">
          Bemanning HoReCa når gjesteøkningen kommer over natta
        </h1>
        <div className="mt-8 max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Serveringsbransjen lever av topper: konferanser, høytider og sesongarbeid. ArbeidMatch rekrutterer
            EU/EEA-personell til kjøkkenhjelp, renhold i front og drift som tåler høyt tempo uten å gå på kompromiss
            med hygienestandarder.
          </p>
          <p>
            Vi kartlegger skift, språk i møte med gjester og mattrygghet. Kandidater presenteres med tydelig erfaring
            fra tilsvarende miljø. Målet er forutsigbar bemanning som kan skaleres — uten å love ubegrenset kapasitet i
            alle topper. Les mer om{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              arbeidsgiverløsning
            </Link>{" "}
            eller send{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              forespørsel
            </Link>
            .
          </p>
        </div>
        <section className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {[
            ["Mattrygghet", "Erfaring fra storkjøkken og hotell — avklart før presentasjon."],
            ["Skift og språk", "Vi matcher behov mot reell erfaring i gjestemøte."],
            ["Sesongtopper", "Vi skalerer der markedet tillater — uten absolutte løfter om volum."],
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
        <BemanningLegalSection />
        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-renhold", label: "Renhold & facility" },
            { href: "/bemanningsbyrå-bergen", label: "Bemanning Bergen" },
            { href: "/for-employers", label: "For arbeidsgivere" },
          ]}
        />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/request"
            className="btn-gold-premium inline-flex min-h-[48px] w-full items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-white sm:w-auto"
          >
            Planlegg bemanning
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
