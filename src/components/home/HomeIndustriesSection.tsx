"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Anchor, Bolt, Car, Factory, HardHat, HeartPulse, Sparkles, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import ScrollReveal from "@/components/ScrollReveal";

type IndustryCard = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const CARDS: IndustryCard[] = [
  {
    title: "Construction & Civil",
    description: "Sites, infrastructure and building trades across Norway.",
    Icon: HardHat,
  },
  {
    title: "Electrical & Technical",
    description: "Electricians, HVAC, automation and technical specialists.",
    Icon: Bolt,
  },
  {
    title: "Logistics & Transport",
    description: "Drivers, warehouse teams and supply chain roles.",
    Icon: Truck,
  },
  {
    title: "Industry & Production",
    description: "Factories, CNC, assembly and quality-focused teams.",
    Icon: Factory,
  },
  {
    title: "Offshore & Onshore",
    description: "Marine, energy and rotating crews for demanding projects.",
    Icon: Anchor,
  },
  {
    title: "Automotive & Mechanics",
    description: "Workshops, fleet maintenance and vehicle technicians.",
    Icon: Car,
  },
  {
    title: "Cleaning & Facility",
    description: "Commercial cleaning and facility support staff.",
    Icon: Sparkles,
  },
  {
    title: "Hospitality & Healthcare",
    description: "Kitchen, hotel, care and patient-facing support roles.",
    Icon: HeartPulse,
  },
];

export default function HomeIndustriesSection() {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        CARDS.map(async ({ title }) => {
          try {
            const res = await fetch(`/api/candidate-count?industry=${encodeURIComponent(title)}`, {
              cache: "no-store",
            });
            const data = (await res.json()) as { count?: number };
            if (!cancelled) next[title] = typeof data.count === "number" ? data.count : 0;
          } catch {
            if (!cancelled) next[title] = 0;
          }
        }),
      );
      if (!cancelled) setCounts(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-b border-[rgba(255,255,255,0.08)] bg-[#0D1B2A] py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-content px-4 md:px-12 lg:px-20">
        <ScrollReveal variant="fadeUp" className="text-center">
          <h2 className="am-h2 font-display font-extrabold tracking-[-0.03em] text-white">Industries we serve</h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 lg:mt-14 lg:grid-cols-3 lg:gap-8">
          {CARDS.map(({ title, description, Icon }) => {
            const n = counts[title];
            const showCount = typeof n === "number" && n > 0;
            return (
              <ScrollReveal key={title} variant="fadeUp">
                <Link
                  href={`/request?industry=${encodeURIComponent(title)}`}
                  className="flex h-full cursor-pointer flex-col rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-6 transition-[border-color,background-color] duration-200 hover:border-[rgba(201,168,76,0.55)] hover:bg-[rgba(201,168,76,0.06)] md:p-7"
                >
                  <Icon className="h-7 w-7 shrink-0 text-[#C9A84C]" strokeWidth={1.65} aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[rgba(255,255,255,0.55)]">{description}</p>
                  {showCount ? (
                    <p className="mt-4 text-xs font-medium text-[#C9A84C]">{n.toLocaleString("nb-NO")} profiles</p>
                  ) : null}
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
