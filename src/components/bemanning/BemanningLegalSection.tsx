export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:rounded-[12px] md:border md:border-[rgba(201,168,76,0.15)] md:border-l-[3px] md:bg-[rgba(255,255,255,0.04)] md:px-[28px] md:py-[24px]"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-base md:font-bold md:text-white">
        Who can we help you hire?
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[14px] md:leading-[1.7] md:text-[rgba(255,255,255,0.75)]">
        We source and pre-screen qualified EU/EEA candidates for Norwegian businesses. Employers remain responsible for
        compliance with applicable Norwegian labor law and collective agreements.
      </p>
    </section>
  );
}
