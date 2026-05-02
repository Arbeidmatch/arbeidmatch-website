"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

export type LiveStatsPayload = {
  candidates: number;
  industries: number;
  roles: number;
};

const DURATION_MS = 1200;

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function StatCard({ label, target }: { label: string; target: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useLayoutEffect(() => {
    if (reduce && target > 0) setDisplay(target);
  }, [reduce, target]);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    if (reduce) return;

    setDisplay(0);
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      setDisplay(Math.round(easeOutQuad(t) * target));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reduce]);

  const showGrowing = target === 0;

  return (
    <div className="rounded-[12px] bg-white p-6 shadow-sm" style={{ padding: "24px", borderRadius: "12px" }}>
      <div
        className={`leading-none text-[#C9A84C] ${showGrowing ? "text-[clamp(1.05rem,3.5vw,1.35rem)] font-bold leading-snug" : "text-[48px] font-bold"}`}
        style={{ fontWeight: 700, color: "#C9A84C" }}
      >
        {showGrowing ? "Network growing" : display}
      </div>
      <p
        className="mt-3 font-medium uppercase text-[#0D1B2A]"
        style={{ fontSize: "14px", letterSpacing: "0.05em", color: "#0D1B2A" }}
      >
        {label}
      </p>
    </div>
  );
}

export default function LiveStatsSection({ candidates, industries, roles }: LiveStatsPayload) {
  return (
    <section
      className="border-b border-[rgba(255,255,255,0.06)] py-12 md:py-16"
      style={{
        background: "linear-gradient(180deg, #0a1522 0%, #0D1B2A 55%, #0D1B2A 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
        <h2 className="mb-6 text-center font-display text-xl font-semibold tracking-tight text-white md:mb-8 md:text-2xl">
          Live numbers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "24px" }}>
          <StatCard label="Candidates available" target={candidates} />
          <StatCard label="Industries covered" target={industries} />
          <StatCard label="Roles in database" target={roles} />
        </div>
      </div>
    </section>
  );
}
