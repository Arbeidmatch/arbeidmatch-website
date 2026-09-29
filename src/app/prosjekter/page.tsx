import type { Metadata } from "next";
import { headers } from "next/headers";

import AccessForm from "@/components/prosjekter/AccessForm";
import PortalSteps from "@/components/prosjekter/PortalSteps";
import ProjectPortal from "@/components/prosjekter/ProjectPortal";
import styles from "@/components/prosjekter/portal.module.css";
import { callAts } from "@/lib/prosjekter/ats";
import { placeProjects } from "@/lib/prosjekter/map";
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
 * THE OPEN PROJECT PORTAL, arbeidmatch.no/prosjekter (version 2, 29 September 2026).
 *
 * Anybody may see the counts, the map and the list: a title with the buyer
 * taken out, the town and county, the stage, the value and the month that
 * matters. The buyer, the contractor, exact deadlines and the way into a
 * tender are for clients, who have a page of their own (/prosjekter/<token>,
 * reached by a login link from /prosjekter/logg-inn). Below the map: how it
 * works, and the form that asks for access.
 *
 * Rendered on the server with the ATS's answer, so the list is readable
 * without JavaScript and by a search engine; the map, filters and sort then
 * work in the browser on the same answer.
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

  return (
    <div className={styles.portal}>
      <ProjectPortal initial={initial} initialFilters={filters} />
      <PortalSteps projects={placeProjects(initial?.map)} />
      <AccessForm />
    </div>
  );
}
