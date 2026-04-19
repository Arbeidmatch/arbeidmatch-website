export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:px-7 md:py-6"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-xl">
        When can you hire through a staffing agency?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[15px]">
        Under Norwegian law (Working Environment Act section 14-12), hiring through a staffing agency is permitted for
        temporary needs, substitution for permanent employees, work placements, and seasonal work. ArbeidMatch operates
        within these rules and works to ensure all employment arrangements comply with Norwegian labor law and collective
        agreements.
      </p>
      <p className="mt-4">
        <a
          href="https://www.arbeidstilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium text-gold underline-offset-4 hover:underline"
        >
          Read the regulations at Arbeidstilsynet.no
        </a>
      </p>
    </section>
  );
}
