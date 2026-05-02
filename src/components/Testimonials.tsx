import ScrollReveal from "@/components/ScrollReveal";

type Testimonial = {
  quote: string;
  name: string;
  /** Generic job title only; omit if unknown */
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

const disclaimerStyle = { fontSize: "11px", color: "rgba(255,255,255,0.4)" } as const;

export default function Testimonials() {
  return (
    <section className="bg-[#0D1B2A] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="heading-premium-xl font-display text-4xl text-white">What our clients say</h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <ScrollReveal key={item.name} variant="fadeUp">
              <article className="card-premium rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] p-8">
                <p className="text-lg text-gold">★★★★★</p>
                <p className="mt-3 italic text-white/70">{item.quote}</p>
                <p className="mt-4 font-semibold text-white">{item.name}</p>
                {item.role ? <p className="mt-1 text-sm font-normal text-white/70">{item.role}</p> : null}
                {item.verified ? (
                  <p className="mt-3 italic" style={disclaimerStyle}>
                    Verified client testimonial
                  </p>
                ) : null}
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
