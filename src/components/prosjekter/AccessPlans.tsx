"use client";

import Link from "next/link";
import type { AccessPlan } from "@/lib/prosjekter/access";
import styles from "./access-plans.module.css";

export const ACCESS_PLAN_NAMES: Record<AccessPlan, string> = { trial: "Prøveperiode", regional: "Regional", national: "Hele Norge" };

export default function AccessPlans({ onChoose }: { onChoose: (plan: AccessPlan) => void }) {
  return <section className={styles.plans} aria-label="Velg tilgang">
    <div className={styles.heading}><span>VELG TILGANG</span><h3>Velg hvor du vil vokse.</h3></div>
    <aside className={styles.trial}><div><strong>Start med en gratis prøveperiode</strong><p>Ett fylke · Ett fagområde · Ukentlig e-post · Én mottaker</p><small>Prøveperiodens sluttdato bekreftes før aktivering.</small></div><button type="button" onClick={() => onChoose("trial")}>Prøv Forsprang →</button></aside>
    <div className={styles.cards}>{(["regional", "national"] as const).map(plan => <article key={plan} className={styles.card}>
      <span className={styles.eyebrow}>{plan === "regional" ? "NÆRMERE DITT MARKED" : "DET STORE BILDET"}</span>
      <h4>{ACCESS_PLAN_NAMES[plan]}</h4>
      <ul><li>{plan === "regional" ? "Ett eller flere fylker du velger selv" : "Alle norske fylker inkludert"}</li><li>Tilgang innenfor valgte fagområder</li></ul>
      <strong>Tilpasset tilbud</strong>
      <button type="button" onClick={() => onChoose(plan)}>Velg {ACCESS_PLAN_NAMES[plan]} →</button>
    </article>)}</div>
    <section className={styles.benefits}>
      <h4>Begge abonnementer inkluderer</h4>
      <p className={styles.notifications}>Daglig eller ukentlig e-post · Tre mottakere</p>
      <div><p>Prosjektnavn og involverte virksomheter</p><p>Verdi, fase og frister</p><p>Dokumenter og kilder</p><p>Kart, søk og prosjektoppdateringer</p></div>
      <small>Detaljer der kildene har dem, innenfor dine områder og fag.</small>
    </section>
    <p className={styles.pending}>Du sender en forespørsel. Vilkår avtales før ArbeidMatch aktiverer tilgang og varsler.</p>
    <footer><Link href="/privacy" target="_blank" rel="noopener noreferrer">Personvern</Link><Link href="/terms" target="_blank" rel="noopener noreferrer">Vilkår</Link></footer>
  </section>;
}
