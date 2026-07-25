export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:rounded-[12px] md:border md:border-[rgba(201,168,76,0.15)] md:border-l-[3px] md:bg-[rgba(255,255,255,0.04)] md:px-[28px] md:py-[24px]"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-base md:font-bold md:text-white">
        When can you hire through a staffing agency?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[14px] md:leading-[1.7] md:text-[rgba(255,255,255,0.75)]">
        Under Norwegian law (Arbeidsmiljøloven), hiring in from a staffing agency is allowed on specific grounds rather than
        whenever it suits. The main ones are covering for an absent employee (vikariat) and a written agreement with elected
        representatives where the business is bound by a nationwide collective agreement. Separate rules apply to health
        personnel and to specialist consultants. There are also geographic limits: hiring in for construction work on building
        sites is banned in the Oslo area and neighbouring counties. Which basis applies depends on your situation, so we
        establish it with you before anyone is placed, and we document it on the assignment.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[13px] md:leading-[1.7] md:text-[rgba(255,255,255,0.55)]">
        This is general information, not legal advice, and the rules on hiring in have changed several times in recent years.
        Check the current rules and the exact geographic scope with Arbeidstilsynet before planning an assignment.
      </p>
      <p className="mt-4">
        <a
          href="https://www.arbeidstilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-gold underline-offset-4 hover:underline md:text-[#C9A84C] md:underline"
        >
          Read the regulations at Arbeidstilsynet.no
        </a>
      </p>
    </section>
  );
}
