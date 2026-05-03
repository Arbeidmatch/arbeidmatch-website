import type { LucideIcon } from "lucide-react";
import { Heart, ShieldCheck, UserCheck } from "lucide-react";

import ScrollReveal from "@/components/ScrollReveal";

const USP_ITEMS: { title: string; body: string; Icon: LucideIcon }[] = [
  {
    title: "Pre-screened candidates",
    body: "We verify skills, experience, and documentation before presenting any candidate. You only see workers ready for your project.",
    Icon: UserCheck,
  },
  {
    title: "Norwegian compliance built-in",
    body: "D-number registration, Arbeidstilsynet minimum wages, EU/EEA right-to-work status. Compliance is part of our process, not an afterthought.",
    Icon: ShieldCheck,
  },
  {
    title: "Dignified process",
    body: "Clear communication across languages and cultures. Candidates know what to expect. Clients know what they get. Respect throughout.",
    Icon: Heart,
  },
];

export default function HomeWhyArbeidMatchSection() {
  return (
    <section className="overflow-x-clip border-b border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] pb-12 pt-6 md:pb-16 md:pt-8 lg:pb-24 lg:pt-8">
      <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10 lg:px-12">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="mb-8 font-display text-[24px] font-bold leading-tight tracking-[-0.02em] text-[rgba(255,255,255,0.98)] lg:mb-12 lg:text-[32px]">
            Why ArbeidMatch?
          </h2>
        </ScrollReveal>

        <div className="mt-0 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          {USP_ITEMS.map((item) => {
            const Icon = item.Icon;
            return (
              <ScrollReveal key={item.title} variant="fadeUp" className="h-full min-h-0">
                <article className="flex h-full min-h-0 flex-col rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] p-6 transition-transform duration-200 lg:p-8 lg:hover:-translate-y-0.5">
                  <Icon className="mb-4 h-6 w-6 shrink-0 text-[#C9A84C]" strokeWidth={1.65} aria-hidden />
                  <h3 className="text-[20px] font-semibold leading-snug text-[rgba(255,255,255,0.98)]">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-[rgba(255,255,255,0.70)]">{item.body}</p>
                </article>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
