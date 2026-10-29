import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { getBoard } from "@/lib/jobs-facets";
import { BetaForside } from "./BetaForside";

/**
 * The new front page, on a hidden route while it is judged.
 *
 * HIS YES, 29 October 2026, after three mock-ups: the brand first, a single
 * photograph, thin serif headlines, lists instead of cards, the open jobs
 * further down. Built here so he can see it live, on a computer and on a
 * phone, before it replaces "/". Not indexed, not linked from anywhere.
 */

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "Bemanning og rekruttering i Norge | ArbeidMatch (beta)" },
  description: "Fagfolk som møter opp. Bemanning og rekruttering til bygg, industri, elektro og logistikk.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function BetaForsidePage() {
  const board = await getBoard();
  return (
    <div className={serif.variable} lang="nb">
      <BetaForside jobs={board.ok ? board.jobs.slice(0, 3) : []} totalOpen={board.ok ? board.totalOpen : 0} />
    </div>
  );
}
