import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/components/prosjekter/portal.module.css";
import { isLoginToken } from "@/lib/prosjekter/access";
import { callAts } from "@/lib/prosjekter/ats";
import { isProjectToken } from "@/lib/prosjekter/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Logg inn | Prosjekter | ArbeidMatch" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * Where a login link from the e-mail lands. The ATS trades the one-time login
 * token for the client's own subscription token, and the visitor goes on to
 * /prosjekter/<that token>. A used, expired or unknown link, or an ATS that
 * cannot be reached, ends on a plain page with the way back to the form.
 */
export default async function ProsjekterInnPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let target: string | null = null;
  let unreachable = false;
  if (isLoginToken(token)) {
    const answer = await callAts(`/api/public/project-login/${encodeURIComponent(token)}`, {
      method: "GET",
      visitorHeaders: await headers(),
    });
    if (answer.status === 200 && isProjectToken(answer.body.token)) target = answer.body.token;
    else if (answer.status >= 500) unreachable = true;
  }
  // Outside any try: redirect() works by throwing.
  if (target) redirect(`/prosjekter/${target}`);

  return (
    <div className={styles.portal} style={{ minHeight: "70vh" }}>
      <div className={styles.narrow}>
        <p className={styles.eyebrow}>Prosjekter · for kunder</p>
        <h1>{unreachable ? "Vi får ikke logget deg inn akkurat nå" : "Lenken er brukt eller utløpt"}</h1>
        <p className={styles.lede}>
          {unreachable
            ? "Prøv lenken igjen om litt. Virker den fortsatt ikke, kan du be om en ny."
            : "En innloggingslenke virker én gang og i 30 minutter. Be om en ny, så sender vi den til e-posten din."}
        </p>
        <p style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href="#logg-inn" className={`${styles.btn} ${styles.btnGold}`} aria-haspopup="dialog">
            Send meg en ny lenke
          </Link>
          <Link href="/prosjekter" className={`${styles.btn} ${styles.btnGhost}`}>
            Til prosjektkartet
          </Link>
        </p>
      </div>
    </div>
  );
}
