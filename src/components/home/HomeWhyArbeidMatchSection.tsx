import ScrollReveal from "@/components/ScrollReveal";

const USP_ITEMS: { title: string; body: string }[] = [
  {
    title: "Pre-screened candidates",
    body: "We verify skills, experience, and documentation before presenting any candidate. You only see workers ready for your project.",
  },
  {
    title: "Norwegian compliance built-in",
    body: "D-number registration, Arbeidstilsynet minimum wages, EU/EEA right-to-work status. Compliance is part of our process, not an afterthought.",
  },
  {
    title: "Dignified process",
    body: "Clear communication across languages and cultures. Candidates know what to expect. Clients know what they get. Respect throughout.",
  },
];

export default function HomeWhyArbeidMatchSection() {
  return (
    <section className="overflow-x-clip border-b border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] py-12 md:py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-12">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="am-h2 font-display text-[1.35rem] font-extrabold tracking-[-0.03em] text-white sm:text-2xl md:text-3xl">
            Why ArbeidMatch?
          </h2>
        </ScrollReveal>

        <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-2 md:gap-6 lg:mt-12 lg:grid-cols-3 lg:gap-8">
          {USP_ITEMS.map((item, index) => (
            <ScrollReveal
              key={item.title}
              variant="fadeUp"
              className={index === 2 ? "md:col-span-2 md:flex md:justify-center lg:col-span-1" : ""}
            >
              <article
                className={`relative h-full rounded-xl border border-[#0D1B2A]/10 bg-white p-6 transition-none md:p-7 lg:p-8 lg:transition-transform lg:duration-200 lg:hover:-translate-y-0.5 ${
                  index === 2 ? "w-full md:max-w-md lg:max-w-none" : ""
                }`}
              >
                <h3 className="text-lg font-semibold leading-snug text-[#0D1B2A] md:text-xl lg:text-[22px]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#0D1B2A]/80 md:text-[15px] lg:text-base">{item.body}</p>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
