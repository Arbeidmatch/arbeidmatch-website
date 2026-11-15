import Link from "next/link";

import SeoLanding from "@/components/site/seo/SeoLanding";

/** Construction staffing on the site template (ORDER 295, stage 6b), with its own copy. */
export default function BemanningByggAnleggNb() {
  return (
    <SeoLanding
      eyebrow="Bemanning bygg og anlegg"
      title="Bemanning til bygg og anlegg med kontrollert arbeidskraft fra EU/EØS"
      intro={[
        <>
          Norske byggeprosjekter må balansere framdrift, sikkerhet og tilgang på fagfolk. ArbeidMatch setter
          arbeidsgivere i kontakt med forhåndskontrollerte kandidater fra EU/EØS, der dokumentasjon og forventninger
          avklares tidlig. Vi holder kommunikasjonen tydelig rundt{" "}
          <Link href="/for-employers">kravene til arbeidsgiver</Link> og hva vi dokumenterer på hvert oppdrag.
        </>,
        <>
          Når dere trenger internasjonale bygningsarbeidere, vurderer vi faglig match, sertifiseringer og språkbehov.
          Målet vårt er god matching, ikke volum. For regulerte yrker (for eksempel elektrikere), se{" "}
          <Link href="/electricians-norway">elektrikere i Norge</Link> der det er relevant. Start med en
          bemanningsbeskrivelse via{" "}
          <Link href="/request" data-rask-foresporsel>
            forespørselsskjemaet
          </Link>
          .
        </>,
      ]}
      roleCards={{
        heading: "Hvilke roller kan vi levere?",
        items: [
          ["Betongarbeider", "Erfaring med støping, herding og etterbehandling i byggemiljøer med høy bevissthet om sikkerhet."],
          ["Flislegger", "Presisjonsarbeid i våtrom og offentlige bygg, med vekt på kvalitet i utførelsen."],
          ["Tømrer", "Montering og konstruksjonsarbeid der både detaljer og tempo teller."],
          ["Maler", "Innvendig og utvendig arbeid med grundig forarbeid og god finish."],
          ["Stillasbygger", "Sertifiserte profiler med erfaring fra sikkert arbeid i høyden og rigging på prosjekt."],
          ["Hjelpearbeider for rørlegger", "Strukturert støtte i team der fagansvaret er tydelig fordelt."],
          ["Anleggsarbeider", "Maskinassistert arbeid, rigging og logistikkstøtte på aktive byggeplasser."],
          ["Elektriker (autorisert)", "Når prosjektet krever norsk autorisasjon, kontrollerer vi kravene før presentasjonen."],
        ],
      }}
      cards={{
        heading: "Hvorfor velge ArbeidMatch?",
        items: [
          [
            "Bransjekunnskap",
            "Vi stiller presise screeningspørsmål om prosjekterfaring, sikkerhetsforhold og forventninger på byggeplassen.",
          ],
          [
            "Etterlevelse i praksis",
            "Vi hjelper med å avklare kontrakter, dokumentasjon og forventninger til lønnsnivå innenfor gjeldende krav.",
          ],
          [
            "Forutsigbar levering",
            "Med et tydelig omfang jobber vi mot milepæler som teamet deres kan planlegge og gjennomføre etter.",
          ],
        ],
      }}
      faq={{
        heading: "Ofte stilte spørsmål",
        items: [
          {
            q: "Kan vi få kandidater raskt?",
            a: "Tilgjengeligheten varierer med sesong og krav til sertifisering. Med en tydelig beskrivelse kan vi ofte presentere kandidater raskt.",
          },
          {
            q: "Hvordan kontrollerer dere dokumentasjonen?",
            a: "Vi gjennomgår relevante dokumenter og identitetsopplysninger ut fra risikoen i rollen og kundens krav.",
          },
          {
            q: "Tilbyr dere ulike ansettelsesmodeller?",
            a: "Ja. Vi tilpasser leveransemodellen til behovene deres og det juridiske rammeverket, med tydelig ansvarsfordeling.",
          },
          {
            q: "Hva med språk og HMS?",
            a: "Vi vurderer språk og praktisk erfaring opp mot kravene i prosjektet. Sikkerhetsbevissthet er et grunnleggende krav.",
          },
        ],
      }}
      seeAlso={[
        { href: "/bemanning-logistikk", label: "Logistikk og lager" },
        { href: "/bemanning-industri", label: "Industri og produksjon" },
        { href: "/bemanningsbyrå-trondheim", label: "Bemanning i Trondheim" },
        { href: "/electricians-norway", label: "Elektrikere i Norge" },
      ]}
      closing={{
        heading: "Klare til å bemanne byggeplassen?",
        body: "Send oss kravene til rollen, så svarer vi med kandidatprofiler og en praktisk leveranseplan.",
      }}
      primary="Be om kandidater"
      secondary={{ label: "Se tjenester for arbeidsgivere", href: "/for-employers" }}
    />
  );
}
