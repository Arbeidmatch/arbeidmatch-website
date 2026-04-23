"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import { useRef } from "react";
import WeldingCertGrid from "./WeldingCertGrid";

const GOLD = "#C9A84C";

export default function WeldingSpecialistsCard() {
  const rootRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const inView = useInView(rootRef, { once: true, amount: 0.12 });

  return (
    <motion.section
      ref={rootRef}
      className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-12 lg:px-0 lg:py-12"
      initial={reduce ? false : { opacity: 0, y: 28 }}
      animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.68, ease: EASE_PREMIUM }}
    >
      <div
        className="rounded-2xl border p-8 lg:p-12"
        style={{
          background: "linear-gradient(165deg, #0d1b2a 0%, #111f30 48%, #0d1b2a 100%)",
          borderColor: "rgba(201,168,76,0.18)",
        }}
      >
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded-full border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{
                background: "rgba(201,168,76,0.1)",
                borderColor: "rgba(201,168,76,0.35)",
                color: GOLD,
              }}
            >
              Specialized Recruitment
            </span>
            <h2 className="mt-5 font-extrabold leading-[1.15] tracking-tight text-white [font-size:clamp(24px,3.5vw,40px)]">
              ISO-Certified Welders and Specialist Technicians
            </h2>
            <p className="mt-4 max-w-[560px] text-[16px] font-normal leading-[1.65] tracking-tight text-white/58">
              We source pre-screened welders and technical specialists holding valid ISO certifications, EN standards, and
              sector-specific authorizations. We ask candidates to provide current certification documents and check basic
              validity as part of our screening process. Prepared to start work on demanding Norwegian and international
              projects.
            </p>
            <Link
              href="/request?role=Welder"
              className="btn-gold-premium group mt-8 inline-flex w-full min-h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#C9A84C] px-8 py-4 text-[15px] font-semibold tracking-tight text-[#0D1B2A] transition-colors duration-200 hover:bg-[#b8953f] md:hidden"
            >
              Request Welding Specialists
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          </div>
          <div className="hidden shrink-0 self-center md:block">
            <Link
              href="/request?role=Welder"
              className="btn-gold-premium group inline-flex min-h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#C9A84C] px-8 py-4 text-[15px] font-semibold tracking-tight text-[#0D1B2A] transition-colors duration-200 hover:bg-[#b8953f]"
            >
              Request Welding Specialists
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="my-10 h-px bg-white/[0.05]" />

        <WeldingCertGrid variant="dark" />

        <div className="mt-10 space-y-6">
          <p className="max-w-[760px] text-[14px] leading-relaxed text-white/60">
            Basic certificate validity checks are included in our screening, and we support candidates with EU/EEA
            documentation requirements so onboarding stays efficient from selection to arrival.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <GraduationCap className="h-6 w-6 text-[#C9A84C]" aria-hidden />
            <h3 className="mt-4 text-lg font-semibold text-white">Need certification before arriving in Norway?</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              We help candidates obtain the required certifications before leaving their home country. No delays, no
              surprises on arrival.
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-xl bg-[#C9A84C] px-6 py-3 font-medium text-[#0D1B2A]"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
