"use client";

import { startTransition, useEffect, useLayoutEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  durationMs?: number;
  suffix?: string;
  prefix?: string;
};

/**
 * Counts from 0 to `value` when the element enters the viewport (once).
 * Respects `prefers-reduced-motion`.
 */
export default function AnimatedNumber({
  value,
  className = "",
  durationMs = 1800,
  suffix = "",
  prefix = "",
}: AnimatedNumberProps) {
  const safeTarget = Math.max(0, Math.floor(value));
  const [display, setDisplay] = useState(0);
  const [run, setRun] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) return;
    startTransition(() => {
      setReducedMotion(true);
      setDisplay(safeTarget);
      setRun(true);
    });
  }, [safeTarget]);

  useEffect(() => {
    if (reducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setRun(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!run || reducedMotion) return;

    const start = performance.now();
    const to = safeTarget;

    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = easeOutCubic(t);
      setDisplay(Math.round(to * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(to);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reducedMotion, safeTarget, durationMs]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">
        {prefix}
        {safeTarget.toLocaleString()}
        {suffix}
      </span>
      <span aria-hidden>
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </span>
    </span>
  );
}
