"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PortalMap, { type PortalMapHandle } from "@/components/prosjekter/PortalMap";
import ProjectDetail from "@/components/prosjekter/ProjectDetail";
import styles from "@/components/prosjekter/portal.module.css";
import { cleanDescription, domainChoices, keyDateNo, placeNo, valueNo, type AlertProject } from "@/lib/prosjekter/format";
import { subscriberMap } from "@/lib/prosjekter/subscriber-map";
import {
  COUNTIES,
  countyCounts,
  filterProjects,
  placeProjects,
  sortProjects,
  STAGE_HEX,
  STAGE_LABEL,
  STAGES,
  type MapStage,
  valueBand,
  type PlacedProject,
} from "@/lib/prosjekter/map";
import { isOverview, type Overview, type OverviewFilters } from "@/lib/prosjekter/types";

/**
 * The open project portal, arbeidmatch.no/prosjekter: the hero with the three
 * stage counts, then the map and the list side by side and in step. A dot
 * hovered lights its row and a row hovered rings its dot; a row clicked zooms
 * the map to it; a county clicked zooms and filters both.
 *
 * Everything here is public: a title with the buyer taken out, the town and
 * county, the stage, the value and the month that matters. The buyer, the
 * contractor, exact deadlines and the documents are for clients, and every
 * card says so in its lock line.
 *
 * Rendered on the server with the ATS's first answer, so the list is in the
 * HTML for a search engine; an ATS that does not yet send `map` gets the plain
 * list of `projects` instead of dots.
 *
 * With `subscriber`, the same screen is a client's own page (his ask, 9
 * November 2026: "vreau ca clientii sa aiba ceea ce vad", by their
 * subscription): the dots and rows are the client's projects, named, with
 * buyer, place, exact value, date and the way to the competition; nothing is
 * locked and nothing asks for an invitation. The open overview is still read,
 * for the coordinates and the trade names only.
 *
 * ORDER 273: on a client's own page a row or a dot opens the project's full
 * detail across the section, in place of the map and the list, and "Alle
 * prosjekter" brings them back; on a phone a row never switches to the map.
 * One detail at a time. The open page keeps its rows exactly as they were.
 */

const PAGE = 60;
const nf = new Intl.NumberFormat("nb-NO");

type Sort = "rel" | "val";

function stagesFrom(stage: OverviewFilters["stage"]): Set<MapStage> {
  if (stage === "planned") return new Set(["planned"]);
  if (stage === "tender") return new Set(["tender"]);
  if (stage === "awarded") return new Set(["awarded"]);
  return new Set(STAGES);
}

function queryFor(stages: Set<MapStage>, county: string | null, domain: string): string {
  const q = new URLSearchParams();
  if (stages.size === 1) {
    const only = [...stages][0];
    if (only !== "closed") q.set("stage", only);
  }
  if (county) q.set("region", county);
  if (domain) q.set("domain", domain);
  const s = q.toString();
  return s ? `?${s}` : "";
}

function useCountUp(target: number): number {
  const [n, setN] = useState(target);
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !target) return;
    done.current = true;
    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      /* animate */
    }
    if (reduce) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1300);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function Stat({ stage, label, value }: { stage: string; label: string; value: number | null }) {
  const n = useCountUp(value ?? 0);
  return (
    <div className={styles.stat}>
      <div className={styles.statK}>
        <span className={styles.dot} style={{ "--c": `var(--st-${stage})` } as React.CSSProperties} />
        {label}
      </div>
      <div className={`${styles.statV} ${styles.num}`}>{value === null ? "-" : nf.format(n)}</div>
    </div>
  );
}

/**
 * The list names no project, place, exact value or deadline: with those a
 * visitor finds the tender himself instead of asking for access (his decision,
 * 16 October 2026). The name shows as grey bars, so the row reads as a real
 * project whose details are kept for clients. The map is left as it was.
 */
