import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { atsBase } from "@/lib/prosjekter/ats";

/**
 * The way into the project portal from the rest of the site (29 September
 * 2026). The owner's question was where a client who comes to arbeidmatch.no
 * for the first time finds the projects; the answer is here, on the front page
 * and on For bedrifter, besides the menu and the footer.
 *
 * The three counts are read from the ATS at most every ten minutes and shared
 * by every visitor; when they cannot be read the block still shows, without
 * numbers.
 */

type Counts = { planned: number; tender: number; awarded: number };

async function readCounts(): Promise<Counts | null> {
  try {
    const res = await fetch(`${atsBase()}/api/public/projects-overview`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { counts?: Partial<Counts> };
    const c = body.counts;
    if (!c || typeof c.tender !== "number" || typeof c.awarded !== "number" || typeof c.planned !== "number") return null;
    return { planned: c.planned, tender: c.tender, awarded: c.awarded };
  } catch {
    return null;
  }
}

const nb = new Intl.NumberFormat("nb-NO");

export async function ProjectsTeaser({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const counts = await readCounts();
  const light = tone === "light";
  const figures: [string, number | null, string][] = [
    ["Åpne konkurranser", counts?.tender ?? null, "#C9A84C"],
    ["Tildelte kontrakter", counts?.awarded ?? null, "#3fa87b"],
    ["Planlagte prosjekter", counts?.planned ?? null, "#5d8fe8"],
  ];
  return (
    <section className={light ? "mx-auto max-w-[1200px] px-6 py-14 md:py-20" : "bg-[#0D1B2A] py-12 md:py-16"} aria-label="Prosjekter i Norge">
      <div
        className={`${light ? "" : "mx-auto w-full max-w-content px-6 md:px-12 lg:px-20"}`}
      >
        <div
          className={`grid gap-8 rounded-2xl border p-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:p-10 ${
            light ? "border-[#0D1B2A]/10 bg-[#0D1B2A] text-white" : "border-white/10 bg-white/[0.03] text-white"
          }`}
        >
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">For bedrifter · bygg og anlegg</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Se hvor Norge bygger</h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
              Planlagte prosjekter, åpne konkurranser og tildelte kontrakter i hele landet, på ett kart. Kartet er åpent for alle; kundene våre
              får byggherre, entreprenør, frister og varsler om nye prosjekter i sitt område.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/prosjekter"
                className="inline-flex min-h-[48px] items-center gap-2 rounded-md bg-[#C9A84C] px-6 font-semibold text-[#0D1B2A] hover:bg-[#b8953f]"
              >
                Se prosjektkartet <ArrowUpRight size={18} aria-hidden />
              </Link>
              <Link
                href="/prosjekter#tilgang"
                className="inline-flex min-h-[48px] items-center rounded-md border border-white/20 px-5 font-semibold text-white/85 hover:border-white/40"
              >
                Få tilgang
              </Link>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            {figures.map(([label, value, color]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <dd className="text-2xl font-semibold tabular-nums md:text-3xl" style={{ color }}>
                  {value === null ? "·" : nb.format(value)}
                </dd>
                <dt className="mt-1 text-[12px] leading-snug text-white/60">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
