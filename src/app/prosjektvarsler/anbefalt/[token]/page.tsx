import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";

import styles from "@/components/prosjekter/portal.module.css";
import { TrialRequestForm } from "@/components/prosjektvarsler/RecommendationForms";
import { isRecommendationToken, LANDING_NO, landingFrom, recommenderWords } from "@/lib/min-side/recommend";
import { callAts } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Prosjektvarsler | ArbeidMatch" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * ORDER 274: where "Se prosjektene" in a recommendation mail lands. Says who
 * recommended, and asks for a free trial: never a trial by itself, a request
 * the owner gives or not, usually within one working day.
 */
export default async function RecommendationPage({ params }: { params: Promise<{ token: string }> }) {
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
        {by ? (
          <>
            <h1>{recommenderWords(by)} anbefaler dere å prøve Prosjektvarsler</h1>
            <p className={styles.lede}>
              Prosjektvarsler sender dere byggeprosjekter i planlegging og i anbud, i fylkene og fagene dere velger. Tjenesten er under utvikling og gratis å
              prøve, for opptil 3 personer i firmaet.
            </p>
            <TrialRequestForm token={token} />
            <p className={styles.small} style={{ marginTop: 32 }}>
              <Link href={`/prosjektvarsler/anbefalt/${encodeURIComponent(token)}/stopp`}>{LANDING_NO.stopTitle}</Link>
            </p>
          </>
        ) : (
          <>
            <h1>{unreachable ? "Siden kunne ikke hentes akkurat nå" : LANDING_NO.invalid}</h1>
            <p className={styles.lede}>{unreachable ? "Prøv lenken igjen om litt." : "Lenken i e-posten er brukt opp eller finnes ikke."}</p>
          </>
        )}
      </div>
    </div>
  );
}
