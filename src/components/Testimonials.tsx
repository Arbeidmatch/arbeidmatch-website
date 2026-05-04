import ScrollReveal from "@/components/ScrollReveal";

type Testimonial = {
  id: string;
  quote: string;
  /** Lars Berge is the only full-name reference; others use initials only. */
  displayName: string;
  featured?: boolean;
};

const ROLE_LABEL = "Daglig leder";

const testimonials: Testimonial[] = [
  {
    id: "tile-workers",
    quote:
      "The tile workers we got through ArbeidMatch were exactly what we needed. Professional, reliable, always showed up. Great craftsmanship.",
    displayName: "N.",
  },
  {
    id: "lars-berge",
    quote:
      "We look forward to working with ArbeidMatch on future projects. The workers delivered showed professionalism, reliability and great craftsmanship.",
    displayName: "Lars Berge",
    featured: true,
  },
  {
    id: "pre-screened",
    quote:
      "ArbeidMatch delivered pre-screened candidates for our projects. Structured process, fast delivery, excellent results.",
    displayName: "Ø.",
  },
  {
    id: "mechanic",
    quote:
      "We needed a reliable mechanic quickly. ArbeidMatch delivered a highly skilled professional who fit perfectly from day one.",
    displayName: "T.",
  },
];

function StarRow() {
  return (
    <div
      className="relative z-[1] flex items-center gap-1 text-[22px] leading-none text-[#C9A84C] md:text-[26px] md:gap-1.5"
      aria-label="5 out of 5 stars"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="drop-shadow-[0_1px_0_rgba(13,27,42,0.12)]" aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="overflow-x-clip bg-[#0D1B2A] py-10 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-12">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="am-h2 font-display font-extrabold tracking-[-0.03em] text-white">What our clients say</h2>
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-1 items-stretch gap-4 md:mt-10 md:grid-cols-2 md:gap-6 lg:mt-12 lg:gap-8">
          {testimonials.map((item) => (
            <ScrollReveal key={item.id} variant="fadeUp" className="h-full min-h-0">
              <article
                className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-[#F4F1EB] p-4 shadow-sm md:p-5 ${
                  item.featured
                    ? "border-[#C9A84C]/45 ring-1 ring-[#C9A84C]/35"
                    : "border-[#0D1B2A]/10"
                }`}
              >
                <span
                  className="pointer-events-none absolute left-2 top-2 select-none font-serif text-[28px] leading-none text-[#C9A84C] md:left-2.5 md:top-2.5 md:text-[32px]"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <div className="relative z-[1] pl-7 pt-0.5 md:pl-8">
                  <StarRow />
                </div>
                <p className="relative z-[1] mt-2 flex-1 text-[15px] font-medium leading-snug text-[#0D1B2A] md:text-base md:leading-relaxed lg:text-[17px]">
                  {item.quote}
                </p>
                <div className="relative z-[1] mt-4 border-t border-[#0D1B2A]/12 pt-3 md:mt-5 md:pt-3.5">
                  <p className="text-[14px] font-bold text-[#0D1B2A] md:text-[15px]">{item.displayName}</p>
                  <p className="mt-0.5 text-[11px] font-normal leading-snug text-[#0D1B2A]/50 md:text-xs">
                    {ROLE_LABEL}
                  </p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs italic leading-relaxed text-white/50 md:mt-10 md:text-sm lg:mt-12">
          All testimonials are from verified clients. Lars Berge is quoted with permission; other names are shown as initials
          for privacy.
        </p>
      </div>
    </section>
  );
}
