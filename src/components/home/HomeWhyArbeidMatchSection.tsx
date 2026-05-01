import ScrollReveal from "@/components/ScrollReveal";

const USP_ITEMS: { num: string; title: string; body: string }[] = [
  {
    num: "01",
    title: "Pre-screened candidates",
    body: "Every worker is verified before you see them.",
  },
  {
    num: "02",
    title: "EU/EEA compliant",
    body: "All candidates have right to work in Norway.",
  },
  {
    num: "03",
    title: "Fast turnaround",
    body: "First candidates presented within 48 hours.",
  },
  {
    num: "04",
    title: "Norwegian compliance",
    body: "Salaries per Arbeidstilsynet minimums.",
  },
  {
    num: "05",
    title: "D-number support",
    body: "We handle registration for candidates who need it.",
  },
  {
    num: "06",
    title: "Dedicated support",
    body: "Direct contact with your recruiter throughout.",
  },
];

export default function HomeWhyArbeidMatchSection() {
  return (
    <section className="border-b border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="am-h2 font-display font-extrabold tracking-[-0.03em] text-white">Why ArbeidMatch?</h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {USP_ITEMS.map((item) => (
            <ScrollReveal key={item.num} variant="fadeUp">
              <article className="relative rounded-2xl border border-solid border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.04)] p-6 pt-11 md:p-7 md:pt-12">
                <span className="absolute left-5 top-4 font-mono text-[11px] font-bold tracking-[0.12em] text-[#C9A84C] md:left-6 md:top-5">
                  {item.num}
                </span>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.6)] md:text-[15px]">{item.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
