import Link from "next/link";

export default function BemanningLegalSection() {
  return (
    <section
      className="my-12 rounded-lg border-l-[3px] border-[#C9A84C] px-5 py-5 md:px-7 md:py-6"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-legal-heading"
    >
      <h2 id="bemanning-legal-heading" className="text-base font-semibold text-navy md:text-[16px]">
        Viktig informasjon om bemanningsregler
      </h2>
      <h3 className="mt-2 text-base font-semibold text-navy md:text-[16px]">Når kan norske bedrifter bruke bemanningsbyrå?</h3>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary md:text-[15px]">
        <p>
          I henhold til norsk arbeidsmiljølov § 14-12 kan innleie fra bemanningsforetak benyttes i følgende tilfeller:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ved midlertidig behov som skyldes arbeidets karakter</li>
          <li>Ved vikariat for fast ansatt</li>
          <li>Ved praksisarbeid</li>
          <li>For sesongarbeid og spesialisert kompetanse</li>
        </ul>
        <p>
          ArbeidMatch opererer innenfor disse rammene og sikrer at alle arbeidsforhold oppfyller krav til lønn, HMS og
          norsk tariffavtale.
        </p>
      </div>
      <p className="mt-4">
        <Link
          href="https://www.arbeidstilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-[13px] font-medium text-gold underline-offset-4 hover:underline"
        >
          Les mer om regelverket → arbeidstilsynet.no
        </Link>
      </p>
    </section>
  );
}
