import { domainsOf } from "./domains";
import type { AlertProject } from "./format";
import { COUNTIES, placeProjects, type MapStage, type PlacedProject } from "./map";
import type { Overview } from "./types";

/**
 * A client's own projects on the classic map (his ask, 9 November 2026: the
 * clients get what he sees on /prosjekter, with the data of their
 * subscription). Pure: the client's projects, as the ATS sends them for the
 * token page, become the dots and rows the portal draws. A coordinate comes
 * from the open overview's map by project number; a project the map does not
 * place sits on its county's centre, marked approximate; one with neither a
 * place nor a county is left off the map but kept in `details` for the count.
 */

export type SubscriberMap = {
  placed: PlacedProject[];
  /** The full project behind each dot, by the dot's number. */
  details: Map<number, AlertProject>;
  /** Projects placed on their county's centre, not where they are. */
  approximate: Set<number>;
  /** Projects with no county and no coordinates: counted, not drawn. */
  unplaced: number;
};

/** The map's stage of a client's project: an open tender past its deadline waits for award; a cancelled one has no dot. */
export function mapStageOf(p: Pick<AlertProject, "stage" | "deadline_at">, now = Date.now()): MapStage | null {
  if (p.stage === "cancelled") return null;
  if (p.stage === "tender" && p.deadline_at && Date.parse(p.deadline_at) < now) return "closed";
  return p.stage;
}

/** The dot's number: the project number, or a negative index for a project without one. */
export function dotNumber(p: Pick<AlertProject, "project_no">, index: number): number {
  return p.project_no !== null && Number.isFinite(p.project_no) ? p.project_no : -(index + 1);
}

export function subscriberMap(projects: readonly AlertProject[], overview: Overview | null, now = Date.now()): SubscriberMap {
  const located = new Map(placeProjects(overview?.map).map((p) => [p.no, p]));
  const placed: PlacedProject[] = [];
  const details = new Map<number, AlertProject>();
  const approximate = new Set<number>();
  let unplaced = 0;
  projects.forEach((p, i) => {
    const st = mapStageOf(p, now);
    if (!st) return;
    const no = dotNumber(p, i);
    const point = p.project_no !== null ? located.get(p.project_no) : undefined;
    const county = p.regions.find((code) => COUNTIES[code]) ?? point?.r ?? p.regions[0] ?? "";
    const value = p.awarded_value_nok ?? p.estimated_value_nok;
    const base = {
      no,
      st,
      v: value && value > 0 ? value : null,
      r: county,
      d: domainsOf(p.cpv_codes) as string[],
      t: p.title,
      c: p.city,
      k: null,
    };
    if (point) {
      placed.push({ ...base, lat: point.lat, lon: point.lon, x: point.x, y: point.y });
    } else if (COUNTIES[county]) {
      placed.push({ ...base, lat: 0, lon: 0, x: COUNTIES[county].cx, y: COUNTIES[county].cy });
      approximate.add(no);
    } else {
      unplaced++;
      return;
    }
    details.set(no, p);
  });
  return { placed, details, approximate, unplaced };
}
