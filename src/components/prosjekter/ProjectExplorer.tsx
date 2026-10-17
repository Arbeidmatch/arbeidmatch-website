"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Bookmark, ChevronRight, LockKeyhole, MapPinned, Scale } from "lucide-react";
import { nearbyProjects, type ExplorerProject } from "@/lib/prosjekter/explorer";
import PortalModal from "./PortalModal";
import ExplorerGuide from "./ExplorerGuide";
import styles from "./explorer.module.css";
import { domainChoices } from "@/lib/prosjekter/format";
import { NORWAY_REGIONS } from "@/lib/prosjekter/regions";
import { STAGE_LABEL } from "@/lib/prosjekter/map";

const domainOptions = domainChoices();

const Terrain = dynamic(() => import("./ExplorerTerrain"), { ssr: false, loading: () => <div className={styles.terrain}>Laster kart ...</div> });
const SAVED = "am-projects-saved:v1";
function subscribeSaved(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("am-projects-saved", notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener("am-projects-saved", notify); };
}
function savedSnapshot() { try { return localStorage.getItem(SAVED) ?? "[]"; } catch { return "[]"; } }
const serverSaved = () => "[]";
const mobileQuery = "(max-width: 640px)";
function subscribeMobile(notify: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const mobileSnapshot = () => window.matchMedia(mobileQuery).matches;
const serverMobile = () => false;
const PAGE_SIZE = 12;

function Facts({ p, subscriber }: { p: ExplorerProject; subscriber: boolean }) {
  return <dl className={styles.facts}>
    <dt>Område</dt><dd>{p.place}</dd>
    <dt>Fag</dt><dd>{p.domains.join(", ") || "Ikke oppgitt"}</dd>
    <dt>Fase</dt><dd>{p.stageLabel}</dd>
    {subscriber ? <>
      <dt>Dato</dt><dd>{p.date ?? "Ikke oppgitt"}</dd>
      <dt>Byggherre</dt><dd>{p.buyer ?? "Ikke oppgitt"}</dd>
      <dt>Entreprenør</dt><dd>{p.winners.join(", ") || "Ikke oppgitt"}</dd>
    </> : null}
  </dl>;
}

export default function ProjectExplorer({ projects, subscriber = false, loading = false, failed = false, syncFiltersToUrl = false }: {
  projects: ExplorerProject[]; subscriber?: boolean; loading?: boolean; failed?: boolean; syncFiltersToUrl?: boolean;
}) {
  const [id, setId] = useState<string | null>(null);
  const [cameraRequest, setCameraRequest] = useState<{ id: string; revision: number } | null>(null);
  const params = useSearchParams();
  const [localFilters, setLocalFilters] = useState({ q: "", stage: "", region: "", domain: "" });
  const query = syncFiltersToUrl ? (params.get("q") ?? "").slice(0, 80) : localFilters.q;
  const stage = syncFiltersToUrl ? Object.entries(STAGE_LABEL).find(([key]) => key === params.get("stage"))?.[1] ?? "" : localFilters.stage;
  const region = syncFiltersToUrl ? Object.keys(NORWAY_REGIONS).find(key => key === params.get("region")) ?? "" : localFilters.region;
  const domain = syncFiltersToUrl ? domainOptions.find(d => d.key === params.get("domain"))?.label ?? "" : localFilters.domain;
  function changeFilter(key: keyof typeof localFilters, value: string) {
    setPage(0);
    if (!syncFiltersToUrl) { setLocalFilters(previous => ({ ...previous, [key]: value })); return; }
    const url = new URL(window.location.href);
    const encoded = key === "domain" ? domainOptions.find(d => d.label === value)?.key ?? ""
      : key === "stage" ? Object.entries(STAGE_LABEL).find(([, label]) => label === value)?.[0] ?? "" : value;
    if (encoded) url.searchParams.set(key, encoded); else url.searchParams.delete(key);
    url.searchParams.delete("page");
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<"details" | "map">("details");
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, serverMobile);
  const [savedOnly, setSavedOnly] = useState(false);
  const rawSaved = useSyncExternalStore(subscribeSaved, savedSnapshot, serverSaved);
  const [sessionSaved, setSessionSaved] = useState<string[] | null>(null);
  const saved = useMemo(() => {
    if (!subscriber) return [];
    if (sessionSaved) return sessionSaved;
    try { const raw: unknown = JSON.parse(rawSaved); return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string").slice(0, 500) : []; } catch { return []; }
  }, [rawSaved, sessionSaved, subscriber]);
  const [compare, setCompare] = useState<string[]>([]);
  const [comparison, setComparison] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [page, setPage] = useState(0);
  const [now] = useState(() => Date.now());
  const visible = useMemo(() => projects.filter(p => (!stage || p.stageLabel === stage) && (!region || (p.regions ?? [p.region]).includes(region))
    && (!domain || p.domains.includes(domain))
    && (!savedOnly || saved.includes(p.id)) && (!query || `${p.title} ${p.place} ${p.domains.join(" ")} ${p.buyer ?? ""}`.toLocaleLowerCase("nb").includes(query.toLocaleLowerCase("nb")))), [projects, stage, region, domain, savedOnly, saved, query]);
  const selected = visible.find(p => p.id === id) ?? visible[0] ?? null;
  const related = selected ? nearbyProjects(selected, visible) : [];
  const compared = projects.filter(p => compare.includes(p.id));
  const regions = syncFiltersToUrl
    ? [...new Map(projects.flatMap(p => (p.regions ?? [p.region]).filter(Boolean).map(r => [r, NORWAY_REGIONS[r] ?? r] as const))).entries()]
    : [...new Map(projects.filter(p => p.region).map(p => [p.region, p.place.split(", ").at(-1) ?? p.place])).entries()];
  const stages = [...new Set(projects.map(p => p.stageLabel))];
  const domains = [...new Set(projects.flatMap(p => p.domains))].sort((a, b) => a.localeCompare(b, "nb"));
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const selectedIndex = selected ? visible.indexOf(selected) : -1;
  const pick = (next: string) => {
    setId(next);
    setCameraRequest(previous => ({ id: next, revision: (previous?.revision ?? 0) + 1 }));
    setPage(Math.max(0, Math.floor(visible.findIndex(p => p.id === next) / PAGE_SIZE)));
    document.getElementById("explorer-detail")?.scrollTo({ top: 0 });
  };
  const save = () => {
    if (!selected) return;
    const next = saved.includes(selected.id) ? saved.filter(x => x !== selected.id) : [...saved, selected.id].slice(-500);
    try { localStorage.setItem(SAVED, JSON.stringify(next)); window.dispatchEvent(new Event("am-projects-saved")); } catch { setSessionSaved(next); }
  };
  const toggleCompare = () => {
    if (!selected) return;
    setCompare(old => old.includes(selected.id) ? old.filter(x => x !== selected.id) : [...old, selected.id].slice(-3));
  };

  return <section className={styles.explorer} aria-label="Prosjektutforsker">
    <ExplorerGuide mobile={mobile} />
    <div className={styles.resultBar}>
      <h2 aria-live="polite">{visible.length.toLocaleString("nb-NO")} prosjekter <span>{`av ${projects.length.toLocaleString("nb-NO")} totalt`}{syncFiltersToUrl ? ` · ${visible.filter(p => p.coordinates).length.toLocaleString("nb-NO")} i utvalget på kartet` : ""}</span></h2>
      {subscriber ? <label className={styles.savedFilter}><input type="checkbox" checked={savedOnly} onChange={e => { setSavedOnly(e.target.checked); setPage(0); }} /> Mine lagrede</label> : null}
      <button type="button" className={styles.filterToggle} aria-expanded={filtersOpen} aria-controls="explorer-extra-filters" onClick={() => setFiltersOpen(v => !v)}>{filtersOpen ? "Lukk filtre" : "Flere filtre"}{[query, stage, region].filter(Boolean).length ? ` (${[query, stage, region].filter(Boolean).length})` : ""}</button>
    </div>
    <div className={styles.filters}>
      <label><span>Fagområde</span><select aria-label="Fagområde" value={domain} onChange={e => changeFilter("domain", e.target.value)}><option value="">Alle fagområder</option>{domains.map(d => <option key={d}>{d}</option>)}</select></label>
      <div className={styles.extraFilters} id="explorer-extra-filters" data-open={filtersOpen}>
        <label><span>Søk</span><input value={query} maxLength={syncFiltersToUrl ? 80 : undefined} onChange={e => changeFilter("q", e.target.value)} placeholder={subscriber ? "Prosjekt, byggherre eller sted" : "Fag eller område"} /></label>
        <label><span>Fase</span><select aria-label="Fase" value={stage} onChange={e => changeFilter("stage", e.target.value)}><option value="">Alle faser</option>{stages.map(s => <option key={s}>{s}</option>)}</select></label>
        <label><span>Område</span><select aria-label="Område" value={region} onChange={e => changeFilter("region", e.target.value)}><option value="">Hele Norge</option>{regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
      </div>
    </div>
    <div className={styles.mobileNavigation}>
      {selected ? <>
        <label><span>Velg prosjekt</span><select aria-label="Velg prosjekt" value={selected.id} onChange={e => pick(e.target.value)}>{visible.map((p, i) => <option key={p.id} value={p.id}>{i + 1}. {p.title} · {p.place}</option>)}</select></label>
        <div className={styles.projectPager}>
          <button type="button" disabled={selectedIndex <= 0} onClick={() => pick(visible[selectedIndex - 1].id)}>Forrige</button>
          <span>{selectedIndex + 1} / {visible.length.toLocaleString("nb-NO")}</span>
          <button type="button" disabled={selectedIndex >= visible.length - 1} onClick={() => pick(visible[selectedIndex + 1].id)}>Neste <ChevronRight size={15} /></button>
        </div>
      </> : null}
      <div className={styles.mobileTabs} role="group" aria-label="Prosjektvisning på mobil">
        <button type="button" aria-pressed={mobileView === "details"} onClick={() => setMobileView("details")}>Detaljer</button>
        <button type="button" aria-pressed={mobileView === "map"} onClick={() => setMobileView("map")}>3D-kart</button>
      </div>
    </div>
    <div className={styles.workspace} data-mobile-view={mobileView}>
      <article className={styles.detail} id="explorer-detail" aria-live="polite">
        {selected ? <>
          <div className={styles.stage}>{selected.stageLabel}{subscriber && now !== null && selected.published && Date.parse(selected.published) <= now && now - Date.parse(selected.published) < 7 * 86400000 ? <span>Nylig kunngjort</span> : null}</div>
          <h2>{selected.title}</h2>
          {!subscriber ? <p className={styles.muted}>Prosjektnavn og fullstendige detaljer er for abonnenter.</p> : null}
          <div className={styles.amount}><span>{subscriber ? "Oppgitt verdi" : "Verdiintervall"}</span><strong>{selected.value}</strong></div>
          <Facts p={selected} subscriber={subscriber} />
          {syncFiltersToUrl && !selected.coordinates ? <p className={styles.muted}>Kartposisjon ikke tilgjengelig</p> : null}
          {subscriber ? <>
            <div className={styles.timeline} aria-label="Bekreftet fase"><span>Prosjektfase</span><strong>{selected.stageLabel}</strong></div>
            {selected.description ? <details key={selected.id} className={styles.description} open={!mobile}><summary>Om prosjektet</summary><p>{selected.description}</p></details> : null}
            {selected.documents ? <a className={styles.document} href={selected.documents} target="_blank" rel="noopener noreferrer">Gå til kilden <ChevronRight size={16} /></a> : <p className={styles.muted}>Kildelenke er ikke tilgjengelig for dette prosjektet.</p>}
            <div className={styles.tools}>
              <button type="button" onClick={save} aria-pressed={saved.includes(selected.id)}><Bookmark size={15} />{saved.includes(selected.id) ? "Lagret" : "Lagre"}</button>
              <button type="button" onClick={toggleCompare} disabled={compare.length >= 3 && !compare.includes(selected.id)} aria-pressed={compare.includes(selected.id)}><Scale size={15} />{compare.includes(selected.id) ? "Valgt" : "Sammenlign"}</button>
              {compared.length > 0 ? <button type="button" onClick={() => setComparison(true)}>Vis ({compared.length}/3)</button> : null}
            </div>
            <p className={styles.fine}>Lagrede prosjekter huskes i denne nettleseren. Sammenlign inntil tre.</p>
            {related.length ? <section className={styles.related}><h3>Flere prosjekter i samme område</h3>{related.map(p => <button key={p.id} type="button" onClick={() => pick(p.id)}>{p.title}<ChevronRight size={14} /></button>)}</section> : null}
          </> : <div className={styles.lock}><LockKeyhole size={18} /><div><h3>Hele bildet, med abonnement</h3><p>Prosjektnavn, byggherre, entreprenør, nøyaktig verdi, frister og lenker til kildene.</p><a href="#tilgang">Se detaljer med abonnement <ChevronRight size={14} /></a><a href="#logg-inn">Har du tilgang? Logg inn</a></div></div>}
        </> : <div className={styles.empty}><h2>{loading ? "Henter prosjekter ..." : failed ? "Prosjektene kunne ikke lastes" : "Ingen prosjekter i utvalget"}</h2><p>{failed ? "Prøv å laste siden på nytt." : "Velg et annet område eller en annen fase."}</p></div>}
      </article>
      <div className={styles.mapPanel}>
        {(mobile ? mobileView === "map" : showMap) ? <Terrain demo={!subscriber} projects={visible} selected={selected} cameraRequest={cameraRequest} onSelect={pick} /> : <div className={styles.mapOff}><MapPinned size={30} /><p>Kartet er skjult. Alle prosjektdetaljer er tilgjengelige.</p></div>}
        <button type="button" className={styles.mapToggle} onClick={() => setShowMap(v => !v)}>{showMap ? "Skjul kart" : "Vis 3D-kart"}</button>
      </div>
    </div>
    <div className={styles.listHead}><h2>Prosjektoversikt</h2>{selected && visible.length > 1 ? <button type="button" onClick={() => pick(visible[(visible.indexOf(selected) + 1) % visible.length].id)}>Neste prosjekt <ChevronRight size={16} /></button> : null}</div>
    <ul className={styles.projectList}>{visible.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map(p => <li key={p.id}><button type="button" className={p.id === selected?.id ? styles.selected : ""} onClick={() => pick(p.id)} aria-pressed={p.id === selected?.id}><span>{p.place} · {p.stageLabel}</span><strong>{p.title}</strong><b>{p.value}</b>{subscriber && p.date ? <small>{p.date}</small> : null}</button></li>)}</ul>
    {pageCount > 1 ? <nav className={styles.pagination} aria-label="Prosjektsider"><button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Forrige side</button><span>Side {currentPage + 1} av {pageCount}</span><button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>Neste side</button></nav> : null}
    {comparison && subscriber ? <PortalModal title="Sammenlign prosjekter" onClose={() => setComparison(false)}><div className={styles.comparison}>{compared.map(p => <article key={p.id}><h3>{p.title}</h3><strong>{p.value}</strong><Facts p={p} subscriber /></article>)}</div></PortalModal> : null}
  </section>;
}
