export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:px-7 md:py-6"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-xl">
        Når kan du leie inn arbeidskraft?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[15px]">
        I henhold til arbeidsmiljøloven § 14-12 er innleie fra bemanningsforetak tillatt ved midlertidig behov, vikariat,
        praksisarbeid og sesongarbeid. ArbeidMatch opererer innenfor disse rammene og sikrer at alle arbeidsforhold er i
        samsvar med norsk arbeidslovgivning og tariffavtaler.
      </p>
      <p className="mt-4">
        <a
          href="https://www.arbeidstilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-gold underline-offset-4 hover:underline"
        >
          Les regelverket på Arbeidstilsynet.no
        </a>
      </p>
    </section>
  );
}
