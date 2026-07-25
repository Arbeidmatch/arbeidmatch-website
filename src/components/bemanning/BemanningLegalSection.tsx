export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:rounded-[12px] md:border md:border-[rgba(201,168,76,0.15)] md:border-l-[3px] md:bg-[rgba(255,255,255,0.04)] md:px-[28px] md:py-[24px]"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-base md:font-bold md:text-white">
        Before we place anyone with you
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[14px] md:leading-[1.7] md:text-[rgba(255,255,255,0.75)]">
        Hiring in from a staffing agency is not open-ended in Norway, and what is allowed depends on your situation, your
        trade and where the work happens. We go through that with you before anyone starts, agree the basis in writing, and
        keep it on the assignment together with the contract, the pay terms and the registered hours. That is the file you
        want to have ready if you are ever asked about it.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[13px] md:leading-[1.7] md:text-[rgba(255,255,255,0.55)]">
        We are recruiters, not lawyers, so we do not interpret the rules for you. They are published by Arbeidstilsynet, and
        for anything binding you should use them or your own legal adviser.
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
