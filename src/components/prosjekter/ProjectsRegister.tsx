"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { CARD, EYEBROW, FIELD, MUTED, PRIMARY, SECONDARY, STAGE_COLOR } from "@/components/prosjekter/ui";
import { filtersQuery, isOverview, type Overview, type OverviewFilters, type OverviewProject } from "@/lib/prosjekter/types";

/**
 * The public project register: three counts that filter by stage, a search,
 * county and domain, and the projects as register rows, 20 a page.
 *
 * No description and no way into a tender here: those are for clients. Each row
 * says so in one quiet line, and the page has one call to action, to the
 * contact page, for a firm that wants access.
 */

const STAGES = [
  ["planned", "Planlagt"],
  ["tender", "Åpne konkurranser"],
  ["awarded", "Tildelt"],
] as const;

const nf = new Intl.NumberFormat("nb-NO");

function StageMarker({ p }: { p: OverviewProject }) {
  const color = STAGE_COLOR[p.stage] ?? STAGE_COLOR.closed;
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-medium" style={{ color }}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
      {p.stage_label}
    </span>
  );
}

function ProjectRow({ p }: { p: OverviewProject }) {
  const owner = [p.buyer_name, p.place].filter(Boolean).join(" · ");
  return (
    <li className="grid grid-cols-1 gap-3 border-b border-white/10 py-5 last:border-b-0 sm:grid-cols-[64px_minmax(0,1fr)_200px] sm:gap-5">
      <span className="font-mono text-[13px] tabular-nums text-white/45">
        {p.project_no !== null ? `#${p.project_no}` : ""}
      </span>
      <div className="min-w-0">
        <h3 className="text-[16px] font-semibold leading-snug text-white">{p.title}</h3>
        {owner ? <p className={`mt-1 text-[14px] leading-snug ${MUTED}`}>{owner}</p> : null}
        {p.winners.length ? (
          <p className="mt-1 text-[14px] leading-snug text-white/85">
            <span className="text-white/55">Entreprenør: </span>
            {p.winners.join(", ")}
          </p>
        ) : null}
        {p.domains.length ? (
          <p className="mt-2 flex flex-wrap gap-1.5">
            {p.domains.slice(0, 3).map((d) => (
              <span key={d} className="rounded-full border border-white/10 px-2.5 py-0.5 text-[12px] text-white/60">
                {d}
              </span>
            ))}
          </p>
        ) : null}
        <p className="mt-2 text-[12px] text-white/40">
          {p.stage === "tender" ? "Detaljer og tilbudsfrist for kunder" : "Detaljer for kunder"}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 sm:flex-col sm:items-end sm:justify-start sm:text-right">
        <StageMarker p={p} />
        {p.value_label ? (
          <span className="text-[15px] font-semibold tabular-nums text-white">{p.value_label}</span>
        ) : null}
        {p.date_label ? <span className="text-[13px] text-white/60">{p.date_label}</span> : null}
      </div>
    </li>
  );
}

