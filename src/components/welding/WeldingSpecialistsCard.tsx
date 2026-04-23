"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

        <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-8">
            {[
              "Basic certificate validity check included in our screening",
              "EU/EEA documentation support",
              "Our goal is to connect you with candidates within about two weeks",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden />
                <span className="text-[13px] font-normal leading-snug text-white/52">{t}</span>
              </div>
            ))}
          </div>
          <Link
            href="/contact"
            className="text-[14px] font-medium text-[#C9A84C]/90 underline-offset-[5px] transition-colors hover:text-[#C9A84C] hover:underline lg:mt-0"
          >
            Not sure what certification your project requires? Contact us
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
