import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { pageAction } from "./siteNav";

/**
 * ORDER 295, stage 6b: the industry and city pages take the site template
 * through SeoLanding, keep their own copy, and each declares a canonical with
 * hreflang; their header offers the request pop-up.
 */
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), "utf8");

const PAGES = [
  ["src/app/bemanning-industri/page.tsx", "Bemanning industri for linjestopp som ikke kan vente"],
  ["src/app/bemanning-logistikk/page.tsx", "Bemanning logistikk med folk som behersker terminaltempo"],
  ["src/app/bemanning-horeca/page.tsx", "Bemanning HoReCa når gjesteøkningen kommer over natta"],
  ["src/app/bemanning-renhold/page.tsx", "Bemanning renhold med fokus på kvalitet og trygghet"],
  ["src/components/seo-pages/BemanningByggAnleggNb.tsx", "Bemanning til bygg og anlegg med kontrollert arbeidskraft fra EU/EØS"],
  ["src/app/bemanningsbyrå-bergen/page.tsx", "Bemanning i Bergen, der maritim virksomhet og byutvikling møtes"],
  ["src/app/bemanningsbyrå-kristiansand/page.tsx", "Bemanning i Kristiansand innen industri, logistikk og byutvikling"],
  ["src/app/bemanningsbyrå-stavanger/page.tsx", "Bemanning i Stavanger, der sikkerhetskrav og prosjekttempo må gå hånd i hånd"],
  ["src/app/bemanningsbyrå-trondheim/page.tsx", "Bemanning i Trondheim til prosjekter innen teknologi, bygg og drift"],
] as const;

describe("industry and city pages on the site template", () => {
  it("render through SeoLanding with their own heading and no old layout", () => {
    for (const [file, title] of PAGES) {
      const src = read(file);
      expect(src, file).toContain("<SeoLanding");
      expect(src, file).toContain(`title="${title}"`);
      expect(src, file).not.toContain("SeeAlsoSection");
      expect(src, file).not.toContain("am-h1");
    }
  });

  it("declare a canonical with hreflang", () => {
    for (const [file] of PAGES) {
      const route = file.includes("seo-pages") ? "src/app/bemanning-bygg-anlegg/page.tsx" : file;
      expect(read(route), route).toMatch(/languages: \{ nb: [^,]+, "x-default": /);
    }
  });

  it("lays the page out with one h1 in Norwegian and the request pop-up as its first action", () => {
    const landing = read("src/components/site/seo/SeoLanding.tsx");
    expect(landing.match(/<h1[ >]/g)).toHaveLength(1);
    expect(landing).toContain('className="ams page" lang="nb"');
    expect(landing).toMatch(/className="btn gold" href=\{SITE_PATHS\.request\} data-rask-foresporsel/);
  });

  it("puts staffing agencies, welding and electricians on the template with one h1, canonical and hreflang", () => {
    for (const [component, route, lang] of [
      ["src/components/staffing-agencies/StaffingAgenciesPage.tsx", "src/app/for-staffing-agencies/page.tsx", "nb"],
      ["src/components/welding/WeldingSpecialistsPage.tsx", "src/app/welding-specialists/page.tsx", "en"],
      ["src/components/candidates/ElectriciansNorwayPage.tsx", "src/app/electricians-norway/page.tsx", "en"],
    ] as const) {
      const src = read(component);
      expect(src, component).toContain(`className="ams page" lang="${lang}"`);
      expect(src.match(/<h1[ >]/g), component).toHaveLength(1);
      expect(src, component).not.toContain('"use client"');
      expect(read(route), route).toMatch(new RegExp(`languages: \\{ ${lang}: `));
    }
    expect(pageAction("/for-staffing-agencies")).toEqual({ kind: "link", href: "/contact", label: "Ta kontakt" });
    expect(pageAction("/welding-specialists")).toMatchObject({ href: "/request", rask: true });
    expect(pageAction("/electricians-norway")).toMatchObject({ href: "/jobs" });
  });

  it("offers the request pop-up in the header, the city addresses encoded or not", () => {
    const want = { kind: "link", href: "/request", label: "Be om kandidater", rask: true };
    expect(pageAction("/bemanning-logistikk")).toEqual(want);
    expect(pageAction("/bemanningsbyrå-bergen")).toEqual(want);
    expect(pageAction("/bemanningsbyr%C3%A5-bergen")).toEqual(want);
  });
});
