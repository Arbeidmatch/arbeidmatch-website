"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import { Star } from "lucide-react";
import { useRef } from "react";

const testimonials = [
  {
    quote:
      "The tile workers we got through ArbeidMatch were exactly what we needed. Professional, reliable, always showed up. Great craftsmanship.",
    name: "Nikolas",
    company: "Fin Flislegger AS",
    label: "Client",
  },
  {
    quote:
      "We look forward to working with ArbeidMatch on future projects. The workers delivered showed professionalism, reliability and great craftsmanship.",
    name: "Lars Berge",
    company: "Berge Bemanning AS",
    label: "Partner",
  },
  {
    quote:
      "ArbeidMatch delivered pre-screened candidates for our projects. Structured process, fast delivery, excellent results.",
    name: "Øystein",
    company: "People AS",
    label: "Partner",
  },
  {
    quote:
      "We needed a reliable mechanic quickly. ArbeidMatch delivered a highly skilled professional who fit perfectly from day one.",
    name: "Terje",
    company: "Winther Auto Service AS",
    label: "Client",
  },
];

function StarRow() {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#C9A84C] text-[#C9A84C]" strokeWidth={1.25} />
      ))}
    </div>
  );
}

type TestimonialsProps = {
  sectionClassName?: string;
};

export default function Testimonials({ sectionClassName }: TestimonialsProps = {}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section ref={ref} className={sectionClassName ?? "section-y-home bg-[#0D1B2A]"}>
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <motion.div
          className="text-center"
          initial={reduce ? false : { opacity: 0, y: 22 }}
          animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
          transition={{ duration: 0.62, ease: EASE_PREMIUM }}
        >
          <h2 className="am-h2 heading-premium-xl font-sans font-extrabold tracking-tight text-white">What our clients say</h2>
          <p className="text-home-subtle mx-auto mt-5 max-w-md">
            Trusted by Norwegian employers and staffing partners.
          </p>
        </motion.div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              className="flex h-full min-h-0 flex-col rounded-[20px] border border-[rgba(201,168,76,0.12)] bg-[rgba(255,255,255,0.03)] p-9 md:p-11"
              initial={reduce ? false : { opacity: 0, y: 26 }}
              animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }}
              transition={{ duration: 0.62, delay: reduce ? 0 : index * 0.08, ease: EASE_PREMIUM }}
            >
              <StarRow />
              <p className="mt-6 flex-1 text-[16px] font-normal leading-[1.72] tracking-[-0.01em] text-white/[0.72] md:text-[17px]">
                {item.quote}
              </p>
              <div className="mt-auto pt-8">
                <p className="text-[14px] font-medium tracking-tight text-white">
                  {item.name}
                  <span className="font-normal text-white/45"> · {item.company}</span>
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">{item.label}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
