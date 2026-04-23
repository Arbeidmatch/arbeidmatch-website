export default function DsbPublicOverviewBar() {
  return (
    <section
      className="border-y border-white/[0.06] bg-[#0f1923] px-6 py-[14px] text-center md:px-12 lg:px-20"
      style={{ boxSizing: "border-box" }}
    >
      <p className="mx-auto max-w-3xl text-[13px] italic leading-relaxed text-white/[0.45]">
        This page provides an overview of the DSB authorization process based on publicly available information from DSB.no.
        ArbeidMatch is not an official authority and does not process applications on behalf of DSB. For official guidance
        and to submit your application, go to DSB.no directly.{" "}
        <a
          href="https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium not-italic text-[#C9A84C] underline-offset-2 hover:underline"
        >
          Go to DSB.no
        </a>
      </p>
    </section>
  );
}
