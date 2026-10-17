"use client";

import Link from "next/link";
import type { AccessPlan } from "@/lib/prosjekter/access";
import styles from "./access-plans.module.css";

export const ACCESS_PLAN_NAMES: Record<AccessPlan, string> = { trial: "Prøveperiode", regional: "Regional", national: "Hele Norge" };

export default function AccessPlans({ onChoose }: { onChoose: (plan: AccessPlan) => void }) {
  return <section className={styles.plans} aria-label="Velg tilgang">
    <div className={styles.heading}><span>VELG TILGANG</span><h3>Finn mulighetene.<br />Velg hvor du vil vokse.</h3><p>Prosjektdetaljer, dokumenter og oppdateringer samlet på ett sted.</p></div>
    <aside className={styles.trial}><div><strong>Start med en gratis prøveperiode</strong><p>Ett fylke · Ett fagområde · Ukentlig e-post · Én mottaker</p><small>Prøveperiodens sluttdato bekreftes før aktivering.</small></div><button type="button" onClick={() => onChoose("trial")}>Prøv Forsprang →</button></aside>
    <div className={styles.cards}>{(["regional", "national"] as const).map(plan => <article key={plan} className={styles.card}>
      <span className={styles.eyebrow}>{plan === "regional" ? "NÆRMERE DITT MARKED" : "DET STORE BILDET"}</span>
      <h4>{ACCESS_PLAN_NAMES[plan]}</h4><p>{plan === "regional" ? "Følg prosjektene der dere jobber og ønsker nye oppdrag." : "Se mulighetene på tvers av landet og finn neste marked."}</p>
      <ul><li>{plan === "regional" ? "Ett eller flere fylker du velger selv" : "Alle norske fylker inkludert"}</li><li>Tilgang innenfor valgte fagområder</li><li>Daglig eller ukentlig prosjektoversikt</li><li>Tre e-postmottakere inkludert</li></ul>
      <strong>Tilpasset tilbud</strong><small>Endelig dekning og vilkår avtales før aktivering.</small>
      <button type="button" onClick={() => onChoose(plan)}>Velg {ACCESS_PLAN_NAMES[plan]} →</button>
    </article>)}</div>
    <section className={styles.benefits}><h4>Inkludert i begge abonnementene</h4><div><p><strong>Prosjektet bak overskriften</strong>Prosjektnavn, byggherre og involverte virksomheter.</p><p><strong>Verdi, fase og frister</strong>Planlagte prosjekter, åpne konkurranser og tildelte kontrakter.</p><p><strong>Dokumenter og kilder</strong>Tilgjengelige dokumenter og kunngjøringer.</p><p><strong>Kart og oppdateringer</strong>Søk, filtre og e-post om nye prosjekter og endringer.</p></div><small>Detaljer vises når de er tilgjengelige i kildene. Tilgangen gjelder områdene og fagene i abonnementet.</small></section>
    <p className={styles.pending}>Registreringen er en forespørsel. Tilgang og prosjektvarsler starter først etter at ArbeidMatch har aktivert abonnementet.</p>
    <footer><Link href="/privacy" target="_blank" rel="noopener noreferrer">Personvern</Link><Link href="/terms" target="_blank" rel="noopener noreferrer">Vilkår</Link></footer>
  </section>;
}
