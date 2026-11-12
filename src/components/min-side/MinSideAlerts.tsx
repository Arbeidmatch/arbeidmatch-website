"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, ChevronUp, Search } from "lucide-react";

import ProjectDetail from "@/components/prosjekter/ProjectDetail";
import { PROJECT_SOURCE_LINE, projectStage, type Alerts, type MinSideProject, type MinSideStage } from "@/lib/min-side/profile";
import {
  dateCell,
  isNew,
  listRows,
  neighbours,
  pageOf,
  pageForId,
  withList,
  type ListState,
  type SettingsLevel,
  type VarslerRoute,
} from "@/lib/min-side/project-list";
import { valueNo } from "@/lib/prosjekter/format";
import { BODY, CARD, GREY, LARGE_TITLE, NAVY, NY_TAG, PILL, ROW_TWO, SEARCH, SEGMENTS, SMALL, STAGE_DOT, STAGE_WORD, chipIos, segment } from "./ios";
import MinSideAlertSettings, { type SaveSettings } from "./MinSideAlertSettings";

/**
 * ORDER 273: Prosjektvarsler, the section Min side opens on. His words of 12
 * November 2026: "optiunea de proiecte trebuie sa fie cea mai vizibila si cu
 * accent mai mult pe detalii decat pe harta", and "trebuie sa vada ca mine
 * tabelul ala cu ce client a castigat proiectul". So: the owner's Forsprang
 * table with six columns (Prosjekt, Fase, Verdi, Dato, Entreprenør and the
 * chevron), the stages as a segmented control, the towns as chips, one search
 * field, 20 rows a page. A row opens the project across the whole section;
 * "Alle prosjekter" comes back to the same page, filters and scroll, with the
 * last opened row marked. The map is one pill away, never the first thing.
 */

const STAGES: { key: MinSideStage | "all"; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "planned", label: "Planlagt" },
  { key: "tender", label: "Åpen" },
  { key: "closed", label: "Venter" },
  { key: "awarded", label: "Tildelt" },
];

type Props = {
  token: string;
  alerts: Alerts;
  route: VarslerRoute;
  go: (route: VarslerRoute) => void;
  list: ListState;
  setList: (next: ListState) => void;
  lastOpened: string | null;
  scrollBack: number | null;
  onScrolledBack: () => void;
  onPlan: (p: MinSideProject) => void;
  saveSettings: SaveSettings;
  stopAlerts: () => Promise<{ ok: true } | { ok: false; message: string; field: string | null }>;
  onStopped: () => void;
  /** The subscription's words and its offer link, under the list. */
  footer?: React.ReactNode;
};

function SortHead({ label, active, dir, onClick, align = "left" }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void; align?: "left" | "right" }) {
  const Icon = dir === "desc" ? ChevronDown : ChevronUp;
  return (
    <th scope="col" aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"} className={`px-3 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.04em] ${GREY} ${align === "right" ? "text-right" : "text-left"}`}>
      <button type="button" onClick={onClick} className={`inline-flex min-h-[2rem] items-center gap-1 uppercase ${active ? NAVY : ""}`}>
        {label}
        <Icon className={`h-4 w-4 ${active ? "" : "opacity-30"}`} aria-hidden />
      </button>
    </th>
  );
}

