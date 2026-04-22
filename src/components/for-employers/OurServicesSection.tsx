"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FileText, MapPin, RefreshCw, Search, UserCheck, Users, type LucideIcon } from "lucide-react";

const GOLD = "#C9A84C";
const NAVY = "#ffffff";

type ServiceItem = {
  Icon: LucideIcon;
  title: string;
  body: string;
};

const SERVICES: ServiceItem[] = [
  {
    Icon: Search,
    title: "Sourcing",
    body: "Targeted outreach across EU and EEA countries to identify candidates that match your exact requirements. We use direct networks, not just job boards.",
  },
  {
    Icon: UserCheck,
    title: "Pre-screening",
    body: "Structured interviews, document checks, and trade relevance validation before any candidate is presented to you. We aim to present profiles that meet agreed criteria. Final hiring decisions remain with the employer.",
  },
  {
    Icon: FileText,
    title: "Staffing and Compliance",
    body: "We act as the employer of record. We handle employment contracts, payroll, and compliance with Norwegian labor law and collective agreements on your behalf.",
  },
  {
    Icon: Users,
    title: "Candidate Presentation",
    body: "You receive a structured presentation of shortlisted candidates with relevant experience, certifications, and references. You make the final selection.",
  },
  {
    Icon: MapPin,
    title: "Onboarding Support",
    body: "We coordinate pre-arrival logistics, documentation, and practical onboarding. The candidate arrives prepared and ready to start on day one.",
  },
  {
    Icon: RefreshCw,
    title: "Follow-up",
    body: "Weekly follow-up with both client and candidate after placement. We follow up to identify and resolve issues early.",
  },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export default function OurServicesSection() {
  const reducedMotion = usePrefersReducedMotion();
  const [shownCount, setShownCount] = useState(reducedMotion ? 6 : 0);
  const triggerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reducedMotion) {
      setShownCount(6);
      return;
    }
    const el = triggerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting || started.current) return;
        started.current = true;
        for (let i = 1; i <= 6; i++) {
          window.setTimeout(() => setShownCount(i), (i - 1) * 80);
        }
        io.disconnect();
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return (
    <div ref={triggerRef} className="mx-auto w-full max-w-[1100px] px-6">
      <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: GOLD }}>
        What we do
      </p>
      <h2 className="mb-2 text-center text-[36px] font-bold leading-tight" style={{ color: NAVY }}>
        Our services
      </h2>
      <p
        className="mx-auto mb-14 max-w-[720px] text-center text-base leading-snug md:mb-[56px]"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        Everything you need to find, hire, and onboard qualified EU/EEA workers.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-6">
        {SERVICES.map((item, i) => {
          const shown = reducedMotion || shownCount > i;
          const Icon = item.Icon;
          return (
            <article
              key={item.title}
              className="group flex h-full min-h-0 flex-col rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-7 py-8 transition-[border-color] duration-[220ms] ease-out hover:border-[rgba(201,168,76,0.3)]"
            >
              <div
                className="flex min-h-0 flex-1 flex-col"
                style={{
                  opacity: shown ? 1 : 0,
                  transform: shown ? "translateY(0)" : "translateY(20px)",
                  transition: reducedMotion ? "none" : "opacity 500ms ease-out, transform 500ms ease-out",
                }}
              >
                <div
                  className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.08)] transition-all duration-200 ease-out group-hover:bg-[rgba(201,168,76,0.15)]"
                >
                  <Icon size={22} color={GOLD} strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mb-2 shrink-0 text-base font-bold" style={{ color: NAVY }}>
                  {item.title}
                </h3>
                <p className="min-h-0 flex-1 text-sm leading-[1.7] text-white/70">{item.body}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-12 text-center md:mt-[48px]">
        <Link
          href="/request"
          className="inline-flex items-center justify-center rounded-[10px] bg-[#C9A84C] px-10 py-4 text-[15px] font-bold text-[#0f1923] transition-[transform,background-color] duration-[180ms] ease-out hover:scale-[1.02] hover:bg-[#b8953f]"
        >
          Request candidates
        </Link>
      </div>
    </div>
  );
}
