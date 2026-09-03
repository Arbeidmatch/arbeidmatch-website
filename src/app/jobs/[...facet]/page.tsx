import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobsListing } from "@/components/jobs/JobsListing";
import { facetCopy, facetLabel, facetPath, jobsForFacet, listFacets, resolveFacet } from "@/lib/jobs-facets";
import { fetchPublicJobs } from "@/lib/jobs-fetch";

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

export const revalidate = 300;
export const dynamicParams = false;

export async function generateStaticParams() {
  const facets = await listFacets();
  return facets.map((f) => ({ facet: f.slug.split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<{ facet: string[] }> }): Promise<Metadata> {
  const { facet: segments } = await params;
  const facet = await resolveFacet(segments);
  if (!facet) return { title: "Open jobs | ArbeidMatch" };

  const { jobs } = await fetchPublicJobs(300);
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

  const { jobs, ok } = await fetchPublicJobs(300);
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
