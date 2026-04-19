"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#C9A84C";
const DURATION_MS = 2000;
const STAGGER_MS = 100;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

type NumericStat = {
  id: string;
  target: number;
  suffixAfter: "+" | "%" | "";
  formatLocale?: boolean;
  label: string;
  ariaLabel: string;
};

const NUMERIC_STATS: NumericStat[] = [
  {
    id: "placements",
    target: 500,
    suffixAfter: "+",
    label: "Placements completed",
    ariaLabel: "500 plus placements completed",
  },
  {
    id: "clients",
    target: 50,
    suffixAfter: "+",
    label: "Active Norwegian clients",
    ariaLabel: "50 plus active Norwegian clients",
  },
  {
    id: "countries",
    target: 30,
    suffixAfter: "",
    label: "EU/EEA source countries",
    ariaLabel: "30 EU and EEA source countries",
  },
  {
    id: "satisfaction",
    target: 98,
    suffixAfter: "%",
    label: "Client satisfaction rate",
    ariaLabel: "98 percent client satisfaction rate",
  },
  {
    id: "visits",
    target: 94288,
    suffixAfter: "+",
    formatLocale: true,
    label: "Total visits",
    ariaLabel: "94,288 plus total visits",
  },
];

function StatNumber({
  target,
  suffixAfter,
  formatLocale,
  start,
  reduced,
  staggerIndex,
}: {
  target: number;
  suffixAfter: "+" | "%" | "";
  formatLocale?: boolean;
  start: boolean;
  reduced: boolean;
  staggerIndex: number;
}) {
  const [display, setDisplay] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!start) return;

    if (reduced) {
      setDisplay(target);
      setFinished(true);
      return;
    }

    const delay = staggerIndex * STAGGER_MS;
    let raf = 0;
    const t0 = performance.now() + delay;

    const tick = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / DURATION_MS);
      const eased = easeOutCubic(t);
      setDisplay(Math.round(target * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        setFinished(true);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, reduced, target, staggerIndex]);

  const suffix =
    suffixAfter === "%" ? (finished ? "%" : "") : suffixAfter === "+" ? (finished ? "+" : "") : "";

  const numText = formatLocale ? display.toLocaleString("en-US") : String(display);

  return (
    <span className="font-sans tabular-nums tracking-tight" style={{ color: GOLD }}>
      {numText}
      {suffix}
    </span>
  );
}

export default function UnifiedHomeStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [deliveryVisible, setDeliveryVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const startCounters = inView;

  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setDeliveryVisible(true);
      return;
    }
    const delayMs = NUMERIC_STATS.length * STAGGER_MS;
    const t = window.setTimeout(() => setDeliveryVisible(true), delayMs);
    return () => window.clearTimeout(t);
  }, [inView, reducedMotion]);

  const borderRight = (index: number) => {
    const mdRight = index % 2 === 0;
    const lgRight = index % 3 !== 2;
    return `${mdRight ? "md:border-r md:border-white/[0.08]" : ""} ${lgRight ? "lg:border-r lg:border-white/[0.08]" : ""}`;
  };

  return (
    <section
      ref={sectionRef}
      className={`relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen transition-opacity duration-[400ms] ease-out ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: "#0f1923" }}
      aria-label="ArbeidMatch key results"
    >
      <div className="mx-auto max-w-content px-4 py-20 md:px-6">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3">
          {NUMERIC_STATS.map((stat, index) => (
            <article
              key={stat.id}
              className={`border-t px-4 py-8 text-center md:px-6 ${borderRight(index)}`}
              style={{ borderTopColor: "rgba(201,168,76,0.3)" }}
              aria-label={stat.ariaLabel}
            >
              <div aria-hidden="true">
                <p
                  className="font-extrabold leading-none tracking-tight"
                  style={{
                    color: GOLD,
                    fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)",
                  }}
                >
                  <StatNumber
                    target={stat.target}
                    suffixAfter={stat.suffixAfter}
                    formatLocale={stat.formatLocale}
                    start={startCounters}
                    reduced={reducedMotion}
                    staggerIndex={index}
                  />
                </p>
                <p
                  className="mt-4 text-[14px] font-medium uppercase tracking-[0.08em] text-white"
                  style={{ opacity: 0.7 }}
                >
                  {stat.label}
                </p>
              </div>
            </article>
          ))}

          <article
            className={`border-t px-4 py-8 text-center md:px-6 ${borderRight(5)}`}
            style={{ borderTopColor: "rgba(201,168,76,0.3)" }}
            aria-label="2 weeks average delivery time"
          >
            <div aria-hidden="true">
              <p
                className={`font-extrabold leading-none tracking-tight transition-opacity duration-500 ease-out ${
                  deliveryVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  color: GOLD,
                  fontSize: "clamp(2.75rem, 5.5vw, 4.5rem)",
                }}
              >
                2 weeks
              </p>
              <p
                className="mt-4 text-[14px] font-medium uppercase tracking-[0.08em] text-white"
                style={{ opacity: 0.7 }}
              >
                Average delivery time
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
