"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAVY = "#0f1923";
const GOLD = "#C9A84C";

export default function BemanningCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReducedMotion(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  const motion = reducedMotion
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 400ms ease-out, transform 400ms ease-out",
      };

  const points = [
    "Pre-screened candidates from EU and EEA countries",
    "You choose the candidates, we handle the sourcing",
    "No competition with your clients",
  ];

  return (
    <section className="bg-white px-6 pb-10 pt-0 md:px-12 md:pb-12 lg:px-20">
      <div ref={ref} className="mx-auto w-full max-w-[1100px]" style={motion}>
        <div
          className="rounded-[20px] border px-7 py-7 md:px-12 md:py-12"
          style={{ background: NAVY, borderColor: "rgba(201,168,76,0.3)", borderWidth: 1, borderStyle: "solid" }}
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
                className="inline-flex items-center justify-center whitespace-nowrap rounded-[10px] bg-[#C9A84C] px-8 py-4 text-center text-[15px] font-bold text-[#0f1923] transition-[transform,background-color] duration-200 hover:scale-[1.02] hover:bg-[#b8953f]"
              >
                Send us a candidate request
              </Link>
              <Link
                href="/for-staffing-agencies"
                className="mt-3 block text-center text-[13px] text-[#C9A84C] underline-offset-4 hover:underline"
              >
                Learn more about partnership
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
