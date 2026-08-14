import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { FlisleggerBrand } from "../FlisleggerBrand";

export const metadata: Metadata = {
  title: "Personvern for Flislegger",
  description: "Slik behandler ArbeidMatch personopplysninger fra prosjektforespørsler og nyhetsbrev.",
};

const sections = [
  {
    title: "1. Hvem er behandlingsansvarlig?",
    content: <><p>ArbeidMatch Norge AS, org.nr. 935 667 089 MVA, er behandlingsansvarlig for opplysningene som samles inn gjennom Flislegger-avdelingen.</p><p>Adresse: Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norge.</p></>,
  },
  {
    title: "2. Hvilke opplysninger samler vi inn?",
    content: <p>Vi kan samle inn navn, e-postadresse, telefonnummer, kunde- og tjenestetype, prosjektadresse eller postnummer, ønsket oppstart og opplysninger du selv skriver om prosjektet. Vi registrerer også om du har godkjent personvernerklæringen og om du frivillig har samtykket til nyhetsbrev.</p>,
  },
  {
    title: "3. Hvorfor bruker vi opplysningene?",
    content: <><p>Opplysningene fra prosjektforespørselen brukes for å vurdere behovet ditt, kontakte deg, avtale befaring, utarbeide et tilbud og følge opp et mulig eller inngått kundeforhold.</p><p>E-postadressen brukes til nyheter, prosjektinspirasjon og tilbud bare dersom du har krysset av i den separate, valgfrie boksen for nyhetsbrev.</p></>,
  },
  {
    title: "4. Behandlingsgrunnlag",
    content: <><p>Når du ber oss vurdere et prosjekt, behandler vi opplysninger for å besvare henvendelsen og gjennomføre tiltak før en eventuell avtale. Der behandlingen bygger på samtykke, kan samtykket trekkes tilbake når som helst.</p><p>Nyhetsbrev og markedsføring bygger på ditt frivillige og separate samtykke. Det er ikke nødvendig å abonnere for å sende inn en prosjektforespørsel.</p></>,
  },
  {
    title: "5. Hvem mottar opplysningene?",
    content: <p>Opplysningene er tilgjengelige for autoriserte medarbeidere i ArbeidMatch og, når det er nødvendig for å vurdere eller utføre prosjektet, relevante fagpersoner og leverandører. Vi deler ikke kontaktopplysningene dine med andre for deres egen markedsføring.</p>,
  },
  {
    title: "6. Lagring og sletting",
    content: <p>Prosjektforespørsler lagres bare så lenge det er nødvendig for å besvare henvendelsen, følge opp prosjektet og oppfylle dokumentasjons- eller lovkrav. Når formålet ikke lenger gjelder, slettes eller anonymiseres opplysningene. Opplysninger på nyhetsbrevlisten beholdes frem til du melder deg av eller samtykket på annen måte trekkes tilbake.</p>,
  },
  {
    title: "7. Dine rettigheter",
    content: <p>Du kan be om innsyn, retting, sletting, begrensning eller dataportabilitet, og du kan protestere mot behandling når regelverket gir deg rett til det. Du kan når som helst trekke tilbake et samtykke. Du har også rett til å klage til Datatilsynet.</p>,
  },
  {
    title: "8. Nyhetsbrev og avmelding",
    content: <p>Samtykke til nyhetsbrev er frivillig, ikke forhåndsavkrysset og holdes adskilt fra prosjektforespørselen. Du kan melde deg av via lenken i en utsendelse eller ved å kontakte oss. Tilbaketrekking påvirker ikke lovligheten av behandling som allerede har skjedd.</p>,
  },
  {
    title: "9. Sikkerhet og endringer",
    content: <p>Vi bruker tekniske og organisatoriske tiltak for å beskytte opplysningene mot uautorisert tilgang, tap og misbruk. Erklæringen kan oppdateres dersom tjenesten eller regelverket endres. Gjeldende versjon publiseres alltid på denne siden.</p>,
  },
];

export default function FlisleggerPrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#0f1923]">
      <style>{`.ats-route-progress{background-color:#1d9e75!important}`}</style>
      <header className="border-b border-[#0f1923]/10 bg-[#0f1923] text-white">
        <div className="mx-auto flex min-h-[76px] max-w-5xl items-center justify-between px-5 sm:px-8">
          <FlisleggerBrand />
          <Link href="/flislegger#kontakt" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#0f1923]">Kontakt oss</Link>
        </div>
      </header>

      <main>
        <section className="bg-[#0f1923] pb-20 pt-14 text-white sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">
            <Link href="/flislegger" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Tilbake til Flislegger</Link>
            <div className="mt-10 max-w-3xl"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1d9e75]"><ShieldCheck className="h-6 w-6" /></div><p className="mt-8 text-xs font-bold uppercase tracking-[0.22em] text-[#1d9e75]">Personvern</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Dine opplysninger. Tydelig forklart.</h1><p className="mt-6 text-lg leading-relaxed text-white/65">Denne erklæringen gjelder opplysninger som behandles gjennom ArbeidMatch sin Flislegger-tjeneste.</p><p className="mt-4 text-sm text-white/45">Sist oppdatert: 12. august 2026</p></div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-12">{sections.map(section => <article key={section.title} className="border-b border-[#0f1923]/10 pb-10"><h2 className="text-2xl font-semibold tracking-[-0.02em]">{section.title}</h2><div className="mt-4 space-y-4 leading-relaxed text-[#0f1923]/70">{section.content}</div></article>)}</div>
            <aside className="lg:sticky lg:top-8 lg:self-start"><div className="rounded-[20px] bg-[#0f1923] p-6 text-white"><h2 className="text-lg font-semibold">Kontakt om personvern</h2><p className="mt-3 text-sm leading-relaxed text-white/60">Skriv til oss hvis du vil bruke rettighetene dine eller trekke tilbake samtykke.</p><a href="mailto:flislegger@arbeidmatch.no" className="mt-6 flex min-h-11 items-center gap-3 text-sm font-semibold hover:text-[#1d9e75]"><Mail className="h-4 w-4" /> flislegger@arbeidmatch.no</a><a href="tel:+4741063773" className="flex min-h-11 items-center gap-3 text-sm font-semibold hover:text-[#1d9e75]"><Phone className="h-4 w-4" /> +47 410 63 773</a></div></aside>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#0f1923]/10 py-8"><div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 text-sm text-[#0f1923]/55 sm:flex-row sm:justify-between sm:px-8"><p>© {new Date().getFullYear()} ArbeidMatch Norge AS</p><p>Org.nr. 935 667 089 MVA</p></div></footer>
    </div>
  );
}