export default function MinSideAlerts({ token, alerts, route, go, list, setList, lastOpened, scrollBack, onScrolledBack, onPlan, saveSettings, stopAlerts, onStopped, footer }: Props) {
  const [now] = useState(() => Date.now());
  const projects = alerts.projects;
  const rows = useMemo(() => listRows(projects, list, now), [projects, list, now]);
  const shown = pageOf(rows, list.page);
  const towns = useMemo(() => [...new Set(projects.map((p) => p.place).filter((x): x is string => Boolean(x)))].sort((a, b) => a.localeCompare(b, "nb")).slice(0, 12), [projects]);
  const stageChoices = STAGES.filter((s) => s.key === "all" || projects.some((p) => projectStage(p, now) === s.key));
  const newCount = projects.filter((p) => isNew(p, alerts.last_sent_at ?? null)).length;
  const set = (part: Partial<ListState>) => setList(withList(list, part));
  const sortBy = (key: "date" | "value") => set({ sort: list.sort.key === key ? { key, dir: list.sort.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" } });
  const listRef = useRef<HTMLDivElement>(null);

  // Back from a project: the page it was on, the scroll where it was.
  useEffect(() => {
    if (route.view !== "list" || scrollBack === null) return;
    window.scrollTo({ top: scrollBack });
    onScrolledBack();
  }, [route.view, scrollBack, onScrolledBack]);

  if (route.view === "project") {
    const n = neighbours(rows, route.id);
    const item = projects.find((p) => p.id === route.id) ?? null;
    const open = (id: string | null) => {
      if (!id) return;
      const page = pageForId(rows, id);
      if (page && page !== list.page) set({ page });
      go({ view: "project", id });
    };
    return (
      <ProjectDetail
        key={route.id}
        url={`/api/min-side/${encodeURIComponent(token)}/project/${encodeURIComponent(route.id)}`}
        preview={item ? { title: item.title, stage: projectStage(item, now), buyer_name: item.buyer_name, place: item.place } : null}
        index={n.index}
        total={n.total}
        isNew={item ? isNew(item, alerts.last_sent_at ?? null) : false}
        onBack={() => go({ view: "list" })}
        onPrev={n.prev ? () => open(n.prev) : null}
        onNext={n.next ? () => open(n.next) : null}
        ask={{ label: "Planlegg bemanning", onClick: () => item && onPlan(item) }}
      />
    );
  }

  if (route.view === "settings" && alerts.settings) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <button type="button" onClick={() => go({ view: "list" })} className={`inline-flex min-h-[3.25rem] items-center gap-1 self-start font-semibold md:min-h-[2.5rem] ${BODY} ${NAVY} hover:underline`}>
          <ChevronRight className="h-5 w-5 rotate-180" aria-hidden />
          Prosjektvarsler
        </button>
        <h2 className={`${LARGE_TITLE} ${NAVY}`}>Innstillinger</h2>
        <MinSideAlertSettings
          settings={alerts.settings}
          level={route.level}
          onLevel={(level: SettingsLevel | null) => go({ view: "settings", level })}
          save={saveSettings}
          stop={stopAlerts}
          onStopped={onStopped}
        />
      </div>
    );
  }

  const summary = [rows.length === 1 ? "1 prosjekt" : `${rows.length} prosjekter`, newCount ? `${newCount} nye siden siste brev` : null].filter(Boolean).join(" · ");

  return (
    <div className="flex min-w-0 flex-col gap-4" ref={listRef} data-project-list="">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`${LARGE_TITLE} ${NAVY}`}>Prosjektvarsler</h2>
          <p className={`${BODY} ${GREY}`} aria-live="polite">
            {summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {alerts.settings ? (
            <button type="button" className={PILL} onClick={() => go({ view: "settings", level: null })}>
              Innstillinger
            </button>
          ) : null}
          {alerts.projects_url ? (
            <a href={alerts.projects_url} className={PILL}>
              Kart
            </a>
          ) : null}
        </div>
      </div>

      {stageChoices.length > 2 ? (
        <div className={SEGMENTS} role="radiogroup" aria-label="Fase">
          {stageChoices.map((s) => (
            <button key={s.key} type="button" role="radio" aria-checked={list.stage === s.key} className={segment(list.stage === s.key)} onClick={() => set({ stage: s.key })}>
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
      {towns.length > 1 ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="By">
          {towns.map((t) => (
            <button key={t} type="button" aria-pressed={list.town === t} className={chipIos(list.town === t)} onClick={() => set({ town: list.town === t ? null : t })}>
              {t}
            </button>
          ))}
        </div>
      ) : null}
      <label className="relative block">
        <span className="sr-only">Søk i prosjektene</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6D6D72]" aria-hidden />
        <input type="search" className={`${SEARCH} pl-10`} placeholder="Søk i prosjekt, byggherre eller entreprenør" maxLength={100} value={list.q} onChange={(e) => set({ q: e.target.value })} />
      </label>

      {shown.rows.length === 0 ? (
        <p className={`${CARD} p-5 ${BODY} ${GREY}`}>{projects.length ? "Ingen prosjekter passer søket." : "Ingen prosjekter passer valgene deres akkurat nå."}</p>
      ) : (
        <>
          {/* Computer: the six columns. */}
          <div className={`${CARD} hidden overflow-hidden md:block`}>
            <table className="w-full table-auto border-collapse" data-projects-table="">
              <thead className="border-b border-[#E5E5EA]">
                <tr>
                  <th scope="col" className={`w-full px-3 py-2 text-left text-[0.8125rem] font-semibold uppercase tracking-[0.04em] ${GREY}`}>
                    Prosjekt
                  </th>
                  <th scope="col" className={`px-3 py-2 text-left text-[0.8125rem] font-semibold uppercase tracking-[0.04em] ${GREY}`}>
                    Fase
                  </th>
                  <SortHead label="Verdi" align="right" active={list.sort.key === "value"} dir={list.sort.dir} onClick={() => sortBy("value")} />
                  <SortHead label="Dato" active={list.sort.key === "date"} dir={list.sort.dir} onClick={() => sortBy("date")} />
                  <th scope="col" className={`px-3 py-2 text-left text-[0.8125rem] font-semibold uppercase tracking-[0.04em] ${GREY}`}>
                    Entreprenør
                  </th>
                  <th scope="col" className="w-8">
                    <span className="sr-only">Åpne</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {shown.rows.map((p) => {
                  const st = projectStage(p, now);
                  const marked = p.id === lastOpened;
                  return (
                    <tr
                      key={p.id}
                      data-row-id={p.id}
                      data-marked={marked ? "" : undefined}
                      className={`cursor-pointer align-top transition-colors hover:bg-[#F7F7FA] ${marked ? "bg-[#EAF0F8]" : ""}`}
                      onClick={() => go({ view: "project", id: p.id })}
                    >
                      <td className="max-w-0 px-3 py-2.5">
                        <button
                          type="button"
                          className={`text-left font-semibold ${BODY} ${NAVY} hover:underline`}
                          onClick={(e) => {
                            e.stopPropagation();
                            go({ view: "project", id: p.id });
                          }}
                        >
                          {p.title}
                        </button>
                        {isNew(p, alerts.last_sent_at ?? null) ? <span className={`${NY_TAG} ml-2 align-middle`}>Ny</span> : null}
                        <p className={`truncate ${SMALL} ${GREY}`}>{[p.buyer_name, p.place].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 ${SMALL} ${NAVY}`}>
                        <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: STAGE_DOT[st] }} aria-hidden />
                        {STAGE_WORD[st]}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 text-right tabular-nums ${SMALL} ${NAVY}`}>{valueNo(p) ?? ""}</td>
                      <td className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${SMALL} ${NAVY}`}>{dateCell(p)}</td>
                      <td className={`whitespace-nowrap px-3 py-2.5 ${SMALL}`}>{p.winners.length ? <span className={NAVY}>{p.winners.join(", ")}</span> : <span className={GREY}>Ikke tildelt</span>}</td>
                      <td className="px-2 py-2.5 align-middle">
                        <ChevronRight className="h-5 w-5 text-[#C7C7CC]" aria-hidden />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phone: two-line rows, 64px. */}
          <ul className={`${CARD} divide-y divide-[#E5E5EA] overflow-hidden md:hidden`} data-projects-rows="">
            {shown.rows.map((p) => {
              const st = projectStage(p, now);
              const who = p.winners.length ? p.winners.join(", ") : p.buyer_name;
              const rest = [valueNo(p), dateCell(p)].filter(Boolean).join(" · ");
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${ROW_TWO} ${p.id === lastOpened ? "bg-[#EAF0F8]" : ""}`}
                    onClick={() => go({ view: "project", id: p.id })}
                  >
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: STAGE_DOT[st] }} aria-label={STAGE_WORD[st]} />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`line-clamp-2 font-semibold ${BODY} ${NAVY}`}>
                        {p.title}
                        {isNew(p, alerts.last_sent_at ?? null) ? <span className={`${NY_TAG} ml-2 align-middle`}>Ny</span> : null}
                      </span>
                      <span className={`flex min-w-0 gap-1 overflow-hidden ${SMALL} ${GREY}`}>
                        {/* The firm's name is never cut; what follows it is. */}
                        {who ? <span className="shrink-0 whitespace-nowrap">{who}</span> : null}
                        {rest ? <span className="min-w-0 truncate">{who ? `· ${rest}` : rest}</span> : null}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[#C7C7CC]" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>

          {shown.pages > 1 ? (
            <nav aria-label="Sider" className="flex items-center justify-between gap-3">
              <button type="button" className={PILL} disabled={shown.page <= 1} onClick={() => set({ page: shown.page - 1 })}>
                Forrige
              </button>
              <span className={`${SMALL} ${GREY}`}>
                Side {shown.page} av {shown.pages}
              </span>
              <button type="button" className={PILL} disabled={shown.page >= shown.pages} onClick={() => set({ page: shown.page + 1 })}>
                Neste
              </button>
            </nav>
          ) : null}
        </>
      )}
      {footer}
      {/* ORDER 100: the source, smaller than small, never a link. */}
      <p className="max-w-[640px] text-[11px] font-normal leading-normal text-[#9AA3AF]">{PROJECT_SOURCE_LINE}</p>
    </div>
  );
}
