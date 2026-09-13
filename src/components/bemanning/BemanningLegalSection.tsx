export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:rounded-[12px] md:border md:border-[rgba(201,168,76,0.15)] md:border-l-[3px] md:bg-[rgba(255,255,255,0.04)] md:px-[28px] md:py-[24px]"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-base md:font-bold md:text-white">
        Før vi plasserer noen hos dere
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[14px] md:leading-[1.7] md:text-[rgba(255,255,255,0.75)]">
        Innleie fra bemanningsforetak er ikke fritt i Norge, og hva som er tillatt, avhenger av situasjonen deres, faget
        og hvor arbeidet utføres. Vi går gjennom dette med dere før noen begynner, avtaler grunnlaget skriftlig og
        oppbevarer det på oppdraget sammen med kontrakten, lønnsvilkårene og de registrerte timene. Det er dokumentasjonen
        dere vil ha klar hvis dere noen gang blir spurt om det.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[13px] md:leading-[1.7] md:text-[rgba(255,255,255,0.55)]">
        Vi er rekrutterere, ikke jurister, så vi tolker ikke regelverket for dere. Reglene publiseres av Arbeidstilsynet,
        og for alt som er bindende, bør dere bruke dem eller deres egen juridiske rådgiver.
      </p>
      <p className="mt-4">
        <a
          href="https://www.arbeidstilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-gold underline-offset-4 hover:underline md:text-[#C9A84C] md:underline"
        >
          Les regelverket hos Arbeidstilsynet.no
        </a>
      </p>
    </section>
  );
}
