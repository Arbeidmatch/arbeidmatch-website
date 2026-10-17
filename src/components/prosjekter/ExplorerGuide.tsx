import styles from "./explorer.module.css";

export default function ExplorerGuide({ mobile = false }: { mobile?: boolean }) {
  return <details className={styles.guide}>
    <summary>Hjelp med prosjektvisningen</summary>
    <ul>
      <li><strong>Finn prosjekter.</strong> {mobile ? 'Velg fagområde. Åpne «Flere filtre» for søk, fase og område.' : 'Velg fagområde, eller bruk søk, fase og område.'}</li>
      <li><strong>Se detaljer.</strong> {mobile ? 'Bruk «Velg prosjekt» eller «Forrige» og «Neste». Bytt mellom «Detaljer» og «3D-kart».' : 'Velg et prosjektkort. Bruk sidene under kortene for å se flere.'}</li>
      <li><strong>Bruk kartet.</strong> Trykk på en boble for å utforske prosjektene. {mobile ? 'Dra for å flytte, og bruk to fingre for å zoome.' : 'Dra for å flytte, og rull for å zoome.'} «Hele Norge» viser oversikten. Kartet viser områder, ikke nøyaktige byggeplasser.</li>
    </ul>
  </details>;
}
