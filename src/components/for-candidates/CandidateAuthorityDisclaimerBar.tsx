export default function CandidateAuthorityDisclaimerBar() {
  return (
    <div className="mx-auto max-w-[700px] text-center" style={{ padding: "20px 24px" }}>
      <p className="text-[11px] italic leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
        ArbeidMatch is a private recruitment agency, not an official Norwegian authority. We share practical guidance to help
        foreign workers navigate the process. Always verify legal requirements with official sources.
      </p>
      <p className="mx-auto mt-2 max-w-[700px] text-center text-[11px] leading-relaxed">
        <a
          href="https://www.dsb.no/en/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium no-underline transition-colors hover:underline"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          DSB.no
        </a>
        <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
        <a
          href="https://www.arbeidstilsynet.no/en/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium no-underline transition-colors hover:underline"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Arbeidstilsynet.no
        </a>
        <span style={{ color: "rgba(255,255,255,0.2)" }}> · </span>
        <a
          href="https://www.nav.no/en/home"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium no-underline transition-colors hover:underline"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          NAV.no
        </a>
      </p>
    </div>
  );
}
