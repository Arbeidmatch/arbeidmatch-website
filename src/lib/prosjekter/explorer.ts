import { domainsNo, cleanDescription, keyDateNo, placeNo, stageNo, type AlertProject } from "./format";
import { COUNTIES, placeProjects, STAGE_LABEL, valueBand } from "./map";
import { domainChoices } from "./format";
import type { Overview } from "./types";

export type ExplorerProject = {
  id: string;
  title: string;
  stage: string;
  stageLabel: string;
  region: string;
  place: string;
  domains: string[];
  value: string;
  date: string | null;
  published: string | null;
  buyer: string | null;
  winners: string[];
  description: string | null;
  documents: string | null;
  coordinates: [number, number] | null;
  locationLabel: string;
};

// Public responses are allowlisted before serialization, including the Old view.
// A band representative retains existing map sizing without exposing exact values.
export function publicValue(value: number | null): number | null {
  if (!value || value <= 0) return null;
  return value < 1e7 ? 5e6 : value < 1e8 ? 5e7 : value < 5e8 ? 2e8 : value < 1e9 ? 7e8 : 1e9;
}

export function publicOverview(data: Overview): Overview {
  return {
    counts: data.counts, total: data.total, page: data.page, page_size: data.page_size,
    regions: data.regions, domains: data.domains, county_counts: data.county_counts,
    projects: data.projects.map(p => ({
      project_no: p.project_no, stage: p.stage, stage_label: p.stage_label,
      title: "Prosjektdetaljer for abonnenter", place: "", value_label: null, date_label: null, domains: p.domains,
    })),
    ...(Array.isArray(data.map) ? { map: placeProjects(data.map).map(p => ({
      no: p.no, st: p.st, lat: Math.round(p.lat * 10) / 10, lon: Math.round(p.lon * 10) / 10,
      v: publicValue(p.v), r: p.r, d: p.d, t: "Prosjektdetaljer for abonnenter", c: null, k: null,
    })) } : {}),
  };
}

const labels = new Map(domainChoices().map(d => [String(d.key), d.label]));

export function publicExplorer(data: Overview | null): ExplorerProject[] {
  if (!data) return [];
  if (!Array.isArray(data.map)) return data.projects.map((p, i) => ({
    id: String(p.project_no ?? `public-${i}`), title: p.domains.map(d => labels.get(d) ?? d).join(", ") || "Bygg- og anleggsprosjekt",
    stage: p.stage, stageLabel: p.stage_label, region: "", place: "Norge", domains: p.domains.map(d => labels.get(d) ?? d),
    value: "Verdi ikke oppgitt", date: null, published: null, buyer: null, winners: [], description: null, documents: null,
    coordinates: null, locationLabel: "Kartposisjon ikke tilgjengelig",
  }));
  return placeProjects(data.map).map(p => ({
    id: String(p.no), title: labels.get(p.d[0]) ?? "Bygg- og anleggsprosjekt", stage: p.st,
    stageLabel: STAGE_LABEL[p.st], region: p.r, place: COUNTIES[p.r]?.n ?? "Norge",
    domains: p.d.map(d => labels.get(d) ?? d), value: valueBand(p.v) ?? "Verdi ikke oppgitt",
    date: null, published: null, buyer: null, winners: [], description: null, documents: null,
    coordinates: [p.lon, p.lat], locationLabel: "Omtrentlig område",
  }));
}

export function safeDocumentLink(value: string | null): string | null {
  try { const url = new URL(value ?? ""); return url.protocol === "https:" ? url.href : null; } catch { return null; }
}

export function subscriberExplorer(projects: AlertProject[], overview: Overview | null): ExplorerProject[] {
  const locations = new Map(placeProjects(overview?.map).map(p => [p.no, p]));
  return projects.map(p => {
    const point = p.project_no === null ? undefined : locations.get(p.project_no);
    const amount = p.awarded_value_nok ?? p.estimated_value_nok;
    return {
      id: p.id, title: p.title, stage: p.stage, stageLabel: stageNo(p), region: p.regions[0] ?? "",
      place: placeNo(p) || "Sted ikke oppgitt", domains: domainsNo(p),
      value: amount && amount > 0 ? `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 2 }).format(amount)} kr` : "Verdi ikke oppgitt",
      date: keyDateNo(p), published: p.published_on, buyer: p.buyer_name, winners: p.winners.map(w => w.name),
      description: cleanDescription(p.description, 12000), documents: safeDocumentLink(p.documents_url),
      coordinates: point ? [point.lon, point.lat] : null,
      locationLabel: point ? "Omtrentlig område, ikke nøyaktig byggeplass" : "Kartposisjon ikke tilgjengelig",
    };
  });
}

export function nearbyProjects(selected: ExplorerProject, projects: ExplorerProject[]): ExplorerProject[] {
  return projects.filter(p => p.id !== selected.id && selected.region && p.region === selected.region).slice(0, 3);
}
