import Link from "next/link";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const roleCardClass =
  "group relative rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]";

function RoleIcon() {
  return (
    <svg
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-hover:scale-110 md:h-6 md:w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path d="M12 3v18M8 8h8M8 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function BemanningByggAnleggNb() {
  return (
    <article className="bg-white">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
          <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-gold-ink">Bemanning bygg og anlegg</p>
          <h1 className="am-h1 mt-3 max-w-[700px] font-extrabold leading-tight tracking-tight text-navy">
            Bemanning til bygg og anlegg med kontrollert arbeidskraft fra EU/EØS
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-content space-y-12 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-[100px]">
        <section className="max-w-3xl space-y-4 leading-relaxed text-text-secondary">
          <p>
            Norske byggeprosjekter må balansere framdrift, sikkerhet og tilgang på fagfolk. ArbeidMatch setter
            arbeidsgivere i kontakt med forhåndskontrollerte kandidater fra EU/EØS, der dokumentasjon og forventninger
            avklares tidlig. Vi holder kommunikasjonen tydelig rundt{" "}
            <Link href="/for-employers" className="font-medium text-gold-ink hover:underline">
              kravene til arbeidsgiver
            </Link>{" "}
            og hva vi dokumenterer på hvert oppdrag.
          </p>
          <p>
            Når dere trenger internasjonale bygningsarbeidere, vurderer vi faglig match, sertifiseringer og språkbehov.
            Målet vårt er god matching, ikke volum. For regulerte yrker (for eksempel elektrikere), se{" "}
            <Link href="/electricians-norway" className="font-medium text-gold-ink hover:underline">
              elektrikere i Norge
            </Link>{" "}
            der det er relevant. Start med en bemanningsbeskrivelse via{" "}
            <Link href="/request" className="font-medium text-gold-ink hover:underline">
              forespørselsskjemaet
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Hvilke roller kan vi levere?</h2>
          <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
            {[
              [
                "Betongarbeider",
                "Erfaring med støping, herding og etterbehandling i byggemiljøer med høy bevissthet om sikkerhet.",
              ],
              ["Flislegger", "Presisjonsarbeid i våtrom og offentlige bygg, med vekt på kvalitet i utførelsen."],
              ["Tømrer", "Montering og konstruksjonsarbeid der både detaljer og tempo teller."],
              ["Maler", "Innvendig og utvendig arbeid med grundig forarbeid og god finish."],
              ["Stillasbygger", "Sertifiserte profiler med erfaring fra sikkert arbeid i høyden og rigging på prosjekt."],
              ["Hjelpearbeider for rørlegger", "Strukturert støtte i team der fagansvaret er tydelig fordelt."],
              ["Anleggsarbeider", "Maskinassistert arbeid, rigging og logistikkstøtte på aktive byggeplasser."],
              ["Elektriker (autorisert)", "Når prosjektet krever norsk autorisasjon, kontrollerer vi kravene før presentasjonen."],
            ].map(([title, text]) => (
              <li key={title} className={`${roleCardClass} p-6 md:p-7`} style={{ padding: "28px 24px" }}>
                <div className="flex items-start gap-3">
                  <RoleIcon />
                  <div>
                    <h3 className="text-lg font-semibold text-navy">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Hvorfor velge ArbeidMatch?</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
            {[
              {
                t: "Bransjekunnskap",
                b: "Vi stiller presise screeningspørsmål om prosjekterfaring, sikkerhetsforhold og forventninger på byggeplassen.",
              },
              {
                t: "Etterlevelse i praksis",
                b: "Vi hjelper med å avklare kontrakter, dokumentasjon og forventninger til lønnsnivå innenfor gjeldende krav.",
              },
              {
                t: "Forutsigbar levering",
                b: "Med et tydelig omfang jobber vi mot milepæler som teamet deres kan planlegge og gjennomføre etter.",
              },
            ].map((u) => (
              <article key={u.t} className={`${roleCardClass} p-6`} style={{ padding: "28px 24px" }}>
                <div className="flex items-start gap-3">
                  <RoleIcon />
                  <div>
                    <h3 className="text-base font-semibold text-navy">{u.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{u.b}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-navy">Ofte stilte spørsmål</h2>
          <dl className="mx-auto mt-6 max-w-[800px] space-y-6 px-0 md:px-4">
            {[
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
            { href: "/bemanning-logistikk", label: "Logistikk og lager" },
            { href: "/bemanning-industri", label: "Industri og produksjon" },
            { href: "/bemanningsbyrå-trondheim", label: "Bemanning i Trondheim" },
            { href: "/electricians-norway", label: "Elektrikere i Norge" },
          ]}
        />

        <section className="rounded-2xl border border-gold/30 bg-navy px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Klare til å bemanne byggeplassen?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80">
            Send oss kravene til rollen, så svarer vi med kandidatprofiler og en praktisk leveranseplan.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Link
              href="/request"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-navy hover:bg-gold-hover sm:w-auto"
            >
              Be om kandidater
            </Link>
            <Link
              href="/for-employers"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Se tjenester for arbeidsgivere
            </Link>
          </div>
        </section>
      </div>
    </article>
  );
}
