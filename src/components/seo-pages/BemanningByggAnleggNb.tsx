import Link from "next/link";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

export default function BemanningByggAnleggNb() {
  return (
    <article className="bg-white">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-content px-4 py-12 md:px-6 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Bemanning bygg</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-extrabold leading-tight tracking-tight text-navy md:text-4xl">
            Bemanning bygg og anlegg med dokumentert EU/EEA-kompetanse
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-content space-y-12 px-4 py-12 md:px-6 md:py-16">
        <section className="max-w-3xl space-y-4 text-[17px] leading-relaxed text-text-secondary">
          <p>
            Norske bygge- og anleggsprosjekter presses av parallelle utfordringer: stramme fremdriftsplaner, skjerpede
            HMS-krav og et arbeidsmarked der etterspørselen etter fagarbeidere bygg Norge overstiger tilgangen på
            raskt tilgjengelig arbeidskraft. Samtidig skal alt arbeid utføres lovlig, med riktige kontrakter,
            lønnsvilkår og kontrollrutiner som tåler offentlig innsyn. Resultatet er at mange entreprenører og
            underentreprenører bruker for mye tid på å lete etter riktige folk, i stedet for å lede produksjon.
          </p>
          <p>
            ArbeidMatch er et bemannings- og rekrutteringsmiljø som kobler norske virksomheter med forhåndsvurderte
            kandidater fra EU/EØS med relevant erfaring til bygg og anlegg. Vi jobber strukturert med screening,
            dokumentasjon og forventningsstyring slik at prosjektledere får tydelige profiler: fra betongarbeider og
            stillasbygger til maler, flislegger og snekker. Målet er ikke «mest mulig CV-er», men riktig match på
            fag, sikkerhet og gjennomføringsevne.
          </p>
          <p>
            Når dere trenger utenlandske byggearbeidere, er det avgjørende at bemanningen følger norsk regelverk for
            utleie, skatt og eventuelle tariff-/allmenngjøringskrav. Vi legger vekt på ryddige prosesser og tydelig
            dialog mellom oppdragsgiver, kandidat og vårt fagteam, slik at dere kan planlegge bemanning uten å
            kompromisse på kvalitet eller compliance.
          </p>
          <p>
            Rekruttering anlegg krever ofte parallelle disipliner: noen team trenger tung betongkompetanse, andre trenger
            presisjonsarbeid i tørt bygg. ArbeidMatch prioriterer derfor behovsforståelse foran volum. Vi kartlegger
            verktøy, sertifikater og erfaring med norsk byggeplasskultur, slik at dere slipper å bruke verdifull
            produksjonstid på gjentatte intervjuer som ikke leder til oppstart.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Hvilke fagarbeidere kan vi levere?</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              [
                "Betongarbeider",
                "Erfaring med støping, herding og overflatearbeid på anlegg med norske HMS-standarder.",
              ],
              ["Flislegger", "Presisjonsarbeid i våtrom og offentlige bygg med krav til dokumentert kvalitet."],
              ["Snekker", "Innredning, montering og tømrerarbeid der detaljer og fremdrift må gå hånd i hånd."],
              ["Maler", "Innendørs og utendørs arbeid med fokus på forberedelser, sprøyte- og rullteknikk."],
              ["Stillasbygger", "Sertifiserte profiler med erfaring fra høyder, sikring og rigg på store prosjekter."],
              ["Rørlegger / hjelpearbeider VVS", "Støttefunksjoner og strukturerte team der fagansvar er avklart."],
              ["Anleggsarbeider", "Maskinassistert arbeid, rigg og logistikk på anleggsområde."],
              ["Elektriker (autorisasjon)", "Der prosjektet krever dokumentert norsk autorisasjon, avklarer vi krav før presentasjon."],
            ].map(([title, text]) => (
              <li key={title} className="rounded-xl border border-border bg-surface p-5">
                <h3 className="text-lg font-semibold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Slik fungerer prosessen</h2>
          <ol className="mt-6 space-y-4 text-[17px] leading-relaxed text-text-secondary">
            <li>
              <span className="font-semibold text-navy">1. Krav og prosjektforståelse.</span> Vi kartlegger fag,
              sertifikater, språkbehov, skift og varighet. Dere får en tydelig kravspesifikasjon som styrer sourcing.
            </li>
            <li>
              <span className="font-semibold text-navy">2. Sourcing og kvalitetssikring.</span> Vi kontakter kandidater
              med dokumentert erfaring, gjennomfører intervjuer og kontroller grunnleggende papirflyt før presentasjon.
            </li>
            <li>
              <span className="font-semibold text-navy">3. Presentasjon og oppstart.</span> Dere møter utvalgte
              profiler, velger kandidat og planlegger oppstart sammen med oss. Ved behov støtter vi i praktisk
              onboarding og oppfølging i oppstartsøkten, inkludert avstemming av verktøy, påkledning og
              sikkerhetsbrief mot deres prosedyre.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Hvorfor velge ArbeidMatch til bemanning av bygg?</h2>
          <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-text-secondary">
            <p>
              <span className="font-semibold text-navy">Faglig tyngde.</span> Vi forstår forskjellen mellom anlegg og
              boligproduksjon, og vi stiller spørsmål som avdekker reell erfaring – ikke bare titler på CV-en.
            </p>
            <p>
              <span className="font-semibold text-navy">Compliance i praksis.</span> EU arbeidskraft skal inn i norske
              systemer på riktig måte. Vi veileder i avtalestruktur og dokumentasjon slik at hverdagen blir enklere for
              prosjektøkonomi og HR.
            </p>
            <p>
              <span className="font-semibold text-navy">Forutsigbar leveranse.</span> Når scope er avklart, jobber vi
              mot tydelige milepæler. Mange kunder verdsetter vår evne til å korte ned tid fra behov til produksjon.
            </p>
            <p>
              <span className="font-semibold text-navy">Lokal forankring, nasjonal dekning.</span> Vi opererer ut fra
              Trondheim med leveranser til prosjekter i hele Norge, og koordinerer reise og innkvartering der det er
              nødvendig.
            </p>
            <p>
              <span className="font-semibold text-navy">Partnerskap, ikke «bulk».</span> Vi bygger tillit gjennom
              åpenhet om hva som er mulig innenfor gitte rammer – og gjennom å si fra når krav og marked ikke møtes.
            </p>
            <p>
              <span className="font-semibold text-navy">Fagarbeidere bygg Norge.</span> Vi vet at kvalitet måles i
              millimeter på flis, i forankring på stillas og i herdefenster i betong. Derfor stiller vi presise
              spørsmål om tidligere prosjektstørrelse, type entreprise og referanser før vi anbefaler kandidat.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Ofte stilte spørsmål</h2>
          <dl className="mt-6 space-y-6">
            {[
              {
                q: "Kan vi få fagarbeidere på kort varsel?",
                a: "Tilgjengelighet varierer med sesong og sertifikatkrav. Med tydelig kravprofil kan vi ofte presentere kandidater raskt, men vi lover ikke «i morgen» uten faglig avklaring.",
              },
              {
                q: "Hvordan sikrer dere dokumentasjon?",
                a: "Vi gjennomgår relevante attester og identifikasjon i tråd med oppdragets risiko. Der autorisasjon kreves, avklarer vi dette før tilbud.",
              },
              {
                q: "Håndterer dere utleie og innleie?",
                a: "Vi tilpasser modell til deres behov og rammer, i dialog med deres juridiske avklaringer. Målet er ryddige kontrakter og tydelig ansvar.",
              },
              {
                q: "Hva med norsk og HMS?",
                a: "Vi vurderer språk og erfaring opp mot prosjektets krav. HMS er ikke et tillegg – det er en forutsetning for at bemanningen skal fungere i praksis.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-navy">{item.q}</dt>
                <dd className="mt-2 text-text-secondary">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <SeeAlsoSection
          variant="surface"
          items={[
            { href: "/bemanning-logistikk", label: "Logistikk & lager" },
            { href: "/bemanning-industri", label: "Industri & produksjon" },
            { href: "/bemanningsbyrå-trondheim", label: "Bemanning Trondheim" },
            { href: "/dsb-support", label: "DSB-godkjenning for elektrikere" },
          ]}
        />

        <section className="rounded-2xl border border-gold/30 bg-navy px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Klar for trygg bemanning på byggeplassen?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
            Send oss kravene deres – vi returnerer med konkrete profiler og en tydelig plan. Med god dokumentasjon og
            parallelle prosesser jobber vi mot kort leveringstid, ofte innenfor om lag{" "}
            <span className="font-semibold text-white">2 ukers leveringstid</span> for aktuelle roller der markedet
            tillater det.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/request"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-white hover:bg-gold-hover"
            >
              Bestill kandidater
            </Link>
            <Link
              href="/for-employers"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Les om arbeidsgiverløsningen
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
