import Link from "next/link";
import BemanningLegalSection from "@/components/bemanning/BemanningLegalSection";
import SeeAlsoSection from "@/components/seo/SeeAlsoSection";

const roleCardClass =
  "group relative rounded-xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C]";

function RoleIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-gold transition-transform duration-200 group-hover:scale-110"
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
            Norske bygge- og anleggsprosjekter må balansere fremdrift, HMS og tilgang på fagarbeidere. ArbeidMatch
            kobler virksomheter med forhåndsvurderte kandidater fra EU/EØS der dokumentasjon og forventninger er avklart
            tidlig. Vi tilstreber tydelig dialog om{" "}
            <Link href="/for-employers" className="font-medium text-gold hover:underline">
              arbeidsgiverbehov
            </Link>{" "}
            og leveranser innenfor gjeldende regelverk.
          </p>
          <p>
            Når dere trenger utenlandske byggearbeidere, kartlegger vi fag, sertifikater og språkbehov. Målet vårt er
            riktig match — ikke høyest mulig volum. For autoriserte roller (f.eks. elektriker) viser vi vei til{" "}
            <Link href="/dsb-support" className="font-medium text-gold hover:underline">
              DSB-godkjenning
            </Link>{" "}
            der det er relevant. Bestill behovsavklaring via{" "}
            <Link href="/request" className="font-medium text-gold hover:underline">
              forespørsel
            </Link>
            .
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
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                t: "Faglig tyngde",
                b: "Vi stiller presise spørsmål om erfaring fra norsk byggeplasskultur og prosjektstørrelse — basert på vår erfaring med rekruttering til bygg.",
              },
              {
                t: "Compliance i praksis",
                b: "Vi arbeider for å avklare avtaler, dokumentasjon og tariff/allmenngjøring der det inngår i oppdraget — i tråd med gjeldende krav.",
              },
              {
                t: "Forutsigbar leveranse",
                b: "Med tydelig scope jobber vi mot milepæler dere kan planlegge etter. Målet er færre avbrudd i produksjonstid.",
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
                a: "Vi vurderer språk og erfaring opp mot prosjektets krav. HMS er en forutsetning for at bemanningen skal fungere i praksis.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="font-semibold text-navy">{item.q}</dt>
                <dd className="mt-2 text-text-secondary">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <BemanningLegalSection />

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
            Send oss kravene deres — vi returnerer med profiler og en plan. Vi tilstreber kort tid fra avklaring til
            oppstart der markedet tillater det, ofte i om lag{" "}
            <span className="font-semibold text-white">2 ukers leveringstid</span> for relevante roller.
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
