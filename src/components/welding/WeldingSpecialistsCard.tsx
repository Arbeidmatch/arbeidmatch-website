"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import WeldingCertGrid from "./WeldingCertGrid";

const GOLD = "#C9A84C";

export default function WeldingSpecialistsCard() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setVisible(true);
      return;
    }
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true);
      },
      { root: null, rootMargin: "0px", threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [reduceMotion]);

  const motionStyle = reduceMotion
    ? { opacity: 1, transform: "translateY(0)" }
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 500ms ease-out, transform 500ms ease-out",
      };

  return (
    <section
      ref={rootRef}
      className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-12 lg:px-0 lg:py-12"
      style={motionStyle}
    >
      <div
        className="rounded-[20px] border p-7 lg:p-12"
        style={{
          background: "linear-gradient(180deg, #0f1923 0%, #141e2e 100%)",
          borderColor: "rgba(201,168,76,0.25)",
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
            <h2 className="mt-4 font-extrabold leading-[1.2] text-white [font-size:clamp(24px,3.5vw,40px)]">
              ISO-Certified Welders and Specialist Technicians
            </h2>
            <p className="mt-3 max-w-[560px] text-base leading-[1.7] text-white/[0.6]">
              We source pre-screened welders and technical specialists holding valid ISO certifications, EN standards,
              and sector-specific authorizations. Ready to work on demanding Norwegian and international projects.
            </p>
            <Link
              href="/request"
              className="group mt-6 inline-flex w-full min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#C9A84C] px-8 py-4 text-[15px] font-bold text-[#0f1923] transition-[background,transform] duration-200 hover:scale-[1.02] hover:bg-[#b8953f] md:hidden"
            >
              Request Welding Specialists
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          </div>
          <div className="hidden shrink-0 self-center md:block">
            <Link
              href="/request"
              className="group inline-flex min-h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#C9A84C] px-8 py-4 text-[15px] font-bold text-[#0f1923] transition-[background,transform] duration-200 hover:scale-[1.02] hover:bg-[#b8953f]"
            >
              Request Welding Specialists
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          </div>
        </div>

        <div className="my-9 h-px bg-white/[0.06]" />

        <WeldingCertGrid variant="dark" />

        <div className="mt-9 flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
            {["Certificate validation included", "EU/EEA legal compliance", "2-week average delivery"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} aria-hidden />
                <span className="text-[13px] text-white/[0.55]">{t}</span>
              </div>
            ))}
          </div>
          <Link
            href="/contact"
            className="text-[14px] font-medium text-gold underline-offset-4 hover:underline lg:mt-0"
          >
            Not sure what certification your project requires? Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
