export type AmAudience = "employer" | "candidate" | "browsing";

/** Desktop "More" dropdown: max 6 items; DSB + Premium hidden for employer audience. */
const MORE_MENU_DEFS: readonly {
  href: string;
  label: string;
  show: (audience: AmAudience | null) => boolean;
}[] = [
  { href: "/bemanning-bygg-anlegg", label: "Construction", show: () => true },
  { href: "/bemanning-industri", label: "Industry", show: () => true },
  { href: "/dsb-support", label: "DSB Authorization Guide", show: (a) => a !== "employer" },
  { href: "/premium", label: "Premium Guides", show: (a) => a !== "employer" },
  { href: "/blog", label: "Blog", show: () => true },
  { href: "/about", label: "About us", show: () => true },
];

export function moreMenuLinksForAudience(audience: AmAudience | null): { href: string; label: string }[] {
  return MORE_MENU_DEFS.filter((d) => d.show(audience)).map(({ href, label }) => ({ href, label }));
}

export const MORE_ALL_HREFS: string[] = MORE_MENU_DEFS.map((d) => d.href);
