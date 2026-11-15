import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { GUIDE_DISCLAIMER, PREMIUM_ARTICLES } from "@/lib/premium/articles";
import { PREMIUM_ARTICLE_SLUGS } from "@/lib/premium/articleSlugs";

import { FAQ_LINKS } from "./candidates/CandidateFaq";
import { guideBody, officialSourceHref } from "./candidates/LifeInNorway";
import { SITE_PATHS, activeCandidateTab, guidePath, hidesFooter, isCandidatePath, pageAction, siteLang } from "./siteNav";

/**
 * ORDER 295, stage 5: Life in Norway. The five /premium articles are the
 * guides, at one address for candidates, and every old address leads to its
 * guide; the pages that left the site leave the sitemap too.
 */

vi.mock("@/lib/jobs-facets", () => ({ listFacets: async () => [], getBoard: async () => [], facetPath: () => "/jobs" }));

describe("the Life in Norway pages", () => {
  const list = SITE_PATHS.lifeInNorway;
  const guide = guidePath("tax-registration-norway-foreign-workers");

  it("live under the candidate pages, in English, with the tab row and the footer", () => {
    expect(list).toBe("/for-candidates/life-in-norway");
    for (const p of [list, guide]) {
      expect(siteLang(p), p).toBe("en");
      expect(isCandidatePath(p), p).toBe(true);
      expect(hidesFooter(p), p).toBe(false);
      expect(activeCandidateTab(p), p).toBe(list);
    }
  });

  it("offer the job alerts in a guide's header and nothing in the list's, as in the mockup", () => {
    expect(pageAction(list)).toBeNull();
    expect(pageAction(guide)).toEqual({ kind: "sheet", sheet: "alerts", label: "Job alerts" });
  });

  it("send the D-number answer to a guide that exists", () => {
    const link = FAQ_LINKS["Do I need a D-number?"];
    expect(link && "href" in link ? link.href : "").toBe(guide);
  });
});

describe("the guides are the five articles, with their sources and dates", () => {
  it("publish every article and only those", () => {
    expect(PREMIUM_ARTICLES.map((a) => a.slug)).toEqual([...PREMIUM_ARTICLE_SLUGS]);
    for (const a of PREMIUM_ARTICLES) {
      expect(a.officialSources.length, a.slug).toBeGreaterThan(0);
      expect(a.lastUpdated, a.slug).toMatch(/\d{4}/);
    }
  });

  it("keep every paragraph of the article: the text, the steps, where to check, and the closing note", () => {
    for (const a of PREMIUM_ARTICLES) {
      const paragraphs = a.bodyMarkdown.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      const { blocks, where } = guideBody(a);
      const shown = blocks.reduce((n, b) => n + (b.kind === "p" ? 1 : b.items.length), 0);
      // Everything but the "Where to check" line, which goes in the source box, and the closing note shown under it.
      expect(shown + 2, a.slug).toBe(paragraphs.length);
      expect(where, a.slug).toBeTruthy();
      expect(paragraphs.at(-1), a.slug).toBe(GUIDE_DISCLAIMER);
    }
    const checklist = guideBody(PREMIUM_ARTICLES.find((a) => a.slug === "registering-as-worker-norway-eu-eea-checklist")!);
    const steps = checklist.blocks.find((b) => b.kind === "steps");
    expect(steps && steps.kind === "steps" ? steps.items.map((s) => s.n) : []).toEqual(["01", "02", "03", "04", "05", "06", "07"]);
  });

  it("link each source to the authority's own site", () => {
    expect(officialSourceHref("Skatteetaten.no")).toBe("https://www.skatteetaten.no");
    expect(officialSourceHref("NAV.no")).toBe("https://www.nav.no");
    expect(officialSourceHref("Politiet.no")).toBe("https://www.politiet.no");
    expect(officialSourceHref("Arbeidstilsynet.no")).toBe("https://www.arbeidstilsynet.no");
  });

  it("have no paywall and no buying on the way in", () => {
    const page = readFileSync(join(process.cwd(), "src/components/site/candidates/LifeInNorway.tsx"), "utf8");
    expect(page).not.toMatch(/Paywall|premium\/verify|start-trial|checkout/);
  });
});

describe("the old addresses", () => {
  const redirects = async () => {
    const config = (await import("../../../next.config")).default;
    return (await config.redirects!()) as { source: string; destination: string; permanent: boolean }[];
  };
  const target = (all: { source: string; destination: string; permanent: boolean }[], source: string) => all.find((r) => r.source === source);

  it("lead permanently from each /premium address to its guide, and leave the payment return page alone", async () => {
    const all = await redirects();
    expect(target(all, "/premium")).toMatchObject({ destination: SITE_PATHS.lifeInNorway, permanent: true });
    expect(target(all, "/premium/browse")).toMatchObject({ destination: SITE_PATHS.lifeInNorway, permanent: true });
    expect(target(all, "/premium/article/:slug")).toMatchObject({ destination: `${SITE_PATHS.lifeInNorway}/:slug`, permanent: true });
    expect(all.some((r) => r.source.startsWith("/premium/success"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/app/premium/success/page.tsx"))).toBe(true);
  });

  it("send /blog, /download and /partners to the closest live page, and keep the firms' blog article", async () => {
    const all = await redirects();
    expect(target(all, "/blog")).toMatchObject({ destination: "/for-employers", permanent: true });
    expect(target(all, "/download")).toMatchObject({ destination: "/", permanent: true });
    expect(target(all, "/partners")).toMatchObject({ destination: "/about", permanent: true });
    expect(all.some((r) => r.source.startsWith("/blog/"))).toBe(false);
    expect(existsSync(join(process.cwd(), "src/app/blog/ansette-utenlandske-arbeidere-lovlig/page.tsx"))).toBe(true);
  });

  it("are out of the sitemap, and the guides are in it", async () => {
    const sitemap = (await import("@/app/sitemap")).default;
    const urls = (await sitemap()).map((e) => e.url.replace("https://www.arbeidmatch.no", ""));
    for (const gone of ["/blog", "/premium", "/download", "/partners"]) {
      expect(urls.filter((u) => u === gone || (u.startsWith(`${gone}/`) && gone !== "/blog")), gone).toEqual([]);
    }
    expect(urls).toContain("/blog/ansette-utenlandske-arbeidere-lovlig");
    expect(urls).toContain(SITE_PATHS.lifeInNorway);
    for (const slug of PREMIUM_ARTICLE_SLUGS) expect(urls).toContain(guidePath(slug));
  });
});
