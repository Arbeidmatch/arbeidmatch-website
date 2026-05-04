/** Desktop mega-menu links (SEO landings); keep in sync with MobileDrawerContent "More" industry/city entries. */
export const NAV_INDUSTRY_LINKS = [
  { href: "/bemanning-bygg-anlegg", label: "Construction" },
  { href: "/bemanning-industri", label: "Industry" },
  { href: "/bemanning-logistikk", label: "Logistics" },
  { href: "/bemanning-renhold", label: "Cleaning" },
  { href: "/bemanning-horeca", label: "Hospitality" },
  { href: "/welding-specialists", label: "Welding Specialists" },
] as const;

export const NAV_CITY_LINKS = [
  { href: "/bemanningsbyrå-trondheim", label: "Trondheim" },
  { href: "/bemanningsbyrå-bergen", label: "Bergen" },
  { href: "/bemanningsbyrå-stavanger", label: "Stavanger" },
  { href: "/bemanningsbyrå-kristiansand", label: "Kristiansand" },
] as const;
