import styles from "./explorer.module.css";

export default function ExplorerGuide() {
  return <details className={styles.guide}>
    <summary>Slik bruker du den nye prosjektvisningen</summary>
    <ol>
      <li><strong>Velg fagområde.</strong> Antallet øverst viser hvor mange prosjekter som passer. På mobil finner du søk, fase og område under «Flere filtre».</li>
      <li><strong>Åpne et prosjekt.</strong> På mobil bruker du «Velg prosjekt», «Forrige» og «Neste». På datamaskin velger du et prosjektkort og blar mellom sidene.</li>
      <li><strong>Utforsk kartet.</strong> På mobil bytter du mellom «Detaljer» og «3D-kart». «Hele Norge» viser oversikten. Tallet i en boble er antall prosjekter, fargene viser fasene og størrelsen viser verdien. Trykk på en boble for å zoome inn eller velge fra gruppen.</li>
      <li><strong>Bruk musen direkte.</strong> Rull for å zoome. Dra med venstre museknapp for å flytte kartet, eller med høyre museknapp for å rotere og vippe. Du trenger ikke holde inne Ctrl.</li>
      <li><strong>Finn frem geografisk.</strong> Administrative grenser og stedsnavn ligger over terrenget. Flere lokale navn kommer frem når du zoomer inn.</li>
      <li><strong>Kartet viser områder.</strong> Posisjonene er stedsreferanser for byer eller kommuner, ikke bekreftede byggeplasser. En boble ved vann betyr ikke at prosjektet skal bygges i vannet.</li>
      <li><strong>Se fullstendige detaljer.</strong> Med abonnement får du prosjektnavn, oppgitt verdi, byggherre, entreprenør, frister og tilgjengelige dokumenter. Du kan lagre prosjekter i nettleseren og sammenligne opptil tre.</li>
    </ol>
  </details>;
}
