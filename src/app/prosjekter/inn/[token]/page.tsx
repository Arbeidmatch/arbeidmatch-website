import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import ResendLoginButton from "@/components/prosjekter/ResendLoginButton";
import styles from "@/components/prosjekter/portal.module.css";
import { isLoginToken } from "@/lib/prosjekter/access";
import { intentQuery, loginIntentFrom } from "@/lib/prosjekter/portal-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Logg inn | Prosjekter | ArbeidMatch" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

/**
 * Where a login link from the e-mail lands. The link is redeemed by
 * /api/prosjekter/inn/<token> (PROJ-REST A, 17 October 2026), which keeps the
 * client's session in a cookie and sends them on: their own page
 * /min-side/<key> (the owner's decision of 30 September 2026), their
 * subscription page, or the presentation whose "Logg inn" they pressed. A used,
 * expired or unknown link, or an ATS that cannot be reached, comes back here
 * with a status and ends on a plain page with "Send ny lenke", which mails a
 * new link to the address the old one was sent to and to no other.
 */
export default async function ProsjekterInnPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const query = await searchParams;
  const status = query.status === "feil" ? "feil" : query.status === "utlopt" ? "utlopt" : null;
  // Outside any try: redirect() works by throwing.
  if (!status && isLoginToken(token)) redirect(`/api/prosjekter/inn/${encodeURIComponent(token)}${intentQuery(loginIntentFrom(query))}`);

  const unreachable = status === "feil";
  return (
    <div className={styles.portal} style={{ minHeight: "70vh" }}>
      <div className={styles.narrow}>
        <p className={styles.eyebrow}>Prosjekter · for kunder</p>
        <h1>{unreachable ? "Vi får ikke logget deg inn akkurat nå" : "Lenken er brukt eller utløpt"}</h1>
        <p className={styles.lede}>
          {unreachable
            ? "Prøv lenken igjen om litt. Virker den fortsatt ikke, kan du be om en ny."
            : "Be om en ny lenke, så sender vi den til den samme e-postadressen."}
        </p>
        <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
          {isLoginToken(token) ? (
            <ResendLoginButton token={token} className={`${styles.btn} ${styles.btnGold}`} />
          ) : (
            <Link href="#logg-inn" className={`${styles.btn} ${styles.btnGold}`} aria-haspopup="dialog">
              Logg inn
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
