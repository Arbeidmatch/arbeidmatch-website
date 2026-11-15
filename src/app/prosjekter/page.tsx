import type { Metadata } from "next";
import { headers } from "next/headers";

import Link from "next/link";

import { publicOverview } from "@/lib/prosjekter/explorer";
import ProjectPortal from "@/components/prosjekter/ProjectPortal";
import { Icon } from "@/components/site/Icon";
import { SITE_PATHS } from "@/components/site/siteNav";
import { callAts } from "@/lib/prosjekter/ats";
import { filtersFrom, filtersQuery, isOverview, type Overview } from "@/lib/prosjekter/types";

export const dynamic = "force-dynamic";

const TITLE = "Forsprang · Bygg- og anleggsprosjekter | ArbeidMatch";
const DESCRIPTION =
  "Se hvilke bygg- og anleggsprosjekter som planlegges, hvilke konkurranser som er åpne og hvem som har fått kontraktene, i hele Norge. Oppdatert hver dag.";

export const metadata: Metadata = {
  // Not advertised (the owner's decision, 17 October 2026): he sends the link himself.
  // Out of the sitemap, the footer and For bedrifter, and kept out of search.
  robots: { index: false, follow: false },
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
  // Stage, county and trade only: no search words go to the ATS (PROJ-SEC).
  const filters = filtersFrom(params);
  const answer = await callAts(`/api/public/projects-overview${filtersQuery(filters)}`, {
    method: "GET",
    visitorHeaders: await headers(),
  });
  const initial: Overview | null = answer.status === 200 && isOverview(answer.body) ? publicOverview(answer.body) : null;

  // ORDER 295, stage 4: the page in the design approved on 15 November 2026. The map, the counts and the list
  // are the live explorer and live data; the steps, what each side sees, the invitation note and the bridge to
  // staffing are the mockup's.
  return (
    <div className="ams page" lang="nb">
      {/* The classic view only, whatever ?view= says: the "Ny" explorer is for signed-in clients on their own page (his rule, 17 October 2026). */}
      <ProjectPortal initial={initial} initialFilters={filters} layout="site" />

      <section className="sec">
        <div className="w">
          <span className="eb">Slik fungerer det</span>
          <h2 className="h2">Fra kartet til riktig konkurranse</h2>
          <ol className="four">
            {STEPS.map((s, i) => (
              <li key={s.title} className="stepc">
                <b>{i + 1}</b>
                <h3 className="h4">{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sec tight">
        <div className="w">
          <span className="eb">Hva dere ser</span>
          <h2 className="h2">Åpent kart, hele bildet med invitasjon</h2>
          <div className="two">
            <div className="card">
              <span className="eb">Åpent for alle</span>
              <h3 className="h3">Kartet</h3>
              <ul className="chk">
                <li>
                  <Icon name="check" />
                  Alle fylker i Norge
                </li>
                <li>
                  <Icon name="check" />
                  Fase, fag og verdiområde
                </li>
                <li>
                  <Icon name="check" />
                  Antall prosjekter der dere jobber
                </li>
              </ul>
            </div>
            <div className="card night">
              <span className="eb">
                Med invitasjon<i className="bt">Beta</i>
              </span>
              <h3 className="h3">Prosjektet</h3>
              <ul className="chk">
                <li>
                  <Icon name="check" />
                  Byggherre og entreprenør
                </li>
                <li>
                  <Icon name="check" />
                  Frister og krav
                </li>
                <li>
                  <Icon name="check" />
                  Varsel når noe nytt dukker opp i deres område
                </li>
                <li>
                  <Icon name="check" />
                  Lenke rett til konkurransen
                </li>
              </ul>
            </div>
          </div>
          <div className="note" style={{ marginTop: 24 }}>
            <span className="eb">Kun med invitasjon</span>
            <h3>Be om en invitasjon, så vurderer vi forespørselen</h3>
            <p>Forsprang er i beta, og vi tester med et begrenset antall firmaer. Den som får invitasjon, får en personlig lenke.</p>
            <div className="close-acts" style={{ marginTop: 8 }}>
              <button type="button" className="btn gold" data-sheet="access">
                Be om invitasjon
              </button>
              <a className="btn ghost" href={SITE_PATHS.forsprangLogin} aria-haspopup="dialog">
                Har dere tilgang? Logg inn
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{ background: "var(--sage)" }}>
        <div className="w close">
          <div>
            <h2 className="h3">Trenger dere folk til prosjektet?</h2>
            <p>Vi leverer fagfolk gjennom bemanning og rekruttering.</p>
          </div>
          <Link className="btn ghost" href={SITE_PATHS.firms}>
            Se hvordan vi jobber
          </Link>
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  { title: "Se prosjektene i ditt område", body: "Kartet er åpent. Filtrer på fylke, fag og fase, uten konto." },
  { title: "Be om invitasjon", body: "Et kort skjema: firma, org.nr., e-post, fylker og fag." },
  { title: "Få din personlige lenke", body: "Når forespørselen er godkjent, åpner lenken prosjektene dere følger." },
  { title: "Se hele prosjektet", body: "Gå rett til konkurransen, eller be oss om folk til jobben." },
] as const;
