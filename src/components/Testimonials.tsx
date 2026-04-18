import ScrollReveal from "@/components/ScrollReveal";

const testimonials = [
  {
    quote:
      "The tile workers we got through ArbeidMatch were exactly what we needed. Professional, reliable, always showed up. Great craftsmanship.",
    name: "Nikolas",
    company: "Fin Flislegger AS",
  },
  {
    quote:
      "We look forward to working with ArbeidMatch on future projects. The workers delivered showed professionalism, reliability and great craftsmanship.",
    name: "Lars Berge",
    company: "Berge Bemanning AS",
  },
  {
    quote:
      "ArbeidMatch delivered pre-screened candidates for our projects. Structured process, fast delivery, excellent results.",
    name: "Øystein",
    company: "People AS",
  },
  {
    quote:
      "We needed a reliable mechanic quickly. ArbeidMatch delivered a highly skilled professional who fit perfectly from day one.",
    name: "Terje",
    company: "Winther Auto Service AS",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-surface py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="heading-premium-xl font-display text-4xl text-navy">What our clients say</h2>
        </ScrollReveal>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <ScrollReveal key={item.name} variant="fadeUp">
              <article className="card-premium rounded-xl border border-border bg-white p-8">
                <p className="text-lg text-gold">★★★★★</p>
                <p className="mt-3 italic text-text-secondary">{item.quote}</p>
                <p className="mt-4 font-semibold text-navy">
                  {item.name} <span className="font-normal text-text-secondary">| {item.company}</span>
                </p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