function MaskedTitle({ seed }: { seed: number }) {
  const a = 90 + ((seed * 37) % 90);
  const b = 50 + ((seed * 53) % 80);
  return (
    <h3 className={styles.masked} aria-label="Prosjektnavn for kunder">
      <i style={{ width: a }} />
      <i style={{ width: b }} />
    </h3>
  );
}

function Row({
  p,
  hl,
  domainLabel,
  onHover,
  onPick,
  detail,
  approximate = false,
}: {
  p: PlacedProject;
  hl: boolean;
  domainLabel: string | null;
  onHover: (no: number | null) => void;
  onPick: (no: number) => void;
  /** The client's own project behind the row; absent on the open page. */
  detail?: AlertProject;
  approximate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (detail) {
    const value = valueNo(detail);
    const date = keyDateNo(detail);
    const place = placeNo(detail);
    const description = cleanDescription(detail.description, open ? 2000 : 180);
    const documents = detail.documents_url && /^https:\/\//i.test(detail.documents_url) ? detail.documents_url : null;
    return (
      <li className={`${styles.row} ${hl ? styles.rowHl : ""}`}>
        <button
          type="button"
          id={`pp-${p.no}`}
          className={styles.item}
          onMouseEnter={() => onHover(p.no)}
          onFocus={() => onHover(p.no)}
          onClick={() => onPick(p.no)}
        >
          <span className={styles.topRow}>
            <span className={styles.pill} style={{ "--c": STAGE_HEX[p.st] } as React.CSSProperties}>
              {STAGE_LABEL[p.st]}
            </span>
            {domainLabel ? <span className={styles.tag}>{domainLabel}</span> : null}
          </span>
          <span>
            <h3>{detail.title}</h3>
            <span className={styles.where} style={{ display: "block" }}>
              {[detail.buyer_name, place || (COUNTIES[p.r]?.n ?? "")].filter(Boolean).join(" · ")}
              {approximate ? " · omtrentlig plassering" : ""}
            </span>
            {detail.winners.length ? (
              <span className={styles.where} style={{ display: "block" }}>
                {`Entreprenør: ${detail.winners.map((w) => w.name).join(", ")}`}
              </span>
            ) : null}
          </span>
          <span className={styles.val}>
            {value ? <span className={`${styles.valBand} ${styles.num}`}>{value}</span> : null}
            {date ? <span className={styles.where} style={{ display: "block" }}>{date}</span> : null}
          </span>
        </button>
        {description || documents ? (
          <span className={`${styles.rowFoot} ${styles.rowFootWide}`}>
            {description ? (
              <span className={styles.where} style={{ display: "block" }}>
                {description}{" "}
                {(detail.description ?? "").length > 180 ? (
                  <button type="button" className={styles.showAll} onClick={() => setOpen((o) => !o)}>
                    {open ? "Vis mindre" : "Les mer"}
                  </button>
                ) : null}
              </span>
            ) : null}
            {documents ? (
              <a href={documents} target="_blank" rel="noopener noreferrer" className={styles.rowCta}>
                Gå til konkurransen
              </a>
            ) : null}
          </span>
        ) : null}
      </li>
    );
  }
  const value = valueBand(p.v);
  return (
    <li className={`${styles.row} ${hl ? styles.rowHl : ""}`}>
      <button
        type="button"
        id={`pp-${p.no}`}
        className={styles.item}
        onMouseEnter={() => onHover(p.no)}
        onFocus={() => onHover(p.no)}
        onClick={() => onPick(p.no)}
      >
        <span className={styles.topRow}>
          <span className={styles.pill} style={{ "--c": STAGE_HEX[p.st] } as React.CSSProperties}>
            {STAGE_LABEL[p.st]}
          </span>
          {domainLabel ? <span className={styles.tag}>{domainLabel}</span> : null}
        </span>
        <span>
          <MaskedTitle seed={p.no} />
          <span className={styles.where} style={{ display: "block" }}>
            {COUNTIES[p.r]?.n ?? ""}
          </span>
        </span>
        <span className={styles.val}>
          {value ? <span className={`${styles.valBand} ${styles.num}`}>{value}</span> : null}
        </span>
      </button>
      <span className={styles.rowFoot}>
        <a href="#tilgang" aria-haspopup="dialog" className={styles.rowCta}>
          Be om invitasjon
        </a>
      </span>
    </li>
  );
}

export default function ProjectPortal({
  initial,
  initialFilters,
  subscriber,
}: {
  initial: Overview | null;
  initialFilters: OverviewFilters;
  /** A client's own page: their projects on the same map, named and complete; `token` opens a project's detail. */
  subscriber?: { projects: AlertProject[]; company: string; token?: string };
}) {
  const [data, setData] = useState<Overview | null>(initial);
  const [failed, setFailed] = useState(false);

  // No first answer on the server: try once more from the browser.
  useEffect(() => {
    if (initial) return;
    let live = true;
    fetch("/api/prosjekter/overview", { cache: "no-store" })
      .then((r) => r.json().then((j: unknown) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!live) return;
        if (ok && isOverview(j)) setData(j);
        else setFailed(true);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [initial]);

  const own = useMemo(() => (subscriber ? subscriberMap(subscriber.projects, data) : null), [subscriber, data]);
  const projects = useMemo(() => own?.placed ?? placeProjects(data?.map), [own, data]);
  const hasMap = own ? true : Array.isArray(data?.map);
  const ready = own ? true : Boolean(data);
  const counts = useMemo(() => countyCounts(own ? undefined : data?.county_counts, projects), [own, data, projects]);

  const [stages, setStages] = useState<Set<MapStage>>(() => stagesFrom(initialFilters.stage));
  const [domain, setDomain] = useState(initialFilters.domain);
  const [county, setCounty] = useState<string | null>(COUNTIES[initialFilters.region] ? initialFilters.region : null);
  const [sort, setSort] = useState<Sort>("rel");
  const [hover, setHover] = useState<number | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [limit, setLimit] = useState(PAGE);
  const mapRef = useRef<PortalMapHandle>(null);

  const domainOptions = useMemo(() => {
    const fromAts = (data?.domains ?? []).filter((d) => d && typeof d.key === "string" && typeof d.label === "string");
    return fromAts.length ? fromAts : domainChoices().map((d) => ({ key: d.key as string, label: d.label }));
  }, [data]);
  const domainLabel = useMemo(() => new Map(domainOptions.map((d) => [d.key, d.label])), [domainOptions]);

  const visible = useMemo(() => filterProjects(projects, { stages, domain, county }), [projects, stages, domain, county]);
  // A group clicked on the map: the list shows only those, until "Vis alle" or another filter.
  const [picked, setPicked] = useState<number[] | null>(null);
  const listed = useMemo(() => {
    const sorted = sortProjects(visible, sort);
    if (!picked) return sorted;
    const keep = new Set(picked);
    return sorted.filter((p) => keep.has(p.no));
  }, [visible, sort, picked]);
  useEffect(() => {
    setPicked(null);
  }, [stages, domain, county]);
  const stageCounts = useMemo(() => {
    const out: Record<MapStage, number> = { planned: 0, tender: 0, closed: 0, awarded: 0 };
    for (const p of filterProjects(projects, { stages: new Set(STAGES), domain, county })) out[p.st]++;
    return out;
  }, [projects, domain, county]);

  useEffect(() => {
    if (own) return; // a client's page keeps its own address
    try {
      const query = new URLSearchParams(queryFor(stages, county, domain));
      query.set("view", "old");
      window.history.replaceState(null, "", `/prosjekter?${query}${window.location.hash}`);
    } catch {
      /* the address bar is a convenience */
    }
  }, [own, stages, county, domain]);

  const toggleStage = (s: MapStage) => {
    setLimit(PAGE);
    setStages((old) => {
      const next = new Set(old);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const pickCounty = useCallback((code: string | null) => {
    setLimit(PAGE);
    setCounty(code);
  }, []);

  const isPhone = () => {
    try {
      return window.matchMedia("(max-width: 900px)").matches;
    } catch {
      return false;
    }
  };

  // ORDER 273: the one project open in full on a client's page, by its dot number; null shows the map and the list.
  const [openNo, setOpenNo] = useState<number | null>(null);
  const detailToken = own && subscriber?.token ? subscriber.token : null;

  const onPickRow = (no: number) => {
    if (detailToken && own?.details.get(no)) {
      setOpenNo(no);
      return;
    }
    if (isPhone()) setView("map");
    // After the map is shown again, so it has its size.
    requestAnimationFrame(() => mapRef.current?.focusProject(no));
  };

  const listRef = useRef<HTMLUListElement>(null);
  const onCluster = useCallback((nos: number[]) => {
    setPicked(nos);
    setLimit(PAGE);
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0 }));
  }, []);

  // The last tap on a group, where the map cannot split it further: the phone opens the list at once.
  const onLastGroup = useCallback((nos: number[]) => {
    onCluster(nos);
    if (isPhone()) setView("list");
  }, [onCluster]);

  const onSelectDot = useCallback(
    (no: number) => {
      if (detailToken && own?.details.get(no)) {
        setOpenNo(no);
        return;
      }
      const i = listed.findIndex((p) => p.no === no);
      if (i >= limit) setLimit(Math.ceil((i + 1) / PAGE) * PAGE);
      if (isPhone()) return;
      requestAnimationFrame(() => document.getElementById(`pp-${no}`)?.scrollIntoView({ block: "nearest" }));
    },
    [listed, limit, detailToken, own],
  );

  // Back from a project: the list as it was, the row in view and lit.
  const closeDetail = () => {
    const no = openNo;
    setOpenNo(null);
    if (no === null) return;
    setView("list");
    setHover(no);
    const i = listed.findIndex((p) => p.no === no);
    if (i >= limit) setLimit(Math.ceil((i + 1) / PAGE) * PAGE);
    requestAnimationFrame(() => document.getElementById(`pp-${no}`)?.scrollIntoView({ block: "center" }));
  };

  const firstDomain = (p: PlacedProject) => {
    for (const d of p.d) {
      const label = domainLabel.get(d);
      if (label) return label;
    }
    return null;
  };

  const shown = listed.slice(0, limit);
  const allCounts = useMemo(() => {
    const out: Record<MapStage, number> = { planned: 0, tender: 0, closed: 0, awarded: 0 };
    for (const p of projects) out[p.st]++;
    return out;
  }, [projects]);
  const stat = (k: "planned" | "tender" | "awarded") => (own ? allCounts[k] : data ? data.counts[k] : null);

  return (
    <section className={styles.hero}>
      <div className={styles.wrap}>
        <div className={styles.heroHead}>
          <div>
            <p className={`${styles.eyebrow} ${styles.brandLine}`}>
              <span className={styles.brand}>
                <i aria-hidden="true" />
                Forsprang
              </span>
              <span className={styles.brandSep} aria-hidden="true" />
              Bygg- og anleggsprosjekter
            </p>
            {own ? (
              <>
                <h1>
                  Prosjektene til <em>{subscriber?.company}</em>, fylke for fylke.
                </h1>
                <p className={styles.lede}>
                  Planlagte prosjekter, åpne konkurranser og tildelte kontrakter i deres fylker og fag, med byggherre,
                  entreprenør, verdi og frister.
                  {own.unplaced ? ` ${own.unplaced} ${own.unplaced === 1 ? "prosjekt mangler" : "prosjekter mangler"} sted og vises ikke på kartet.` : ""}
                </p>
              </>
            ) : (
              <>
                <h1>
                  Se hvor Norge <em>bygger</em>, fylke for fylke.
                </h1>
                <p className={styles.lede}>
                  Planlagte prosjekter, åpne konkurranser og tildelte kontrakter på ett kart. Kartet er åpent for alle.
                  Kundene våre ser byggherre, entreprenør og frister, og får varsel når noe nytt dukker opp i deres område.
                </p>
              </>
            )}
          </div>
          <div className={styles.stats}>
            <Stat stage="planned" label="Planlagt" value={stat("planned")} />
            <Stat stage="tender" label="Åpen konkurranse" value={stat("tender")} />
            <Stat stage="awarded" label="Tildelt" value={stat("awarded")} />
          </div>
        </div>

        {own ? null : (
          <p style={{ color: "var(--text-2)", fontSize: 14, margin: "16px 0" }}><strong>Demo - kartbilde og detaljvisning.</strong> Forhåndsvisning av tjenesten. Fullstendige prosjektdetaljer krever invitasjon.</p>
        )}
        {detailToken && openNo !== null && own?.details.get(openNo) ? (
          (() => {
            const project = own.details.get(openNo)!;
            const i = listed.findIndex((p) => p.no === openNo);
            const prev = i > 0 ? listed[i - 1].no : null;
            const next = i >= 0 && i < listed.length - 1 ? listed[i + 1].no : null;
            return (
              <div className="mt-4 rounded-2xl bg-[#F2F2F7] p-4 text-[#1B2B44] md:p-6" lang="nb">
                <ProjectDetail
                  key={project.id}
                  url={`/api/prosjekter/alerts/${encodeURIComponent(detailToken)}/project/${encodeURIComponent(project.id)}`}
                  preview={{ title: project.title, stage: project.stage, buyer_name: project.buyer_name, place: placeNo(project) || null }}
                  index={i + 1}
                  total={listed.length}
                  onBack={closeDetail}
                  onPrev={prev !== null ? () => setOpenNo(prev) : null}
                  onNext={next !== null ? () => setOpenNo(next) : null}
                  phoneBackLabel="Alle prosjekter"
                  ask={{ label: "Be om folk", href: "/request" }}
                />
              </div>
            );
          })()
        ) : (
        <div className={styles.explorer} data-view={view}>
          <div className={styles.bar} role="toolbar" aria-label="Filtre">
            <div className={styles.viewToggle} role="group" aria-label="Visning">
              <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>
                Kart
              </button>
              <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
                Liste
              </button>
            </div>
            {hasMap
              ? STAGES.filter((s) => s !== "closed" || stageCounts.closed > 0).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={styles.chip}
                    aria-pressed={stages.has(s)}
                    style={{ "--c": STAGE_HEX[s] } as React.CSSProperties}
                    onClick={() => toggleStage(s)}
                  >
                    <span className={styles.dot} />
                    {STAGE_LABEL[s]} <span className={styles.chipN}>{nf.format(stageCounts[s])}</span>
                  </button>
                ))
              : null}
            <label className={styles.sr} htmlFor="pp-fag">
              Fag
            </label>
            <select
              id="pp-fag"
              className={styles.select}
              value={domain}
              onChange={(e) => {
                setLimit(PAGE);
                setDomain(e.target.value);
              }}
              disabled={!hasMap}
            >
              <option value="">Alle fag</option>
              {domainOptions.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
            {county ? (
              <button
                type="button"
                className={`${styles.chip} ${styles.countyChip}`}
                aria-label={`Fjern fylkesfilter: ${COUNTIES[county]?.n ?? ""}`}
                onClick={() => mapRef.current?.pickCounty(null)}
              >
                {COUNTIES[county]?.n}
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </div>

          <div className={styles.split}>
            <PortalMap
              ref={mapRef}
              visible={visible}
              counts={counts}
              county={county}
              onPickCounty={pickCounty}
              hover={hover}
              onHover={setHover}
              onSelect={onSelectDot}
              onCluster={onCluster}
              onLastGroup={onLastGroup}
              subscriber={Boolean(own)}
            />
            {picked && view === "map" ? (
              <button type="button" className={styles.pickedBar} onClick={() => setView("list")}>
                {picked.length === 1 ? "Vis prosjektet i listen" : `Vis ${picked.length} prosjekter i listen`}
              </button>
            ) : null}

            <div className={styles.listcard}>
              <div className={styles.listHead}>
                <div className={styles.listCount} aria-live="polite">
                  {hasMap && picked ? (
                    <>
                      <strong className={styles.num}>{nf.format(listed.length)}</strong>{" "}
                      {listed.length === 1 ? "prosjekt" : "prosjekter"} valgt på kartet{" "}
                      <button type="button" className={styles.showAll} onClick={() => setPicked(null)}>
                        Vis alle
                      </button>
                    </>
                  ) : hasMap ? (
                    <>
                      <strong className={styles.num}>{nf.format(listed.length)}</strong>{" "}
                      {listed.length === 1 ? "prosjekt" : "prosjekter"}
                      {county ? ` i ${COUNTIES[county]?.n ?? ""}` : " i utvalget"}
                    </>
                  ) : data ? (
                    <>
                      <strong className={styles.num}>{nf.format(data.total)}</strong> prosjekter
                    </>
                  ) : null}
                </div>
                {hasMap ? (
                  <>
                    <label className={styles.sr} htmlFor="pp-sort">
                      Sorter
                    </label>
                    <select
                      id="pp-sort"
                      className={styles.select}
                      value={sort}
                      onChange={(e) => setSort(e.target.value === "val" ? "val" : "rel")}
                    >
                      <option value="rel">Åpne konkurranser først</option>
                      <option value="val">Høyest verdi</option>
                    </select>
                  </>
                ) : null}
              </div>
              <ul ref={listRef} className={styles.list} onMouseLeave={() => setHover(null)}>
                {!ready ? (
                  <li className={styles.empty}>
                    {failed ? "Prosjektoversikten er ikke tilgjengelig akkurat nå. Prøv igjen om litt." : "Henter prosjekter ..."}
                  </li>
                ) : hasMap ? (
                  shown.length ? (
                    shown.map((p) => (
                      <Row
                        key={p.no}
                        p={p}
                        hl={hover === p.no}
                        domainLabel={firstDomain(p)}
                        onHover={setHover}
                        onPick={onPickRow}
                        detail={own?.details.get(p.no)}
                        approximate={own?.approximate.has(p.no)}
                      />
                    ))
                  ) : (
                    <li className={styles.empty}>
                      {own ? "Ingen prosjekter i abonnementet passer disse filtrene. Slå på flere faser eller velg «Alle fag»." : "Ingen prosjekter med disse filtrene. Slå på flere faser eller velg «Alle fag»."}
                    </li>
                  )
                ) : (
                  (data?.projects ?? []).map((p, i) => (
                    <li key={`${p.project_no ?? "x"}-${i}`} className={styles.item} style={{ cursor: "default" }}>
                      <span className={styles.topRow}>
                        <span className={styles.pill} style={{ "--c": STAGE_HEX[p.stage] ?? STAGE_HEX.closed } as React.CSSProperties}>
                          {p.stage_label}
                        </span>
                      </span>
                      <span>
                        <MaskedTitle seed={p.project_no ?? i} />
                      </span>
                      <span className={styles.val} />
                      <a href="#tilgang" aria-haspopup="dialog" className={styles.rowCta}>
                        Be om invitasjon
                      </a>
                    </li>
                  ))
                )}
                {hasMap && listed.length > shown.length ? (
                  <li className={styles.more}>
                    <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setLimit((n) => n + PAGE)}>
                      Vis flere ({nf.format(listed.length - shown.length)} til)
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
