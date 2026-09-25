import type { Metadata } from "next";
import { JobsListing } from "@/components/jobs/JobsListing";
import { facetLabel, facetPath, getBoard, jobsForFacet, listFacets } from "@/lib/jobs-facets";
import { filterJobSearch } from "@/lib/job-search";
import Link from "next/link";

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
const DESCRIPTION =
  "Every open position: carpenters, bricklayers, concrete workers, car mechanics, welders and DSB-certified electricians. EU/EEA citizenship required (passport or national ID card), trade certificate or documented equivalent experience.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "https://www.arbeidmatch.no/jobs" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://www.arbeidmatch.no/jobs", locale: "en_US" },
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ search?: string | string[]; location?: string | string[] }> }) {
  const { jobs, totalOpen, ok } = await getBoard();
  const facets = await listFacets();
  const params = await searchParams;
  const search = (Array.isArray(params.search) ? params.search[0] : params.search)?.trim() ?? "";
  const location = (Array.isArray(params.location) ? params.location[0] : params.location)?.trim() ?? "";
  const filtered = filterJobSearch(jobs, search, location);
  const searching = Boolean(search || location);

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
    {searching && <div className="bg-navy px-6 py-4 text-center text-sm text-white/80">
      {search && <span>Trade: {search}. </span>}{location && <span>Location: {location}. </span>}
      <Link href="/jobs" className="ml-2 inline-flex min-h-11 items-center text-gold underline">Clear filters</Link>
    </div>}
    <JobsListing
      jobs={filtered}
      ok={ok}
      heading={searching ? (ok ? `${filtered.length} matching ${filtered.length === 1 ? "job" : "jobs"}` : "Search results") : totalOpen > 0 ? `${totalOpen} open jobs in Norway` : "Open jobs in Norway"}
      lede="Work for people with a trade. What each job runs on, and for how long, is written in the advert itself. EU or EEA citizenship (passport or national ID card) is required on every one of them, and we do not sponsor visas."
      related={related}
      signup
    />
    </>
  );
}
