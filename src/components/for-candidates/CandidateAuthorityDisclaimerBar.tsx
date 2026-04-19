export default function CandidateAuthorityDisclaimerBar() {
  return (
    <section
      className="border-y border-white/[0.06] bg-[#0f1923] px-6 py-[14px] text-center md:px-12 lg:px-20"
      style={{ boxSizing: "border-box" }}
    >
      <p className="mx-auto max-w-3xl text-[13px] italic leading-relaxed text-white/[0.45]">
        ArbeidMatch is a private recruitment agency, not an official Norwegian authority. We share practical guidance to help
        foreign workers navigate the process. Always verify legal requirements with official sources.
      </p>
      <p className="mx-auto mt-2 max-w-3xl text-[12px] leading-relaxed">
        <a
          href="https://www.dsb.no/en/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
        >
          DSB.no
        </a>
        <span className="text-white/30"> · </span>
        <a
          href="https://www.arbeidstilsynet.no/en/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
        >
          Arbeidstilsynet.no
        </a>
        <span className="text-white/30"> · </span>
        <a
          href="https://www.nav.no/en/home"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#C9A84C] underline-offset-2 hover:underline"
        >
          NAV.no
        </a>
      </p>
    </section>
  );
}
