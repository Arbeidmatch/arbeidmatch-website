"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const HERO_EASE = [0.16, 1, 0.3, 1] as const;

export default function ForEmployersHero() {
  const reduce = useReducedMotion();

  const heroFade = (delaySec: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0 } as const,
          animate: { opacity: 1 } as const,
          transition: { duration: 0.75, delay: delaySec, ease: HERO_EASE },
        };

  return (
    <div className="rn-hero-inner mx-auto w-full max-w-content px-4 md:px-6">
      {!reduce ? (
        <>
          <motion.p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B8860B]" {...heroFade(0)}>
            FOR EMPLOYERS
          </motion.p>
          <h1
            className="mt-6 min-w-0 break-words font-sans font-extrabold tracking-[-0.04em] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6.25rem)", lineHeight: 1.02 }}
          >
            <motion.span className="block" {...heroFade(0.1)}>
              Qualified EU/EEA
            </motion.span>
            <motion.span className="block" {...heroFade(0.2)}>
              workforce
            </motion.span>
            <motion.span className="block" {...heroFade(0.3)}>
              for Norwegian businesses
            </motion.span>
          </h1>
          <motion.p
            className="mt-8 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl"
            {...heroFade(0.45)}
          >
            We help employers in construction, logistics and industry secure reliable workers quickly, with full process
            support.
          </motion.p>
          <motion.div className="mt-10 flex flex-wrap items-center gap-4" {...heroFade(0.6)}>
            <Link
              href="/request"
              className="btn-gold-premium inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-8 py-3.5 text-base font-semibold text-[#0D1B2A] hover:bg-gold-hover"
            >
              Request candidates
            </Link>
          </motion.div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#B8860B]">FOR EMPLOYERS</p>
          <h1
            className="mt-6 min-w-0 break-words font-sans font-extrabold tracking-[-0.04em] text-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 6.25rem)", lineHeight: 1.02 }}
          >
            <span className="block">Qualified EU/EEA</span>
            <span className="block">workforce</span>
            <span className="block">for Norwegian businesses</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/70 md:text-xl">
            We help employers in construction, logistics and industry secure reliable workers quickly, with full process
            support.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/request"
              className="btn-gold-premium inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-8 py-3.5 text-base font-semibold text-[#0D1B2A] hover:bg-gold-hover"
            >
              Request candidates
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
