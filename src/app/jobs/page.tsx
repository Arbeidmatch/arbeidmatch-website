import type { Metadata } from "next";
import { JobsListing } from "@/components/jobs/JobsListing";
import { facetLabel, facetPath, jobsForFacet, listFacets } from "@/lib/jobs-facets";
import { fetchPublicJobs } from "@/lib/jobs-fetch";

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

export const revalidate = 300;

const TITLE = "Open jobs in Norway for EU and EEA tradespeople | ArbeidMatch";
const DESCRIPTION =
  "Every open position: carpenters, bricklayers, concrete workers, car mechanics, welders and DSB-certified electricians. EU or EEA passport required, trade certificate or documented equivalent experience.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://www.arbeidmatch.no/jobs" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "https://www.arbeidmatch.no/jobs", locale: "en_US" },
};

export default async function JobsPage() {
  const { jobs, totalOpen, ok } = await fetchPublicJobs(300);
  const facets = await listFacets();

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
    <JobsListing
      jobs={jobs}
      ok={ok}
      heading={totalOpen > 0 ? `${totalOpen} open jobs in Norway` : "Open jobs in Norway"}
      lede="Work for people with a trade. What each job runs on, and for how long, is written in the advert itself. An EU or EEA passport is required on every one of them, and we do not sponsor visas."
      related={related}
    />
  );
}
