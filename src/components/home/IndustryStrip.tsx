"use client";

import type { IndustryCount } from "@/lib/jobs-fetch";

/**
 * Four industries, and they add up.
 *
 * WHAT WAS WRONG BEFORE. The strip mixed two kinds of thing - "Construction"
 * next to "Car mechanics", a field next to a job - and the numbers did not add
 * up to the number of open postings, which is the fastest way to teach a reader
 * that the figures on a page are decoration.
 *
 * WHY FOUR AND NOT THE TRADES. Trades grow without limit: welders, lorry
 * drivers, insulators, scaffolders. A strip of trades breaks at the tenth
 * posting. Four industries still fit at two hundred, and the exact trade lives
 * on the card and in the search, where any number of them fit.
 *
 * It is a client component for one reason: pressing a chip is also what tells
 * the leaving panel what the visitor was looking at, so it can say something
 * true instead of something generic.
 */
export function IndustryStrip({ industries, lang }: { industries: IndustryCount[]; lang: "en" | "no" }) {
  function remember(key: string, label: string) {
    try {
      sessionStorage.setItem("am_last_industry", label);
      sessionStorage.setItem("am_last_industry_key", key);
    } catch {
      // A browser refusing session storage loses the leaving panel's context,
      // and the panel then does not appear at all. That is the right failure.
    }
  }

  return (
    <div className="grid border-b border-border bg-navy/[0.03] sm:grid-cols-2 lg:grid-cols-4">
      {industries.map((industry) => (
        <a
          key={industry.key}
          href={`/jobs?industry=${encodeURIComponent(industry.key)}`}
          onClick={() => remember(industry.key, lang === "no" ? industry.no : industry.en)}
          className="border-b border-r border-border px-4 py-5 text-center transition last:border-r-0 hover:bg-gold/5"
        >
          <span className="block text-2xl font-bold leading-none text-gold">{industry.count}</span>
          <span className="mt-1.5 block text-xs leading-snug text-text-secondary">
            {lang === "no" ? industry.no : industry.en}
          </span>
        </a>
      ))}
    </div>
  );
}
