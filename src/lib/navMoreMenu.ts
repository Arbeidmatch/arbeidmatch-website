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

export const MORE_RESOURCES = [
  { href: "/for-staffing-agencies", label: "For staffing agencies" },
  { href: "/dsb-support", label: "DSB Authorization Guide" },
  { href: "/premium", label: "Premium Guides" },
  { href: "/about", label: "About us" },
  { href: "/partners", label: "Partners" },
  { href: "/blog", label: "Blog" },
  { href: "/recruiter-network", label: "Partner Program (Recruiter Network)" },
  { href: "/contact", label: "Contact" },
] as const;

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
  ...MORE_RESOURCES.map((i) => i.href),
  ELECTRICIANS.href,
  WELDING.href,
];
