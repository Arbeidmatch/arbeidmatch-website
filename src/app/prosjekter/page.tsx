import type { Metadata } from "next";
import { headers } from "next/headers";

import AccessBand from "@/components/prosjekter/AccessBand";
import PortalSteps from "@/components/prosjekter/PortalSteps";
import ProjectVersion from "@/components/prosjekter/ProjectVersion";
import PublicProjectExplorer from "@/components/prosjekter/PublicProjectExplorer";
import ExplorerGuide from "@/components/prosjekter/ExplorerGuide";
import { publicOverview } from "@/lib/prosjekter/explorer";
import ProjectPortal from "@/components/prosjekter/ProjectPortal";
import styles from "@/components/prosjekter/portal.module.css";
import { callAts } from "@/lib/prosjekter/ats";
import { placeProjects } from "@/lib/prosjekter/map";
import { filtersFrom, filtersQuery, isOverview, type Overview } from "@/lib/prosjekter/types";

export const dynamic = "force-dynamic";

const TITLE = "Forsprang · Bygg- og anleggsprosjekter | ArbeidMatch";
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
 * The public explorer exposes categories, regions, stages and value bands.
 * Sanitize before serialization so both Ny and Old receive the same public
 * payload. Exact titles and commercial details remain on the authenticated
 * subscriber page. Access and login dialogs use #tilgang and #logg-inn.
 */
export default async function ProsjekterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = filtersFrom(params);
  const answer = await callAts(`/api/public/projects-overview${filtersQuery(filters)}`, {
    method: "GET",
    visitorHeaders: await headers(),
  });
  const initial: Overview | null = answer.status === 200 && isOverview(answer.body) ? publicOverview(answer.body) : null;

  return (
    <div className={styles.portal}>
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8">
        <h1 className="text-2xl font-semibold text-white">Forsprang · Prosjekter i Norge</h1>
        <ProjectVersion initialOld={params.view !== "new"} modern={<><PublicProjectExplorer initial={initial} /><ExplorerGuide /></>}>
          <ProjectPortal initial={initial} initialFilters={filters} />
          <PortalSteps projects={placeProjects(initial?.map)} />
        </ProjectVersion>
      </div>
      <AccessBand />
    </div>
  );
}
