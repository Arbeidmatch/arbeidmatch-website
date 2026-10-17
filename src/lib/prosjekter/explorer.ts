import { domainsNo, cleanDescription, keyDateNo, placeNo, stageNo, type AlertProject } from "./format";
import { COUNTIES, placeProjects, STAGE_LABEL, valueBand } from "./map";
import { domainChoices } from "./format";
import type { Overview } from "./types";
import { NORWAY_REGIONS } from "./regions";

export type ExplorerProject = {
  id: string;
  title: string;
  stage: string;
  stageLabel: string;
  region: string;
  regions?: string[];
  place: string;
  domains: string[];
  value: string;
  mapValue: number | null;
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

// PROJ-SEC (17 October 2026): the public payload carries no list and the
// unfiltered total; the page lists projects from the catalog and the map.
export function publicOverview(data: Overview): Overview {
  const total = Array.isArray(data.catalog) ? data.catalog.length
    : data.counts.planned + data.counts.tender + data.counts.awarded;
  return {
    counts: data.counts, total, page: data.page, page_size: data.page_size,
    regions: data.regions, domains: data.domains, county_counts: data.county_counts,
    ...(Array.isArray(data.catalog) ? { catalog: data.catalog.filter(p =>
      Number.isFinite(p.no) && ["planned", "tender", "awarded"].includes(p.st)
    ).map(p => ({ no: p.no, st: p.st,
      rs: Array.isArray(p.rs) ? p.rs.filter(r => typeof r === "string" && r in NORWAY_REGIONS) : [],
      d: Array.isArray(p.d) ? p.d.filter(d => labels.has(d)) : [], v: publicValue(p.v ?? p.band ?? null),
    })) } : {}),
    projects: [],
    ...(Array.isArray(data.map) ? { map: placeProjects(data.map).map(p => ({
      // The source is already a town/municipality reference, not a site address.
      // Further rounding can move that reference several kilometres into a fjord.
      no: p.no, st: p.st, lat: p.lat, lon: p.lon,
      v: publicValue(p.v), r: p.r, d: p.d, t: "Prosjektdetaljer for abonnenter", c: null, k: null,
    })) } : {}),
  };
}

const labels = new Map(domainChoices().map(d => [String(d.key), d.label]));

export function publicExplorer(data: Overview | null): ExplorerProject[] {
  if (!data) return [];
  if (Array.isArray(data.catalog)) {
    const locations = new Map(placeProjects(data.map).map(p => [p.no, p]));
    return data.catalog.map(p => {
      const point = locations.get(p.no);
      const regions = p.rs.filter(r => r in NORWAY_REGIONS);
      const band = p.v ?? p.band ?? null;
      return {
        id: String(p.no), title: labels.get(p.d[0]) ?? "Bygg- og anleggsprosjekt",
        stage: p.st, stageLabel: STAGE_LABEL[p.st], region: regions[0] ?? "", regions,
        place: regions.map(r => NORWAY_REGIONS[r]).join(", ") || "Område ikke oppgitt",
        domains: p.d.map(d => labels.get(d) ?? d), value: valueBand(band) ?? "Verdi ikke oppgitt", mapValue: band,
        date: null, published: null, buyer: null, winners: [], description: null, documents: null,
        coordinates: point ? [point.lon, point.lat] as [number, number] : null,
        locationLabel: point ? "Stedsreferanse, ikke bekreftet byggeplass" : "Kartposisjon ikke tilgjengelig",
      };
    });
  }
  if (!Array.isArray(data.map)) return data.projects.map((p, i) => ({
    id: String(p.project_no ?? `public-${i}`), title: p.domains.map(d => labels.get(d) ?? d).join(", ") || "Bygg- og anleggsprosjekt",
    stage: p.stage, stageLabel: p.stage_label, region: "", place: "Norge", domains: p.domains.map(d => labels.get(d) ?? d),
    value: "Verdi ikke oppgitt", mapValue: null, date: null, published: null, buyer: null, winners: [], description: null, documents: null,
    coordinates: null, locationLabel: "Kartposisjon ikke tilgjengelig",
  }));
  return placeProjects(data.map).map(p => ({
    id: String(p.no), title: labels.get(p.d[0]) ?? "Bygg- og anleggsprosjekt", stage: p.st,
    stageLabel: STAGE_LABEL[p.st], region: p.r, place: COUNTIES[p.r]?.n ?? "Norge",
    domains: p.d.map(d => labels.get(d) ?? d), value: valueBand(p.v) ?? "Verdi ikke oppgitt", mapValue: p.v,
    date: null, published: null, buyer: null, winners: [], description: null, documents: null,
    coordinates: [p.lon, p.lat], locationLabel: "Stedsreferanse, ikke bekreftet byggeplass",
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
      mapValue: amount,
      date: keyDateNo(p), published: p.published_on, buyer: p.buyer_name, winners: p.winners.map(w => w.name),
      description: cleanDescription(p.description, 12000), documents: safeDocumentLink(p.documents_url),
      coordinates: point ? [point.lon, point.lat] : null,
      locationLabel: point ? "Stedsreferanse, ikke bekreftet byggeplass" : "Kartposisjon ikke tilgjengelig",
    };
  });
}

export function nearbyProjects(selected: ExplorerProject, projects: ExplorerProject[]): ExplorerProject[] {
  return projects.filter(p => p.id !== selected.id && selected.region && p.region === selected.region).slice(0, 3);
}
