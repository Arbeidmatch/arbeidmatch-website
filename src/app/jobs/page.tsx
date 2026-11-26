import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE } from "@/lib/nbPageMetadata";
import { JobsListing } from "@/components/jobs/JobsListing";
import { facetLabel, facetPath, getBoard, jobsForFacet, listFacets } from "@/lib/jobs-facets";
import { filterJobSearch } from "@/lib/job-search";
import Link from "next/link";
import { fetchMarketJobs, previewTokenFromCookies } from "@/lib/market-jobs/fetch";
import { filterMarketSearch } from "@/lib/market-jobs/pure";

/**
 * Every open job, and the way into the pages that answer a narrower question.
 *
 * IT IS INDEXABLE NOW, and that is a correction rather than a new decision. The
 * page carried `noindex` from the months when the board was gated and not
 * public. Since 2 September the front page IS the board, listed publicly with
 * JobPosting markup on it, so this page was showing the same adverts as the
 * home page while telling search engines to ignore it: two surfaces, one list,
 * opposite instructions. The gate itself came off on 6 August.
 *
 * The trade and town pages under /jobs are where the traffic actually comes
 * from, and every one of them is reachable from here. The ATS still keeps the
 * board's data, the apply form and the consent; this page reads the public API
 * and hands the visitor to the ATS job page, exactly as before.
 */

/**
 * Rendered per request, with the upstream call cached for five minutes.
 *
 * NOT ISR, and the reason is measured. The Vercel build cannot reach
 * ats.arbeidmatch.no: every board read during a build fails, so a statically
 * generated page bakes in "the job list could not be loaded" and serves it to
 * the first visitor after every single deploy, until a revalidation replaces
 * it. That is what the first deploy of the front page did, and it was mistaken
 * for the ATS being mid-deploy.
 *
 * Rendering per request costs nothing extra upstream, because
 * `fetchPublicJobs(300)` caches the ATS response for five minutes: many
 * requests, one call. What it buys is that a page about open jobs is never
 * served saying it has none.
 */
export const dynamic = "force-dynamic";

const TITLE = "Open jobs in Norway for EU and EEA tradespeople | ArbeidMatch";
// Under 160 characters, so a search result shows it whole.
const DESCRIPTION =
  "Open jobs in Norway for EU/EEA tradespeople: carpenters, bricklayers, car mechanics, welders and electricians. Trade certificate or proven experience.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://www.arbeidmatch.no/jobs" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://www.arbeidmatch.no/jobs", locale: "en_US", images: [DEFAULT_OG_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [DEFAULT_OG_IMAGE.url] },
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ search?: string | string[]; location?: string | string[] }> }) {
  const { jobs, totalOpen, ok } = await getBoard();
  const facets = await listFacets();
  const params = await searchParams;
  const search = (Array.isArray(params.search) ? params.search[0] : params.search)?.trim() ?? "";
  const location = (Array.isArray(params.location) ? params.location[0] : params.location)?.trim() ?? "";
  const filtered = filterJobSearch(jobs, search, location);
  const searching = Boolean(search || location);
  // ORDER 514: the market jobs, read per request with this visitor's own preview
  // cookie and never cached. Without a staff preview the ATS returns none, so a
  // visitor sees exactly the list above while the Go public switch is off.
  const market = await fetchMarketJobs(await previewTokenFromCookies());
  const marketShown = filterMarketSearch(market.jobs, search, location);
  const shownCount = filtered.length + marketShown.length;

  // Only lists that have something in them. A chip leading to an empty page is
  // worse than no chip, and the facet list is computed from the live board so
  // this cannot drift out of step with what is open.
  const related = facets
    .map((f) => ({
      href: facetPath(f),
      label: facetLabel(f),
      count: jobsForFacet(jobs, f).length,
    }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 16);

  return (
    <>
    {searching && <div className="ams"><div className="w jl-search">
      {search && <span>Trade: {search}. </span>}{location && <span>Location: {location}. </span>}
      <Link href="/jobs" className="pill">Clear filters</Link>
    </div></div>}
    <JobsListing
      jobs={filtered}
      ok={ok}
      heading={searching ? (ok ? `${shownCount} matching ${shownCount === 1 ? "job" : "jobs"}` : "Search results") : totalOpen + marketShown.length > 0 ? `${totalOpen + marketShown.length} open jobs in Norway` : "Open jobs in Norway"}
      lede="Work for people with a trade. What each job runs on, and for how long, is written in the advert itself. EU or EEA citizenship (passport or national ID card) is required on every one of them, and we do not sponsor visas."
      related={related}
      total={totalOpen + market.jobs.length}
      signup
      marketJobs={marketShown}
      marketPrivateTest={market.privateTest}
    />
    </>
  );
}
