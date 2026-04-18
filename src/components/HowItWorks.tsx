import ScrollReveal from "@/components/ScrollReveal";

const steps = [
  {
    no: "01",
    title: "Tell us your needs",
    text: "Fill our request form with position, location and requirements.",
  },
  {
    no: "02",
    title: "We source and screen",
    text: "Our team finds and qualifies candidates across Europe. Only the best are presented.",
  },
  {
    no: "03",
    title: "Workers arrive ready",
    text: "Pre-screened, documented and ready to start. We handle contracts, payroll and HMS.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-28 lg:py-32">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="heading-premium-xl font-display text-4xl text-navy">How we work</h2>
        </ScrollReveal>
        <ScrollReveal variant="fadeUp" className="text-center">
          <p className="subheading-premium mt-4">Simple, fast, transparent</p>
        </ScrollReveal>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <ScrollReveal key={step.no} variant="fadeUp">
              <div className="hiw-step-card group card-premium relative rounded-xl border border-border p-8">
                {index < steps.length - 1 && (
                  <span className="absolute right-[-20px] top-10 hidden h-[2px] w-10 bg-border md:block" />
                )}
                <p className="hiw-step-icon text-3xl font-bold text-gold">{step.no}</p>
                <h3 className="mt-3 text-xl font-semibold text-navy">{step.title}</h3>
                <p className="mt-3 text-text-secondary">{step.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
