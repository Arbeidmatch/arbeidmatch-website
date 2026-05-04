export default function DsbPublicOverviewBar() {
  return (
    <section className="border-y border-white/10 bg-navy px-6 py-[14px] text-center md:px-12 lg:px-20">
      <p className="mx-auto max-w-3xl text-[13px] italic leading-relaxed text-white/50">
        This page provides an overview of the DSB authorization process based on publicly available information from DSB.no.
        ArbeidMatch is not an official authority and does not process applications on behalf of DSB. For official guidance
        and to submit your application, go to DSB.no directly. ArbeidMatch provides guide-based support, candidate
        preparation, and job placement assistance.{" "}
        <a
          href="https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium not-italic text-gold underline-offset-2 hover:text-gold-hover hover:underline"
        >
          Go to DSB.no
        </a>
      </p>
    </section>
  );
}
