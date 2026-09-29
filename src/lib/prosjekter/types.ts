/** The public overview's shapes, as the ATS answers /api/public/projects-overview. */

export type OverviewStage = "planned" | "tender" | "closed" | "awarded";

export type OverviewProject = {
  project_no: number | null;
  stage: OverviewStage;
  stage_label: string;
  title: string;
  buyer_name: string | null;
  place: string;
  value_label: string | null;
  date_label: string | null;
  domains: string[];
  winners: string[];
};

export type Overview = {
  counts: { planned: number; tender: number; awarded: number };
  total: number;
  page: number;
  page_size: number;
  regions: { code: string; label: string }[];
  domains: { key: string; label: string }[];
  projects: OverviewProject[];
};

export type OverviewFilters = {
  stage: "" | "planned" | "tender" | "awarded";
  region: string;
  domain: string;
  q: string;
  page: number;
};

export function isOverview(value: unknown): value is Overview {
  const v = value as Partial<Overview> | null;
  return Boolean(v && typeof v === "object" && v.counts && Array.isArray(v.projects));
}

export function filtersFrom(params: Record<string, string | string[] | undefined>): OverviewFilters {
  const one = (k: string) => {
    const v = params[k];
    return String(Array.isArray(v) ? v[0] ?? "" : v ?? "").trim();
  };
  const stage = one("stage");
  const page = Math.floor(Number(one("page")));
  return {
    stage: stage === "planned" || stage === "tender" || stage === "awarded" ? stage : "",
    // Only the shapes the ATS knows; anything else is dropped rather than forwarded.
    region: /^NO[0-9A-Z]{3}$/.test(one("region")) ? one("region") : "",
    domain: /^[a-z]{2,20}$/.test(one("domain")) ? one("domain") : "",
    q: one("q").slice(0, 80),
    page: Number.isFinite(page) && page > 1 ? Math.min(page, 500) : 1,
  };
}

/** The query string for a set of filters, without empty values and without page 1. */
export function filtersQuery(f: OverviewFilters): string {
  const out = new URLSearchParams();
  if (f.stage) out.set("stage", f.stage);
  if (f.region) out.set("region", f.region);
  if (f.domain) out.set("domain", f.domain);
  if (f.q) out.set("q", f.q);
  if (f.page > 1) out.set("page", String(f.page));
  const s = out.toString();
  return s ? `?${s}` : "";
}
