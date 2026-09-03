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
/**
 * Slugged the same way the facet pages are, so a chip and its page cannot drift
 * apart. Kept tiny and local rather than imported: jobs-facets is server-only
 * because it reads the board, and this is a client component.
 */
function industrySlug(englishLabel: string): string {
  return englishLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

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
      {industries.map((industry) => {
        const label = lang === "no" ? industry.no : industry.en;
        const inside = (
          <>
            <span className="block text-2xl font-bold leading-none text-gold">{industry.count}</span>
            <span className="mt-1.5 block text-xs leading-snug text-text-secondary">{label}</span>
          </>
        );
        const cell = "border-b border-r border-border px-4 py-5 text-center last:border-r-0";

        // An industry with nothing in it is not a link. The page for it does
        // not exist, deliberately, because a page that promises car workshops
        // and shows none is worse than a number the reader can already see.
        if (industry.count === 0) {
          return (
            <div key={industry.key} className={`${cell} opacity-60`}>
              {inside}
            </div>
          );
        }
        return (
          <a
            key={industry.key}
            href={`/jobs/${industrySlug(industry.en)}`}
            onClick={() => remember(industry.key, label)}
            className={`${cell} transition hover:bg-gold/5`}
          >
            {inside}
          </a>
        );
      })}
    </div>
  );
}
