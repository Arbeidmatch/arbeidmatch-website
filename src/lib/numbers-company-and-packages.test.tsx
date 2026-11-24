import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NumbersProvider } from "@/components/NumbersProvider";
import type { SiteNumbers } from "@/lib/numbers";
import { addonChoices, addonsOfferedFor, packageGives, type PackageContents } from "@/lib/job-ads/types";

/**
 * ORDER 302, steps 4 and 6: what an advert package contains comes from the ATS
 * with the quotes, and the company facts from the RecOS registry. Every fake
 * here is a value no page has shown, so finding it proves it was read.
 */

const FAKE: SiteNumbers = { company_org_number: "123 456 789", company_street_address: "Prøvegata 9" };

const state = vi.hoisted(() => ({ numbers: {} as Record<string, unknown> }));
vi.mock("@/lib/numbers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/numbers")>()),
  getSiteNumbers: async () => state.numbers,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: () => {} }), useSearchParams: () => new URLSearchParams() }));

const html = (el: ReactElement, numbers: SiteNumbers) => renderToStaticMarkup(createElement(NumbersProvider, { numbers }, el));

const facts = (over: Partial<PackageContents["packages"]["basis"]>) => ({
  includedAddons: [],
  translations: 0,
  anonymousProfiles: 0,
  facebook: false,
  chatAssistant: false,
  ranked: false,
  ...over,
});

/** What the ATS answers today (pricing.ts adPackageContents with the registry's 42 and 30). */
const TODAY: PackageContents = {
  maxDays: 42,
  extendDays: 30,
  featuredDays: 7,
  packages: {
    basis: facts({}),
    synlig: facts({ includedAddons: ["featured_7d", "translation"], translations: 1, facebook: true, chatAssistant: true }),
    maks: facts({ includedAddons: ["featured_7d", "translation", "extend_30d"], translations: 2, anonymousProfiles: 5, facebook: true, chatAssistant: true, ranked: true }),
  },
};

describe("advert packages: the ATS says what each holds", () => {
  it("today's answer reads exactly as the cards did", () => {
    expect(packageGives(TODAY, "basis")).toEqual([
      "Annonsen på arbeidmatch.no til søknadsfristen, høyst 42 dager",
      "Kontrollert mot annonsereglene",
      "Søkerne rett inn i deres egen RecOS-konto",
    ]);
    expect(packageGives(TODAY, "synlig")).toEqual([
      "Alt i Basis",
      "Innlegg på vår Facebook-side",
      "Fremhevet på forsiden i 7 dager",
      "Anbefalt av vår chat-assistent",
      "Oversatt til ett språk (rumensk, polsk eller litauisk)",
    ]);
    expect(packageGives(TODAY, "maks")).toEqual([
      "Alt i Synlig",
      "Opptil fem anonyme kandidatprofiler fra vår database den første uken",
      "Søkerne sortert etter hvor godt de passer",
      "Oversatt til to språk",
      "30 dager ekstra",
    ]);
    expect(addonChoices(TODAY).map((a) => a.label)).toEqual([
      "Fremhevet på forsiden i 7 dager",
      "30 dager ekstra",
      "Oversettelse til ett språk",
      "Vi skriver annonsen for dere",
      "Merket «Haster»",
    ]);
    expect(addonsOfferedFor(TODAY, "synlig")).toEqual(["extend_30d", "written_by_us", "urgent_label"]);
  });

  it("a changed answer changes the cards", () => {
    const changed: PackageContents = {
      maxDays: 39,
      extendDays: 21,
      featuredDays: 4,
      packages: { ...TODAY.packages, maks: { ...TODAY.packages.maks, anonymousProfiles: 6, translations: 3, includedAddons: ["featured_7d", "translation"] } },
    };
    expect(packageGives(changed, "basis")[0]).toContain("høyst 39 dager");
    expect(packageGives(changed, "synlig")).toContain("Fremhevet på forsiden i 4 dager");
    expect(packageGives(changed, "maks")).toContain("Opptil seks anonyme kandidatprofiler fra vår database den første uken");
    expect(packageGives(changed, "maks")).toContain("Oversatt til tre språk");
    expect(packageGives(changed, "maks")).not.toContain("21 dager ekstra");
    expect(addonsOfferedFor(changed, "maks")).toContain("extend_30d");
    expect(addonChoices(changed).map((a) => a.label)).toContain("21 dager ekstra");
  });

  it("with no answer the cards carry no lines and the day-counted add-ons are not offered", () => {
    expect(packageGives(null, "maks")).toEqual([]);
    expect(addonChoices(null).map((a) => a.id)).toEqual(["translation", "written_by_us", "urgent_label"]);
  });
});

describe("company facts from RecOS", () => {
  it("the site footer prints the org number and the street", async () => {
    const { default: SiteFooter } = await import("@/components/site/SiteFooter");
    const out = html(createElement(SiteFooter), FAKE);
    expect(out).toContain("Org.nr 123 456 789 MVA");
    expect(out).toContain("Prøvegata 9, 7056 Ranheim");
  });

  it("the Flislegger pages print them", async () => {
    state.numbers = FAKE;
    const { default: Page } = await import("@/app/flislegger/page");
    expect(renderToStaticMarkup(await Page())).toContain("Org.nr. 123 456 789 MVA · Prøvegata 9, 7056 Ranheim, Trondheim");
    const { default: Privacy } = await import("@/app/flislegger/personvern/page");
    const privacy = renderToStaticMarkup(await Privacy());
    expect(privacy).toContain("ArbeidMatch Norge AS, org.nr. 123 456 789 MVA, er behandlingsansvarlig");
    expect(privacy).toContain("Adresse: Prøvegata 9, 7056 Ranheim, Trondheim, Norge.");
  });

  it("the search-engine records carry them", async () => {
    state.numbers = FAKE;
    const { default: AboutJsonLd } = await import("@/components/about/AboutJsonLd");
    expect(renderToStaticMarkup(await AboutJsonLd())).toContain('"streetAddress":"Prøvegata 9"');
    const { OrganizationJsonLd } = await import("@/components/seo/JobPostingJsonLd");
    const org = renderToStaticMarkup(createElement(OrganizationJsonLd, { openJobs: 1, numbers: FAKE }));
    expect(org).toContain('"value":"123456789"');
    expect(org).toContain('"streetAddress":"Prøvegata 9"');
  });

  it("with no answer at all, each line reads without the fact", async () => {
    state.numbers = {};
    const { default: SiteFooter } = await import("@/components/site/SiteFooter");
    const footer = html(createElement(SiteFooter), {});
    expect(footer).toContain("© 2026 ArbeidMatch Norge AS · ");
    expect(footer).not.toContain("Org.nr");
    const { default: Privacy } = await import("@/app/flislegger/personvern/page");
    const privacy = renderToStaticMarkup(await Privacy());
    expect(privacy).toContain("ArbeidMatch Norge AS er behandlingsansvarlig");
    expect(privacy).not.toContain("Adresse:");
    const { default: AboutJsonLd } = await import("@/components/about/AboutJsonLd");
    expect(renderToStaticMarkup(await AboutJsonLd())).not.toContain("streetAddress");
  });
});