export default function ProjectsRegister({
  initial,
  initialFilters,
}: {
  initial: Overview | null;
  initialFilters: OverviewFilters;
}) {
  const [data, setData] = useState<Overview | null>(initial);
  const [filters, setFilters] = useState<OverviewFilters>(initialFilters);
  const [search, setSearch] = useState(initialFilters.q);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initial === null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  const load = useCallback(async (next: OverviewFilters, scroll: boolean) => {
    const id = ++requestId.current;
    setFilters(next);
    setLoading(true);
    const query = filtersQuery(next);
    try {
      window.history.replaceState(null, "", `/prosjekter${query}`);
    } catch {
      /* the address bar is a convenience */
    }
    try {
      const res = await fetch(`/api/prosjekter/overview${query}`, { cache: "no-store" });
      const json: unknown = await res.json().catch(() => null);
      if (id !== requestId.current) return;
      if (res.ok && isOverview(json)) {
        setData(json);
        setFailed(false);
      } else {
        setFailed(true);
      }
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    if (scroll) listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // A search waits for the visitor to stop typing.
  useEffect(() => {
    const q = search.trim().slice(0, 80);
    if (q === filters.q) return;
    const t = window.setTimeout(() => void load({ ...filters, q, page: 1 }, false), 400);
    return () => window.clearTimeout(t);
  }, [search, filters, load]);

  const set = (patch: Partial<OverviewFilters>) => void load({ ...filters, ...patch, page: 1 }, false);
  const pages = data ? Math.max(1, Math.ceil(data.total / Math.max(1, data.page_size))) : 1;
  const page = data?.page ?? filters.page;
  const filtered = Boolean(filters.stage || filters.region || filters.domain || filters.q);

  return (
    <div className="bg-[#0D1B2A] text-white">
      <section className="border-b border-white/10 pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="container-site">
          <p className={EYEBROW}>Bygg og anlegg · hele Norge</p>
          <h1 className="am-h1 mt-4 max-w-3xl font-display font-semibold text-white">Neste jobb i hele Norge</h1>
          <p className={`mt-5 max-w-2xl text-[17px] leading-relaxed ${MUTED}`}>
            Bygg- og anleggsprosjekter fra hele landet, samlet på ett sted: hva som planlegges, hvilke konkurranser
            som er åpne nå, og hvem som har fått kontraktene. Oppdatert hver dag.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4" role="group" aria-label="Filtrer etter status">
            {STAGES.map(([key, label]) => {
              const on = filters.stage === key;
              const color = STAGE_COLOR[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ stage: on ? "" : key })}
                  className={`${CARD} flex min-h-[88px] flex-col items-start justify-between gap-2 p-3 text-left transition-colors hover:border-white/25 sm:p-5 ${
                    on ? "border-transparent ring-2" : ""
                  }`}
                  style={on ? ({ "--tw-ring-color": color } as React.CSSProperties) : undefined}
                >
                  <span className="text-[26px] font-semibold leading-none tabular-nums sm:text-4xl" style={{ color }}>
                    {data ? nf.format(data.counts[key]) : "-"}
                  </span>
                  <span className="text-[12px] leading-tight text-white/70 sm:text-sm">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10" aria-label="Prosjekter">
        <div className="container-site" ref={listRef}>
          <form
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_260px]"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              void load({ ...filters, q: search.trim().slice(0, 80), page: 1 }, false);
            }}
          >
            <label className="sr-only" htmlFor="prosjekter-q">
              Søk
            </label>
            <input
              id="prosjekter-q"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Søk i tittel, byggherre eller sted"
              maxLength={80}
              className={FIELD}
            />
            <label className="sr-only" htmlFor="prosjekter-region">
              Fylke
            </label>
            <select
              id="prosjekter-region"
              value={filters.region}
              onChange={(e) => set({ region: e.target.value })}
              className={FIELD}
            >
              <option value="">Hele Norge</option>
              {(data?.regions ?? []).map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="prosjekter-domain">
              Fagområde
            </label>
            <select
              id="prosjekter-domain"
              value={filters.domain}
              onChange={(e) => set({ domain: e.target.value })}
              className={FIELD}
            >
              <option value="">Alle fagområder</option>
              {(data?.domains ?? []).map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </form>

          <div className="mt-6 flex min-h-[28px] flex-wrap items-center justify-between gap-3 text-sm">
            <p className={MUTED} aria-live="polite">
              {loading
                ? "Henter prosjekter ..."
                : data
                  ? `${nf.format(data.total)} ${data.total === 1 ? "prosjekt" : "prosjekter"}`
                  : ""}
            </p>
            {filtered ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  void load({ stage: "", region: "", domain: "", q: "", page: 1 }, false);
                }}
                className="min-h-[44px] text-sm font-medium text-gold underline-offset-4 hover:underline"
              >
                Nullstill filtre
              </button>
            ) : null}
          </div>

          <div className={`${CARD} mt-3 px-4 sm:px-6 ${loading ? "opacity-60" : ""} transition-opacity`}>
            {failed && !data ? (
              <p className={`py-8 text-[15px] ${MUTED}`}>
                Prosjektoversikten er ikke tilgjengelig akkurat nå. Prøv igjen om litt.
              </p>
            ) : data && data.projects.length === 0 ? (
              <p className={`py-8 text-[15px] ${MUTED}`}>Ingen prosjekter passer disse valgene.</p>
            ) : (
              <ul>{(data?.projects ?? []).map((p, i) => <ProjectRow key={`${p.project_no ?? "x"}-${i}`} p={p} />)}</ul>
            )}
          </div>
          {failed && data ? (
            <p className="mt-3 text-sm text-white/60" role="status">
              Kunne ikke oppdatere listen. Prøv igjen om litt.
            </p>
          ) : null}

          {data && pages > 1 ? (
            <nav className="mt-6 flex items-center justify-between gap-3" aria-label="Sider">
              <button
                type="button"
                className={SECONDARY}
                disabled={loading || page <= 1}
                onClick={() => void load({ ...filters, page: page - 1 }, true)}
              >
                Forrige
              </button>
              <span className={`text-sm tabular-nums ${MUTED}`}>
                Side {page} av {nf.format(pages)}
              </span>
              <button
                type="button"
                className={SECONDARY}
                disabled={loading || page >= pages}
                onClick={() => void load({ ...filters, page: page + 1 }, true)}
              >
                Neste
              </button>
            </nav>
          ) : null}
        </div>
      </section>

      <section className="pb-16 pt-4 md:pb-24">
        <div className="container-site">
          <div className="flex flex-col gap-5 rounded-xl border border-gold/35 bg-gold/[0.06] p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-[22px] font-semibold leading-tight text-white sm:text-[26px]">
                Vil dere se hele prosjektet?
              </h2>
              <p className={`mt-3 text-[15px] leading-relaxed ${MUTED}`}>
                Kundene våre får beskrivelsen, fristene, kravene og veien inn i konkurransen, og varsler om nye
                prosjekter i de fylkene og fagene de velger. Ta kontakt, så forteller vi hvordan.
              </p>
            </div>
            <Link href="/contact" className={`${PRIMARY} shrink-0`}>
              Kontakt oss
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
