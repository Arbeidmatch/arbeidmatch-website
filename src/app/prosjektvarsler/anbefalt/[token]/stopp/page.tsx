import type { Metadata } from "next";
import { headers } from "next/headers";

import styles from "@/components/prosjekter/portal.module.css";
import { OptOutForm } from "@/components/prosjektvarsler/RecommendationForms";
import { isRecommendationToken, LANDING_NO, landingFrom } from "@/lib/min-side/recommend";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Ikke send meg anbefalinger | ArbeidMatch" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * ORDER 274: "Ikke send meg anbefalinger" from a recommendation mail. One
 * button, so a mail scanner opening the link changes nothing; it stops
 * recommendations to the address that mail went to, and to no other.
 */
export default async function RecommendationStopPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const answer = isRecommendationToken(token)
    ? await callAts(`/api/public/project-recommendation/${token}`, { method: "GET", visitorHeaders: await headers() })
    : null;
  const by = answer?.status === 200 ? landingFrom(answer.body) : null;
  const unreachable = answer !== null && answer.status >= 500;

  return (
    <div className={styles.portal} style={{ minHeight: "70vh" }}>
      <div className={styles.narrow}>
        <p className={styles.eyebrow}>Prosjektvarsler</p>
        <h1>{by ? LANDING_NO.stopTitle : unreachable ? "Siden kunne ikke hentes akkurat nå" : LANDING_NO.invalid}</h1>
        {by ? (
          <>
            <p className={styles.lede}>Trykk på knappen, så sender vi ingen flere anbefalinger til adressen denne e-posten gikk til.</p>
            <OptOutForm token={token} already={by.optedOut} />
          </>
        ) : (
          <p className={styles.lede}>{unreachable ? "Prøv lenken igjen om litt." : "Lenken i e-posten er brukt opp eller finnes ikke."}</p>
        )}
      </div>
    </div>
  );
}
