export type AmAudience = "employer" | "candidate" | "browsing";

export const MORE_SERVICES = [
  { href: "/bemanning-bygg-anlegg", label: "Construction" },
  { href: "/bemanning-logistikk", label: "Logistics" },
  { href: "/bemanning-industri", label: "Industry" },
  { href: "/bemanning-renhold", label: "Cleaning" },
  { href: "/bemanning-horeca", label: "Hospitality" },
  { href: "/bemanning-helse", label: "Healthcare" },
] as const;

export const MORE_LOCATIONS = [
  { href: "/bemanningsbyrå-trondheim", label: "Trondheim" },
  { href: "/bemanningsbyrå-bergen", label: "Bergen" },
  { href: "/bemanningsbyrå-stavanger", label: "Stavanger" },
  { href: "/bemanningsbyrå-kristiansand", label: "Kristiansand" },
] as const;

/** Order and labels for the More menu Resources column; visibility per audience in `resourcesForAudience`. */
const RESOURCE_LINK_DEFS: readonly {
  href: string;
  label: string;
  show: (audience: AmAudience | null) => boolean;
}[] = [
  { href: "/for-staffing-agencies", label: "Become a partner agency", show: (a) => a !== "candidate" },
  { href: "/dsb-support", label: "DSB Authorization Guide", show: (a) => a !== "employer" },
  { href: "/outside-eu-eea", label: "Non-EU Workers", show: (a) => a !== "employer" },
  { href: "/premium", label: "Premium Guides", show: (a) => a !== "employer" },
  { href: "/about", label: "About us", show: () => true },
  { href: "/partners", label: "Our partner agencies", show: (a) => a !== "candidate" },
  { href: "/blog", label: "Blog", show: () => true },
  { href: "/recruiter-network", label: "Recruiter network", show: (a) => a === null || a === "browsing" },
  { href: "/contact", label: "Contact", show: () => true },
];

/**
 * Resource links visible for the given audience. `null` matches browsing for CLS (full set except
 * employer-only / candidate-only rules: recruiter stays visible for null and browsing only).
 */
export function resourcesForAudience(audience: AmAudience | null): { href: string; label: string }[] {
  return RESOURCE_LINK_DEFS.filter((d) => d.show(audience)).map(({ href, label }) => ({ href, label }));
}

const ELECTRICIANS = { href: "/electricians-norway", label: "Electricians in Norway" } as const;
const WELDING = { href: "/welding-specialists", label: "Welding Specialists" } as const;

export function tradesForAudience(audience: AmAudience | null): { href: string; label: string }[] {
  if (audience === "employer") return [WELDING];
  if (audience === "candidate") return [ELECTRICIANS];
  return [ELECTRICIANS, WELDING];
}

export const MORE_ALL_HREFS: string[] = [
  ...MORE_SERVICES.map((i) => i.href),
  ...MORE_LOCATIONS.map((i) => i.href),
  ...RESOURCE_LINK_DEFS.map((d) => d.href),
  ELECTRICIANS.href,
  WELDING.href,
];
