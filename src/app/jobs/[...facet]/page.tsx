import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobsListing } from "@/components/jobs/JobsListing";
import { facetCopy, facetLabel, facetPath, getBoard, jobsForFacet, listFacets, resolveFacet } from "@/lib/jobs-facets";


/**
 * A page for each question somebody types.
 *
 * `/jobs/carpenter`, `/jobs/bergen`, `/jobs/carpenter/bergen`. These are the
 * searches people actually run, and having a real page for each is how every
 * large board gets its traffic without paying for it.
 *
 * `dynamicParams = false` is the discipline that makes it honest: only
 * combinations that have adverts in them exist, and everything else is a 404
 * rather than an empty page. Generating a page per trade crossed with every
 * town would make four hundred addresses of which twelve have anything on them,
 * and thin pages cost a domain more than they earn it.
 *
 * The list therefore shrinks when work closes, which is right. The page was
 * only ever a claim that we had that work.
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
/**
 * ON, deliberately, and it was off for one deploy.
 *
 * With it off the whole route depended on the build being able to read the
 * board: one refused request and `generateStaticParams` returned nothing, so
 * every trade and town page answered 404 while the build reported success.
 * That is exactly what happened on the first deploy.
 *
 * Nothing is lost by turning it on, because the thin-page guard was never here.
 * `resolveFacet` checks the segments against the live board on every render and
 * calls `notFound()` for anything that has no adverts in it, so a made-up
 * address is still a 404 - it is just a 404 decided by the data rather than by
 * whether a build succeeded three hours ago.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const facets = await listFacets();
  return facets.map((f) => ({ facet: f.slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ facet: string[] }> }): Promise<Metadata> {
  const { facet: segments } = await params;
  const facet = await resolveFacet(segments);
  if (!facet) return { title: "Open jobs | ArbeidMatch" };

  const { jobs } = await getBoard();
  const copy = facetCopy(facet, jobsForFacet(jobs, facet).length);
  const url = `https://www.arbeidmatch.no${facetPath(facet)}`;

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: url },
    openGraph: { title: copy.title, description: copy.description, url, locale: "en_US" },
  };
}

export default async function FacetJobsPage({ params }: { params: Promise<{ facet: string[] }> }) {
  const { facet: segments } = await params;
  const facet = await resolveFacet(segments);
  if (!facet) notFound();

  const { jobs, ok } = await getBoard();
  const mine = jobsForFacet(jobs, facet);
  const copy = facetCopy(facet, mine.length);

  // Neighbours that actually have adverts on them, so nothing here links into
  // an empty page. Sorted biggest first and capped, because a wall of chips is
  // navigation nobody reads.
  const all = await listFacets();
  const related = all
    .filter((f) => f.slug !== facet.slug)
    .map((f) => ({
      href: facetPath(f),
      label: facetLabel(f),
      count: jobsForFacet(jobs, f).length,
    }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10);

  return (
    <JobsListing
      jobs={mine}
      ok={ok}
      heading={copy.h1}
      lede={copy.description}
      related={related}
    />
  );
}
