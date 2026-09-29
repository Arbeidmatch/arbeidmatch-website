import type { Metadata } from "next";
import { headers } from "next/headers";

import ProjectsRegister from "@/components/prosjekter/ProjectsRegister";
import { callAts } from "@/lib/prosjekter/ats";
import { filtersFrom, filtersQuery, isOverview, type Overview } from "@/lib/prosjekter/types";

export const dynamic = "force-dynamic";

const TITLE = "Bygg- og anleggsprosjekter i hele Norge | ArbeidMatch";
const DESCRIPTION =
  "Se hvilke bygg- og anleggsprosjekter som planlegges, hvilke konkurranser som er åpne og hvem som har fått kontraktene, i hele Norge. Oppdatert hver dag.";

export const metadata: Metadata = {
  alternates: { canonical: "/prosjekter" },
  title: { absolute: TITLE },
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    siteName: "ArbeidMatch",
    type: "website",
    url: "/prosjekter",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch | Prosjekter i hele Norge" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

/**
 * THE OPEN PROJECT REGISTER, arbeidmatch.no/prosjekter.
 *
 * Anybody may see the counts and the list: title, owner, place, stage, value,
 * the date that matters and the contractor. The details and the way into a
 * tender are for clients, who have a link of their own (/prosjekter/<token>,
 * /prosjekt/<token>). Rendered on the server with the first page, so the list
 * is readable without JavaScript and by a search engine; filters and pages
 * then go through /api/prosjekter/overview.
 */
export default async function ProsjekterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = filtersFrom(await searchParams);
  const answer = await callAts(`/api/public/projects-overview${filtersQuery(filters)}`, {
    method: "GET",
    visitorHeaders: await headers(),
  });
  const initial: Overview | null = answer.status === 200 && isOverview(answer.body) ? answer.body : null;

  return <ProjectsRegister initial={initial} initialFilters={filters} />;
}
