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
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h2 className="text-center text-4xl font-bold text-navy">How we work</h2>
        <p className="mt-4 text-center text-text-secondary">Simple, fast, transparent</p>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.no} className="relative rounded-xl border border-border p-8">
              {index < steps.length - 1 && (
                <span className="absolute right-[-20px] top-10 hidden h-[2px] w-10 bg-border md:block" />
              )}
              <p className="text-3xl font-bold text-gold">{step.no}</p>
              <h3 className="mt-3 text-xl font-semibold text-navy">{step.title}</h3>
              <p className="mt-3 text-text-secondary">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
