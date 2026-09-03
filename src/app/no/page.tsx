import type { Metadata } from "next";
import { Forsiden } from "@/components/home/Forsiden";

/**
 * The front page in Norwegian.
 *
 * ENGLISH IS THE DEFAULT AND THIS IS SECOND, which is a decision about who is
 * reading rather than about which country we are in. The person looking for
 * work arrives from the EEA and does not read Norwegian yet; the job titles are
 * in English in the system anyway. Norwegian is for the companies here and for
 * the people already settled.
 *
 * The page's own words are translated once, from a table, rather than by asking
 * a model on every visit. Two languages, both real, and neither of them costs a
 * request.
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

const TITLE = "Ledige jobber i Norge for fagarbeidere fra EU og EØS | ArbeidMatch";
const DESCRIPTION =
  "Ledige stillinger i Norge for tømrere, murere, betongarbeidere, bilmekanikere, sveisere og elektrikere med DSB-registrering. EU- eller EØS-pass kreves, fagbrev eller dokumentert tilsvarende erfaring.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "https://www.arbeidmatch.no/no",
    languages: {
      en: "https://www.arbeidmatch.no/",
      no: "https://www.arbeidmatch.no/no",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "nb_NO",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ArbeidMatch" }],
  },
};

export default function NorwegianFrontPage() {
  return <Forsiden lang="no" />;
}
