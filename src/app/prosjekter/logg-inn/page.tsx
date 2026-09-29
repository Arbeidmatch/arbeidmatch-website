import type { Metadata } from "next";

import LoginForm from "@/components/prosjekter/LoginForm";
import styles from "@/components/prosjekter/portal.module.css";

export const metadata: Metadata = {
  title: { absolute: "Logg inn | Prosjekter | ArbeidMatch" },
  description: "Logg inn på prosjektsiden med en lenke på e-post.",
  alternates: { canonical: "/prosjekter/logg-inn" },
  robots: { index: false, follow: true },
};

/** Login to a client's project page: no password, a link by e-mail (see api/prosjekter/login). */
export default function ProsjekterLoggInnPage() {
  return (
    <div className={styles.portal} style={{ minHeight: "70vh" }}>
      <div className={styles.narrow}>
        <p className={styles.eyebrow}>Prosjekter · for kunder</p>
        <h1>Logg inn</h1>
        <p className={styles.lede}>
          Skriv e-postadressen dere fikk tilgang med, så sender vi en lenke som logger deg rett inn. Du trenger ikke passord.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
