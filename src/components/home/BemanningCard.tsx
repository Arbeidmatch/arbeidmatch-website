"use client";

import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { EASE_PREMIUM } from "@/lib/animationConstants";
import { useRef } from "react";

const GOLD = "#C9A84C";

export default function BemanningCard() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, amount: 0.15, margin: "0px 0px -8% 0px" });

  const points = [
    "Pre-screened candidates from EU and EEA countries",
    "You choose the candidates, we handle the sourcing",
    "No competition with your clients",
  ];

  return (
    <section className="bg-[#0D1B2A] px-6 pb-16 pt-2 md:px-12 md:pb-20 lg:px-20 lg:pb-24">
      <motion.div
        ref={ref}
        className="mx-auto w-full max-w-[1100px]"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={reduce || inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        transition={{ duration: 0.68, ease: EASE_PREMIUM }}
      >
        <div
          className="rounded-[20px] border px-7 py-7 md:px-12 md:py-12"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(201,168,76,0.15)",
            borderWidth: 1,
            borderStyle: "solid",
          }}
        >
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <span
                className="inline-block rounded-[50px] border px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  borderColor: "rgba(201,168,76,0.35)",
                  color: GOLD,
                }}
              >
                For staffing agencies
              </span>
              <h2
                className="mt-4 font-extrabold text-white"
                style={{ fontSize: "clamp(22px, 3vw, 36px)", lineHeight: 1.2 }}
              >
                We are not your competitor. We are your source.
              </h2>
              <p className="mt-3 max-w-[520px] text-[15px] leading-[1.7]" style={{ color: "rgba(255,255,255,0.6)" }}>
                ArbeidMatch specializes in sourcing and pre-screening EU/EEA candidates. You keep the client relationship. We
                supply the candidates.
              </p>
              <ul className="mt-5 space-y-2.5">
                {points.map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-[14px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col items-stretch self-center lg:items-center">
              <Link
                href="/request"
                className="btn-gold-premium inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-[#C9A84C] px-8 py-4 text-center text-[15px] font-semibold tracking-tight text-[#0D1B2A] transition-colors duration-200 hover:bg-[#b8953f]"
              >
                Send us a candidate request
              </Link>
              <Link
                href="/for-staffing-agencies"
                className="mt-4 block text-center text-[13px] font-medium text-[#C9A84C]/90 underline-offset-[5px] transition-colors hover:text-[#C9A84C] hover:underline"
              >
                Learn more about partnership
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
