import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

/**
 * /prosjekter is not advertised (the owner's decision, 17 October 2026): he
 * sends the link himself. Out of search, the sitemap, the footer and the For
 * bedrifter page; still reachable by its link.
 */

vi.mock("@/lib/jobs-facets", () => ({ facetPath: () => "/jobs", getBoard: async () => [], listFacets: async () => [] }));
vi.mock("@/lib/jobs-fetch", () => ({ jobUrl: () => "/j/1" }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (rel: string) => readFileSync(path.resolve(here, rel), "utf8");

describe("the project page is reached by link only", () => {
  it("is noindex, nofollow", async () => {
    const { metadata } = await import("./page");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("is not in the sitemap", async () => {
    const { default: sitemap } = await import("../sitemap");
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.some((u) => /\/prosjekter(\/|$)/.test(u))).toBe(false);
  });

  it("has no footer link", () => {
    const footer = source("../../components/Footer.tsx");
    expect(footer).not.toContain('href="/prosjekter"');
    expect(footer).not.toContain("Prosjekter i hele Norge");
  });

  it("has no teaser on For bedrifter", () => {
    expect(source("../for-employers/page.tsx")).not.toContain("ProjectsTeaser");
  });
});
