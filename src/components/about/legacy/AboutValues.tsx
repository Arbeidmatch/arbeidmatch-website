"use client";

import { useState } from "react";

const CARDS = [
  {
    title: "Kvalitet",
    body: "Hver kandidat er pre-screenet og dokumentert. Vi presenterer kun de som møter kundens krav - faglig og personlig.",
    icon: (
      <svg width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="#C9A84C" strokeWidth={2} />
        <path d="M8 12l2.5 2.5L16 9" stroke="#C9A84C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Full lovlighet",
    body: "Vi opererer 100% innenfor norsk arbeidslovgivning, allmenngjøringsforskrifter og HMS-krav. Alltid.",
    icon: (
      <svg width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V7l7-4z"
          stroke="#C9A84C"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Mennesker først",
    body: "Gode plasseringer starter med gjensidig respekt. Vi ivaretar interessene til både arbeidsgiver og arbeidstaker.",
    icon: (
      <svg width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1M12 15h4a4 4 0 0 1 4 4v1"
          stroke="#C9A84C"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
] as const;

// Kept for future About page redesign.

export default function AboutValues() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section className="bg-white px-6 py-[100px]">
      <div className="mx-auto max-w-[1100px]">
        <p
          className="text-[#C9A84C]"
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}
        >
          Våre verdier
        </p>
        <h2 className="text-[40px] font-bold text-[#0f1923]" style={{ marginBottom: "64px" }}>
          Det vi tror på, gjenspeiles i alt vi gjør
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {CARDS.map((card, index) => (
            <article
              key={card.title}
              className="rounded-2xl border bg-white px-8 py-10 transition-[border-color] duration-200 ease-out"
              style={{
                padding: "40px 32px",
                borderRadius: "16px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: hovered === index ? "#C9A84C" : "rgba(0,0,0,0.08)",
              }}
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="mb-6">{card.icon}</div>
              <h3 className="mb-3 text-[20px] font-bold text-[#0f1923]" style={{ marginBottom: "12px" }}>
                {card.title}
              </h3>
              <p className="text-[15px] leading-[1.7] text-[#6b7280]">{card.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
