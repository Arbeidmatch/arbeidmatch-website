import type { Metadata } from "next";
import { Forsiden } from "@/components/home/Forsiden";

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

const TITLE = "Jobs in Norway for EU and EEA tradespeople | ArbeidMatch";
const DESCRIPTION =
  "Open positions in Norway for carpenters, bricklayers, concrete workers, car mechanics, welders and DSB-certified electricians. EU or EEA passport required, trade certificate or documented equivalent experience.";

const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "ArbeidMatch | Jobs in Norway for EU and EEA tradespeople",
} as const;

export const metadata: Metadata = {
  // Absolute: the layout's "%s | ArbeidMatch" would print the brand twice.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: "https://www.arbeidmatch.no/",
    // Two languages, both real, and each one says the other exists. English is
    // the default because the reader looking for work comes from the EEA.
    languages: {
      en: "https://www.arbeidmatch.no/",
      no: "https://www.arbeidmatch.no/no",
    },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return <Forsiden lang="en" />;
}
