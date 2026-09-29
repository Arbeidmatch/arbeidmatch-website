/**
 * Innleie done properly, said from the client's side.
 *
 * The owner's choice, 29 September 2026: the section answers the fear a client
 * has about hiring through an agency (an inspection, a fine) with what we do
 * before anyone starts, and no longer carries the line that we are not lawyers,
 * which read as a disclaimer on a sales page. No legal claim was added.
 */
export default function BemanningLegalSection() {
  return (
    <section
      className="rounded-lg border-l-[3px] border-[#C9A84C] px-7 py-6 md:rounded-[12px] md:border md:border-[rgba(201,168,76,0.15)] md:border-l-[3px] md:bg-[rgba(255,255,255,0.04)] md:px-[28px] md:py-[24px]"
      style={{ background: "rgba(201,168,76,0.06)" }}
      aria-labelledby="bemanning-innleie-heading"
    >
      <h2 id="bemanning-innleie-heading" className="text-lg font-semibold text-navy md:text-base md:font-bold md:text-white">
        Innleie gjort ordentlig, fra første dag
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary md:text-[14px] md:leading-[1.7] md:text-[rgba(255,255,255,0.75)]">
        Før noen begynner hos dere, avklarer vi grunnlaget for innleien sammen med dere og avtaler det skriftlig. Kontrakten,
        lønnsvilkårene og timene samles på oppdraget, så dere har dokumentasjonen klar hvis Arbeidstilsynet spør.
      </p>
      <p className="mt-4">
        <a
          href="https://www.arbeidstilsynet.no"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] min-w-[44px] items-center text-sm font-medium italic text-gold underline-offset-4 hover:underline md:text-[#C9A84C] md:underline"
        >
          Reglene finner dere hos Arbeidstilsynet.no
        </a>
      </p>
    </section>
  );
}
