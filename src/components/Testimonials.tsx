import ScrollReveal from "@/components/ScrollReveal";

type Testimonial = {
  quote: string;
  name: string;
  role?: string;
  verified: true;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "The tile workers we got through ArbeidMatch were exactly what we needed. Professional, reliable, always showed up. Great craftsmanship.",
    name: "Nikolas",
    verified: true,
  },
  {
    quote:
      "We look forward to working with ArbeidMatch on future projects. The workers delivered showed professionalism, reliability and great craftsmanship.",
    name: "Lars Berge",
    verified: true,
  },
  {
    quote:
      "ArbeidMatch delivered pre-screened candidates for our projects. Structured process, fast delivery, excellent results.",
    name: "Øystein",
    verified: true,
  },
  {
    quote:
      "We needed a reliable mechanic quickly. ArbeidMatch delivered a highly skilled professional who fit perfectly from day one.",
    name: "Terje",
    verified: true,
  },
];

export default function Testimonials() {
  return (
    <section className="overflow-x-clip bg-[#0D1B2A] py-10 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-12">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.03em] text-white md:text-3xl lg:text-4xl">
            What our clients say
          </h2>
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6 lg:mt-12 lg:gap-8">
          {testimonials.map((item) => (
            <ScrollReveal key={item.name} variant="fadeUp">
              <article className="relative overflow-hidden rounded-xl border border-[#0D1B2A]/10 bg-white p-6 shadow-sm md:p-7 lg:p-8">
                <span
                  className="pointer-events-none absolute left-2 top-1 select-none font-serif text-[4rem] leading-none text-[#C9A84C]/30 md:left-3 md:text-[4.5rem] lg:text-[5rem]"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p className="relative z-[1] w-fit text-xs leading-none text-[#C9A84C] md:text-sm lg:text-[14px]">★★★★★</p>
                <p className="relative z-[1] mt-3 text-base font-medium leading-snug text-[#0D1B2A] md:text-lg lg:text-xl xl:text-2xl">
                  {item.quote}
                </p>
                <p className="relative z-[1] mt-4 text-[13px] font-semibold text-[#0D1B2A] md:text-sm lg:text-[14px]">{item.name}</p>
                {item.role ? (
                  <p className="relative z-[1] mt-1 text-xs font-normal text-[#0D1B2A]/70 md:text-sm">{item.role}</p>
                ) : null}
              </article>
            </ScrollReveal>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs italic leading-relaxed text-white/50 md:mt-10 md:text-sm lg:mt-12">
          All testimonials are from verified clients. Names shown are real first names.
        </p>
      </div>
    </section>
  );
}
