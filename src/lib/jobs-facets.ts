import "server-only";

import { fetchPublicJobs, industryOf, type Industry, type PublicJob } from "@/lib/jobs-fetch";
import { tradeFromTitle } from "@/lib/trades";

/**
 * A page for every question somebody actually types.
 *
 * Nobody searches for "jobs in Norway". They search for "tomrer jobb Bergen",
 * "car mechanic Norway", "bilmekaniker Trondheim". Every big board owns those
 * queries by having a real page for each combination, and that is where their
 * traffic comes from rather than from advertising.
 *
 * ONLY COMBINATIONS THAT HAVE JOBS IN THEM. This is the whole discipline. It
 * would be easy to generate a page for every trade crossed with every town in
 * Norway and end up with four hundred pages, of which twelve have anything on
 * them. Those are thin pages, they are what a search engine demotes a whole
 * domain for, and a person who lands on an empty one does not come back. So the
 * list is computed from the live board and nothing else exists: `dynamicParams`
 * is off on the route, so a combination with no jobs is a 404 rather than an
 * empty page.
 *
 * That also means the set shrinks. A trade whose last advert closed loses its
 * page, which is correct: the page was only ever a promise that we had that
 * work.
 */

export type Facet =
  | { kind: "trade"; slug: string; trade: string }
  | { kind: "town"; slug: string; town: string }
  | { kind: "trade-town"; slug: string; trade: string; town: string }
  | { kind: "industry"; slug: string; industry: Industry; label: string };

/**
 * A slug that survives Norwegian.
 *
 * "Strømmen" has to become "strommen" and not "strmmen", and "Møre og Romsdal"
 * has to stay readable. Stripping accents with a normalise pass turns ø into
 * nothing at all, because ø is a letter in its own right rather than o with a
 * mark on it, so the three Norwegian letters are mapped by hand first.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The trade a posting is about, read from its title.
 *
 * Not from `category`, which holds industries and holds them wrongly: three car
 * mechanic postings are filed under Construction. See lib/trades.ts.
 */
function tradeOf(job: PublicJob): string | null {
  return tradeFromTitle(job.title);
}

function townOf(job: PublicJob): string | null {
  const town = (job.location ?? "").trim();
  return town && town.toLowerCase() !== "norway" ? town : null;
}

/**
 * Every combination the board can honestly stand behind right now.
 *
 * A trade or a town needs at least one open advert. A trade crossed with a town
 * needs one too, which in practice keeps the list short and every page full.
 */
export async function listFacets(): Promise<Facet[]> {
  const { jobs, industries } = await fetchPublicJobs(300);
  const trades = new Map<string, string>();
  const towns = new Map<string, string>();
  const pairs = new Map<string, { trade: string; town: string }>();

  for (const job of jobs) {
    const trade = tradeOf(job);
    const town = townOf(job);
    if (trade) trades.set(slugify(trade), trade);
    if (town) towns.set(slugify(town), town);
    if (trade && town) pairs.set(`${slugify(trade)}/${slugify(town)}`, { trade, town });
  }

  return [
    ...[...trades].map(([slug, trade]) => ({ kind: "trade", slug, trade }) as Facet),
    ...[...towns].map(([slug, town]) => ({ kind: "town", slug, town }) as Facet),
    ...[...pairs].map(([slug, v]) => ({ kind: "trade-town", slug, trade: v.trade, town: v.town }) as Facet),
    // The four industries, but only the ones that currently hold something. The
    // strip on the front page draws all four with their counts, including a
    // zero; a chip showing zero must not be a link into an empty page, so the
    // facet simply does not exist and the strip renders it as plain text.
    ...industries
      .filter((i) => i.count > 0)
      .map((i) => ({ kind: "industry", slug: slugify(i.en), industry: i.key, label: i.en }) as Facet),
  ];
}

/** What the URL segments mean, or null when they mean nothing we have. */
export async function resolveFacet(segments: string[]): Promise<Facet | null> {
  if (segments.length === 0 || segments.length > 2) return null;
  const wanted = segments.map((s) => slugify(decodeURIComponent(s))).join("/");
  const facets = await listFacets();
  return facets.find((f) => f.slug === wanted) ?? null;
}

/** The postings a facet actually holds. */
export function jobsForFacet(jobs: PublicJob[], facet: Facet): PublicJob[] {
  return jobs.filter((job) => {
    const trade = tradeOf(job);
    const town = townOf(job);
    if (facet.kind === "industry") return industryOf(job) === facet.industry;
    if (facet.kind === "trade") return trade ? slugify(trade) === facet.slug : false;
    if (facet.kind === "town") return town ? slugify(town) === facet.slug : false;
    return Boolean(trade && town && `${slugify(trade)}/${slugify(town)}` === facet.slug);
  });
}

/**
 * The words on the page, written as the answer to the question that was typed.
 *
 * "Carpenter jobs in Bergen" is the heading somebody searching for carpenter
 * work in Bergen was hoping to see. A generic "Open positions" on the same page
 * would be the same list under a title that answers nobody.
 */
export function facetCopy(facet: Facet, count: number): { h1: string; title: string; description: string } {
  const plural = count === 1 ? "job" : "jobs";
  if (facet.kind === "industry") {
    return {
      h1: `${facet.label} jobs in Norway`,
      title: `${facet.label} jobs in Norway | ArbeidMatch`,
      description: `${count} open ${plural} in ${facet.label.toLowerCase()} in Norway. EU or EEA passport required, trade certificate or documented equivalent experience.`,
    };
  }
  if (facet.kind === "trade") {
    return {
      h1: `${facet.trade} jobs in Norway`,
      title: `${facet.trade} jobs in Norway | ArbeidMatch`,
      description: `${count} open ${facet.trade.toLowerCase()} ${plural} in Norway. EU or EEA passport required, trade certificate or documented equivalent experience.`,
    };
  }
  if (facet.kind === "town") {
    return {
      h1: `Jobs in ${facet.town}`,
      title: `Jobs in ${facet.town}, Norway | ArbeidMatch`,
      description: `${count} open ${plural} in ${facet.town}, Norway, for skilled trades. EU or EEA passport required, no visa sponsorship.`,
    };
  }
  return {
    h1: `${facet.trade} jobs in ${facet.town}`,
    title: `${facet.trade} jobs in ${facet.town}, Norway | ArbeidMatch`,
    description: `${count} open ${facet.trade.toLowerCase()} ${plural} in ${facet.town}, Norway. EU or EEA passport, trade certificate or documented equivalent experience.`,
  };
}

/** The path a facet lives at, used by the page, the links and the sitemap alike. */
export function facetPath(facet: Facet): string {
  return `/jobs/${facet.slug}`;
}

/** The label a facet is listed under, wherever one list points at another. */
export function facetLabel(facet: Facet): string {
  if (facet.kind === "town") return facet.town;
  if (facet.kind === "trade") return facet.trade;
  if (facet.kind === "industry") return facet.label;
  return `${facet.trade}, ${facet.town}`;
}
