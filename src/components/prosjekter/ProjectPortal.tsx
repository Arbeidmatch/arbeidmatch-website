"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PortalMap, { LockLine, type PortalMapHandle } from "@/components/prosjekter/PortalMap";
import styles from "@/components/prosjekter/portal.module.css";
import { domainChoices } from "@/lib/prosjekter/format";
import {
  COUNTIES,
  countyCounts,
  filterProjects,
  mnok,
  placeProjects,
  sortProjects,
  STAGE_HEX,
  STAGE_LABEL,
  STAGES,
  type MapStage,
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

function Row({
  p,
  hl,
  domainLabel,
  onHover,
  onPick,
}: {
  p: PlacedProject;
  hl: boolean;
  domainLabel: string | null;
  onHover: (no: number | null) => void;
  onPick: (no: number) => void;
}) {
  const value = mnok(p.v);
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
          <h3>{p.t}</h3>
          <span className={styles.where} style={{ display: "block" }}>
            {[p.c, COUNTIES[p.r]?.n].filter(Boolean).join(" · ")}
          </span>
        </span>
        <span className={styles.val}>
          {value ? (
            <>
              <span className={`${styles.valN} ${styles.num}`}>{value}</span>
              <span className={styles.valU}>MNOK</span>
            </>
          ) : null}
          {p.k ? (
            <span className={styles.when} style={{ display: "block" }}>
              {p.k}
            </span>
          ) : null}
        </span>
      </button>
      <span className={styles.rowFoot}>
        <LockLine
          action={
            <a href="#tilgang" aria-haspopup="dialog" className={styles.rowCta}>
              Få tilgang
            </a>
          }
        />
      </span>
    </li>
  );
}

export default function ProjectPortal({
  initial,
  initialFilters,
}: {
  initial: Overview | null;
  initialFilters: OverviewFilters;
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

  const projects = useMemo(() => placeProjects(data?.map), [data]);
  const hasMap = Array.isArray(data?.map);
  const counts = useMemo(() => countyCounts(data?.county_counts, projects), [data, projects]);

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
    try {
      window.history.replaceState(null, "", `/prosjekter${queryFor(stages, county, domain)}${window.location.hash}`);
    } catch {
      /* the address bar is a convenience */
    }
  }, [stages, county, domain]);

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

  const onPickRow = (no: number) => {
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

  const onSelectDot = useCallback(
    (no: number) => {
      const i = listed.findIndex((p) => p.no === no);
      if (i >= limit) setLimit(Math.ceil((i + 1) / PAGE) * PAGE);
      if (isPhone()) return;
      requestAnimationFrame(() => document.getElementById(`pp-${no}`)?.scrollIntoView({ block: "nearest" }));
    },
    [listed, limit],
  );

  const firstDomain = (p: PlacedProject) => {
    for (const d of p.d) {
      const label = domainLabel.get(d);
      if (label) return label;
    }
    return null;
  };

  const shown = listed.slice(0, limit);

  return (
    <section className={styles.hero}>
      <div className={styles.wrap}>
        <div className={styles.heroHead}>
          <div>
            <p className={styles.eyebrow}>Bygg og anlegg · hele Norge</p>
            <h1>
              Se hvor Norge <em>bygger</em>, fylke for fylke.
            </h1>
            <p className={styles.lede}>
              Planlagte prosjekter, åpne konkurranser og tildelte kontrakter på ett kart. Kartet er åpent for alle.
              Kundene våre ser byggherre, entreprenør og frister, og får varsel når noe nytt dukker opp i deres område.
            </p>
          </div>
          <div className={styles.stats}>
            <Stat stage="planned" label="Planlagt" value={data ? data.counts.planned : null} />
            <Stat stage="tender" label="Åpen konkurranse" value={data ? data.counts.tender : null} />
            <Stat stage="awarded" label="Tildelt" value={data ? data.counts.awarded : null} />
          </div>
        </div>

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
                {!data ? (
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
                      />
                    ))
                  ) : (
                    <li className={styles.empty}>Ingen prosjekter med disse filtrene. Slå på flere faser eller velg «Alle fag».</li>
                  )
                ) : (
                  data.projects.map((p, i) => (
                    <li key={`${p.project_no ?? "x"}-${i}`} className={styles.item} style={{ cursor: "default" }}>
                      <span className={styles.topRow}>
                        <span className={styles.pill} style={{ "--c": STAGE_HEX[p.stage] ?? STAGE_HEX.closed } as React.CSSProperties}>
                          {p.stage_label}
                        </span>
                      </span>
                      <span>
                        <h3>{p.title}</h3>
                        <span className={styles.where} style={{ display: "block" }}>
                          {p.place}
                        </span>
                      </span>
                      <span className={styles.val}>
                        {p.value_label ? <span className={`${styles.valN} ${styles.num}`}>{p.value_label}</span> : null}
                        {p.date_label ? (
                          <span className={styles.when} style={{ display: "block" }}>
                            {p.date_label}
                          </span>
                        ) : null}
                      </span>
                      <LockLine
                        action={
                          <a href="#tilgang" aria-haspopup="dialog" className={styles.rowCta}>
                          Få tilgang
                        </a>
                        }
                      />
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
      </div>
    </section>
  );
}
