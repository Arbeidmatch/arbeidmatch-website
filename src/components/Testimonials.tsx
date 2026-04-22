"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef } from "react";

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

function StarRow() {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#C9A84C]/25 text-[#C9A84C]/45" strokeWidth={1.25} />
      ))}
    </div>
  );
}

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section ref={ref} className="section-y bg-[#0D1B2A]">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <motion.div
          className="text-center"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="am-h2 heading-premium-xl font-sans font-extrabold tracking-tight text-white">What our clients say</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] font-normal leading-relaxed text-white/50">
            Trusted by Norwegian employers and staffing partners.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-8 md:grid-cols-2 md:gap-10">
          {testimonials.map((item, index) => (
            <motion.article
              key={item.name}
              className="rounded-2xl border border-[rgba(201,168,76,0.1)] bg-[rgba(255,255,255,0.025)] p-8 md:p-10"
              initial={reduce ? false : { opacity: 0, y: 22 }}
              animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
              transition={{ duration: 0.5, delay: reduce ? 0 : index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <StarRow />
              <p className="mt-5 text-[16px] font-normal leading-[1.65] tracking-tight text-white/72">{item.quote}</p>
              <p className="mt-8 text-[14px] font-medium tracking-tight text-white">
                {item.name}
                <span className="font-normal text-white/45"> · {item.company}</span>
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
