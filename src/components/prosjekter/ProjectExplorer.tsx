"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Bookmark, ChevronRight, LockKeyhole, MapPinned, Scale } from "lucide-react";
import { nearbyProjects, type ExplorerProject } from "@/lib/prosjekter/explorer";
import PortalModal from "./PortalModal";
import styles from "./explorer.module.css";

const Terrain = dynamic(() => import("./ExplorerTerrain"), { ssr: false, loading: () => <div className={styles.terrain}>Laster kart ...</div> });
const SAVED = "am-projects-saved:v1";
function subscribeSaved(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("am-projects-saved", notify);
  return () => { window.removeEventListener("storage", notify); window.removeEventListener("am-projects-saved", notify); };
}
function savedSnapshot() { try { return localStorage.getItem(SAVED) ?? "[]"; } catch { return "[]"; } }
const serverSaved = () => "[]";

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

export default function ProjectExplorer({ projects, subscriber = false, loading = false, failed = false }: {
  projects: ExplorerProject[]; subscriber?: boolean; loading?: boolean; failed?: boolean;
}) {
  const [id, setId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("");
  const [region, setRegion] = useState("");
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
  const [limit, setLimit] = useState(30);
  const [now] = useState(() => Date.now());
  const visible = useMemo(() => projects.filter(p => (!stage || p.stageLabel === stage) && (!region || p.region === region)
    && (!savedOnly || saved.includes(p.id)) && (!query || `${p.title} ${p.place} ${p.domains.join(" ")} ${p.buyer ?? ""}`.toLocaleLowerCase("nb").includes(query.toLocaleLowerCase("nb")))), [projects, stage, region, savedOnly, saved, query]);
  const selected = visible.find(p => p.id === id) ?? visible[0] ?? null;
  const related = selected ? nearbyProjects(selected, visible) : [];
  const compared = projects.filter(p => compare.includes(p.id));
  const regions = [...new Map(projects.filter(p => p.region).map(p => [p.region, p.place.split(", ").at(-1) ?? p.place])).entries()];
  const stages = [...new Set(projects.map(p => p.stageLabel))];
  const pick = (next: string) => { setId(next); document.getElementById("explorer-detail")?.scrollTo({ top: 0 }); };
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
    <div className={styles.filters}>
      <label><span>Søk</span><input value={query} onChange={e => { setQuery(e.target.value); setLimit(30); }} placeholder={subscriber ? "Prosjekt, byggherre eller sted" : "Fag eller område"} /></label>
      <label><span>Fase</span><select value={stage} onChange={e => { setStage(e.target.value); setLimit(30); }}><option value="">Alle faser</option>{stages.map(s => <option key={s}>{s}</option>)}</select></label>
      <label><span>Område</span><select value={region} onChange={e => { setRegion(e.target.value); setLimit(30); }}><option value="">Hele Norge</option>{regions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
      {subscriber ? <label className={styles.savedFilter}><input type="checkbox" checked={savedOnly} onChange={e => setSavedOnly(e.target.checked)} /> Mine lagrede</label> : <a href="#tilgang" className={styles.access}>Få tilgang <ChevronRight size={15} /></a>}
    </div>
    <div className={styles.workspace}>
      <article className={styles.detail} id="explorer-detail" aria-live="polite">
        {selected ? <>
          <div className={styles.stage}>{selected.stageLabel}{subscriber && now !== null && selected.published && Date.parse(selected.published) <= now && now - Date.parse(selected.published) < 7 * 86400000 ? <span>Nylig kunngjort</span> : null}</div>
          <h2>{selected.title}</h2>
          {!subscriber ? <p className={styles.muted}>Prosjektnavn og fullstendige detaljer er for abonnenter.</p> : null}
          <div className={styles.amount}><span>{subscriber ? "Oppgitt verdi" : "Verdiintervall"}</span><strong>{selected.value}</strong></div>
          <Facts p={selected} subscriber={subscriber} />
          {subscriber ? <>
            <div className={styles.timeline} aria-label="Bekreftet fase"><span>Prosjektfase</span><strong>{selected.stageLabel}</strong></div>
            {selected.description ? <section className={styles.description}><h3>Om prosjektet</h3><p>{selected.description}</p></section> : null}
            {selected.documents ? <a className={styles.document} href={selected.documents} target="_blank" rel="noopener noreferrer">Se konkurransegrunnlag <ChevronRight size={16} /></a> : <p className={styles.muted}>Konkurransegrunnlag er ikke tilgjengelig for dette prosjektet.</p>}
            <div className={styles.tools}>
              <button type="button" onClick={save} aria-pressed={saved.includes(selected.id)}><Bookmark size={15} />{saved.includes(selected.id) ? "Lagret" : "Lagre"}</button>
              <button type="button" onClick={toggleCompare} disabled={compare.length >= 3 && !compare.includes(selected.id)} aria-pressed={compare.includes(selected.id)}><Scale size={15} />{compare.includes(selected.id) ? "Valgt" : "Sammenlign"}</button>
              {compared.length > 0 ? <button type="button" onClick={() => setComparison(true)}>Vis ({compared.length}/3)</button> : null}
            </div>
            <p className={styles.fine}>Lagrede prosjekter huskes i denne nettleseren. Sammenlign inntil tre.</p>
            {related.length ? <section className={styles.related}><h3>Flere prosjekter i samme område</h3>{related.map(p => <button key={p.id} type="button" onClick={() => pick(p.id)}>{p.title}<ChevronRight size={14} /></button>)}</section> : null}
          </> : <div className={styles.lock}><LockKeyhole size={18} /><div><h3>Hele bildet, med abonnement</h3><p>Prosjektnavn, byggherre, entreprenør, nøyaktig verdi, frister og dokumenter.</p><a href="#tilgang">Se detaljer med abonnement <ChevronRight size={14} /></a><a href="#logg-inn">Har du tilgang? Logg inn</a></div></div>}
        </> : <div className={styles.empty}><h2>{loading ? "Henter prosjekter ..." : failed ? "Prosjektene kunne ikke lastes" : "Ingen prosjekter i utvalget"}</h2><p>{failed ? "Prøv å laste siden på nytt." : "Velg et annet område eller en annen fase."}</p></div>}
      </article>
      <div className={styles.mapPanel}>
        {showMap ? <Terrain projects={visible} selected={selected} onSelect={pick} /> : <div className={styles.mapOff}><MapPinned size={30} /><p>Kartet er skjult. Alle prosjektdetaljer er tilgjengelige.</p></div>}
        <button type="button" className={styles.mapToggle} onClick={() => setShowMap(v => !v)}>{showMap ? "Skjul kart" : "Vis 3D-kart"}</button>
      </div>
    </div>
    <div className={styles.listHead}><h2>{visible.length.toLocaleString("nb-NO")} prosjekter</h2>{selected && visible.length > 1 ? <button type="button" onClick={() => pick(visible[(visible.indexOf(selected) + 1) % visible.length].id)}>Neste prosjekt <ChevronRight size={16} /></button> : null}</div>
    <ul className={styles.projectList}>{visible.slice(0, limit).map(p => <li key={p.id}><button type="button" className={p.id === selected?.id ? styles.selected : ""} onClick={() => pick(p.id)} aria-pressed={p.id === selected?.id}><span>{p.place} · {p.stageLabel}</span><strong>{p.title}</strong><b>{p.value}</b>{subscriber && p.date ? <small>{p.date}</small> : null}</button></li>)}</ul>
    {visible.length > limit ? <button type="button" className={styles.more} onClick={() => setLimit(v => v + 30)}>Vis flere ({visible.length - limit})</button> : null}
    {comparison && subscriber ? <PortalModal title="Sammenlign prosjekter" onClose={() => setComparison(false)}><div className={styles.comparison}>{compared.map(p => <article key={p.id}><h3>{p.title}</h3><strong>{p.value}</strong><Facts p={p} subscriber /></article>)}</div></PortalModal> : null}
  </section>;
}
