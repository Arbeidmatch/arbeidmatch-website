import Image from "next/image";
import Link from "next/link";
import { jobUrl, type PublicJob } from "@/lib/jobs-fetch";
import { Reveal } from "./Reveal";

/**
 * Direction: a Scandinavian studio page. Warm white, one dark photograph,
 * serif headlines set light, lists with hairlines instead of cards. Gold is a
 * one pixel line and the Beta pill, never a button; the two buttons are the
 * green "ask us for people" and the outlined "find a job" of the client pages.
 */

const INDUSTRIES: Array<{ name: string; trades: string; href: string }> = [
  { name: "Bygg og anlegg", trades: "Tømrer, betong, flislegger, forskaling", href: "/bemanning-bygg-anlegg" },
  { name: "Elektro og teknikk", trades: "Elektriker, automatiker, montør", href: "/electricians-norway" },
  { name: "Industri og produksjon", trades: "Sveiser, operatør, mekaniker", href: "/bemanning-industri" },
  { name: "Logistikk og transport", trades: "Sjåfør, lager, truck", href: "/bemanning-logistikk" },
  { name: "Renhold og drift", trades: "Renholder, vaktmester", href: "/bemanning-renhold" },
  { name: "Horeca og helse", trades: "Kokk, servitør, helsefagarbeider", href: "/bemanning-horeca" },
];

const btn = "inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md px-5 text-[14.5px] font-semibold tracking-[0.01em]";
const btnGreen = `${btn} bg-[#1d9e75] text-white`;
const btnOutline = `${btn} border-[1.5px] border-navy text-navy`;
const tlink = "border-b border-gold pb-px text-[14.5px] font-medium text-navy";
const kicker = "text-[11.5px] font-medium uppercase tracking-[0.14em] text-text-secondary";
const serif = "font-[family-name:var(--font-serif)] font-light tracking-[-0.01em] [text-wrap:balance]";

function where(job: PublicJob): string {
  return (job.location ?? "").trim() || (job.country ?? "").trim() || "Norge";
}

export function BetaForside({ jobs, totalOpen }: { jobs: PublicJob[]; totalOpen: number }) {
  return (
    <div className="-mb-[40px] min-h-screen bg-[#fbfaf7] text-[#14202f] antialiased">
      <div className="border-b border-border text-[12.5px] text-text-secondary">
        <div className="mx-auto flex min-h-[34px] max-w-[1240px] items-center justify-between gap-4 px-6 sm:justify-center">
          <span>Nytt nettsted under utprøving.</span>
          <Link href="/feedback" className="border-b border-gold text-navy">Gi beskjed</Link>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-border bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-7 px-6 md:h-[76px]">
          <Link href="/beta" className={`flex items-center gap-3 text-[19px] font-medium text-navy md:text-[22px] ${serif} !font-medium`}>
            <Image src="/logo.png" alt="" width={38} height={38} className="h-[38px] w-[38px] rounded-full" priority />
            ArbeidMatch
            <span className="rounded-full border border-gold px-2 py-px text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gold-ink">Beta</span>
          </Link>
          <nav className="ml-3 hidden gap-6 text-[14.5px] font-medium md:flex">
            <a href="#bemanning">Bemanning</a>
            <a href="#bemanning">Rekruttering</a>
            <a href="#bransjer">Bransjer</a>
            <a href="#jobb">Ledige jobber</a>
            <a href="#om">Om oss</a>
          </nav>
          <span className="flex-1" />
          <div className="hidden gap-2.5 md:flex">
            <a href="#jobb" className={btnOutline}>Finn jobb</a>
            <Link href="/request" className={btnGreen}>Be om folk</Link>
          </div>
          <a href="#jobb" className="grid h-11 w-11 place-items-center rounded-md border border-border text-navy md:hidden" aria-label="Meny">
            <span aria-hidden="true" className="text-xl">&#9776;</span>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-6 pt-9 md:pt-[72px]">
        <div className="grid items-end gap-6 md:grid-cols-[1.2fr_0.8fr] md:gap-12">
          <Reveal>
            <h1 className={`${serif} text-[46px] leading-[1.02] text-navy md:text-[clamp(44px,6.2vw,92px)]`}>
              Fagfolk som <em className="italic">møter opp.</em>
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="md:pb-2.5">
              <p className="mb-5 max-w-[36ch] text-[16px] text-text-secondary md:text-[17px]">
                Bemanning og rekruttering til bygg, industri, elektro og logistikk. Dere sier hva dere trenger, vi tar resten.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/request" className={btnGreen}>Be om folk</Link>
                <a href="#jobb" className={btnOutline}>Finn jobb</a>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.3}>
          <figure className="relative mt-7 h-[300px] overflow-hidden rounded bg-navy md:mt-12 md:h-[620px]">
            <Image
              src="/images/home/carpenter-reviewed.webp"
              alt="Tømrer fra ArbeidMatch på en byggeplass i Trøndelag"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1240px"
              className="object-cover object-[center_35%]"
            />
            <figcaption className={`absolute bottom-4 left-[18px] text-white md:bottom-6 md:left-7 ${serif} text-[18px] md:text-[22px]`}>
              Byggeplass, Trøndelag
              <span className="mt-1 block font-sans text-[12px] uppercase tracking-[0.12em] opacity-80">Tømrere fra ArbeidMatch</span>
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <section id="om" className="mx-auto max-w-[1240px] px-6 py-14 md:py-24">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr] md:gap-12">
          <span className={kicker}>Om oss</span>
          <div>
            <h2 className={`${serif} text-[30px] leading-[1.08] text-navy md:text-[clamp(30px,3.6vw,50px)]`}>
              Et byrå som kjenner fagene, og folkene bak dem.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[16px] text-text-secondary md:text-[17px]">
              Vi snakker med hver kandidat før vi foreslår dem. Dere får én kontaktperson gjennom hele oppdraget, og fagfolk fra Norge og EØS som er klare for oppstart. Avdelinger i sør, midt og nord, så vi er nær byggeplassen.
            </p>
          </div>
        </div>
      </section>

      <section id="bemanning" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <div className="border-t border-navy pt-6">
            <span className={`${kicker} mb-3.5 block`}>For bedrifter</span>
            <h3 className={`${serif} mb-3 text-[30px] text-navy md:text-[36px]`}>Bemanning og rekruttering</h3>
            <p className="mb-5 max-w-[44ch] text-text-secondary">Send behovet: fag, antall, sted og oppstart. Vi svarer med kandidater vi har snakket med, og følger opp underveis.</p>
            <Link href="/for-employers" className={tlink}>Slik jobber vi</Link>
          </div>
          <div className="border-t border-navy pt-6">
            <span className={`${kicker} mb-3.5 block`}>For jobbsøkere</span>
            <h3 className={`${serif} mb-3 text-[30px] text-navy md:text-[36px]`}>Jobb i Norge</h3>
            <p className="mb-5 max-w-[44ch] text-text-secondary">Registrer fag og tilgjengelighet. Vi sier fra når en jobb passer, og hjelper med det praktiske før oppstart.</p>
            <Link href="/candidate-register" className={tlink}>Registrer deg</Link>
          </div>
        </div>
      </section>

      <section id="bransjer" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-5">
          <h2 className={`${serif} text-[30px] text-navy md:text-[clamp(30px,3.4vw,46px)]`}>Bransjer</h2>
          <Link href="/jobs" className={tlink}>Alle fag</Link>
        </div>
        <ul className="border-t border-navy">
          {INDUSTRIES.map((i) => (
            <li key={i.name} className="grid gap-1 border-b border-border py-3.5 md:grid-cols-[1fr_1.6fr_auto] md:items-center md:gap-6 md:py-[18px]">
              <span className={`${serif} !font-normal text-[22px] text-navy md:text-[26px]`}>{i.name}</span>
              <span className="text-[15px] text-text-secondary">{i.trades}</span>
              <Link href={i.href} className={`${tlink} mt-1.5 w-fit md:mt-0`}>Se faget</Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="jobb" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-5">
          <h2 className={`${serif} text-[30px] text-navy md:text-[clamp(30px,3.4vw,46px)]`}>Ledige jobber</h2>
          <Link href="/jobs" className={tlink}>{totalOpen > 0 ? `Alle ${totalOpen} jobber` : "Alle jobber"}</Link>
        </div>
        {jobs.length > 0 ? (
          <ul className="border-t border-navy">
            {jobs.map((job) => {
              const href = jobUrl(job);
              return (
                <li key={job.id} className="grid gap-1 border-b border-border py-3.5 md:grid-cols-[1.4fr_1.2fr_auto] md:items-center md:gap-6 md:py-[18px]">
                  <span className={`${serif} !font-normal text-[22px] text-navy md:text-[26px]`}>{job.title}</span>
                  <span className="text-[13.5px] text-text-secondary">
                    <b className="font-medium text-[#14202f]">{where(job)}</b>
                    {job.category ? `, ${job.category}` : ""}
                  </span>
                  {href ? <Link href={href} className={`${tlink} mt-1.5 w-fit md:mt-0`}>Se jobben</Link> : <span />}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="border-t border-navy pt-5 text-text-secondary">
            Ingen stillinger er åpne akkurat nå. <Link href="/candidate-register" className={tlink}>Registrer deg</Link>, så sier vi fra når en jobb passer faget ditt.
          </p>
        )}
      </section>

      <section id="forespørsel" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="flex flex-col items-start gap-6 border-t border-navy pt-10 md:flex-row md:items-center md:justify-between md:pt-14">
          <h2 className={`${serif} text-[32px] text-navy md:text-[clamp(32px,4vw,56px)]`}>Trenger dere folk?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/request" className={btnGreen}>Be om folk</Link>
            <Link href="/contact" className={btnOutline}>Ta kontakt</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border text-[14px] text-text-secondary">
        <div className="mx-auto max-w-[1240px] px-6 pb-7 pt-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <div className={`flex items-center gap-3 text-[20px] text-navy ${serif} !font-medium`}>
                <Image src="/logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-full" />
                ArbeidMatch Norge
              </div>
              <p className="mt-3 max-w-[38ch]">Bemanning og rekruttering for bygg, industri, elektro og logistikk i hele Norge.</p>
            </div>
            <div>
              <h4 className={`${kicker} mb-2.5 !text-[#14202f]`}>Bedrift</h4>
              <ul className="grid gap-1.5"><li><Link href="/for-employers">Bemanning</Link></li><li><Link href="/for-employers">Rekruttering</Link></li><li><a href="#bransjer">Bransjer</a></li><li><Link href="/request">Be om folk</Link></li></ul>
            </div>
            <div>
              <h4 className={`${kicker} mb-2.5 !text-[#14202f]`}>Jobbsøker</h4>
              <ul className="grid gap-1.5"><li><Link href="/jobs">Ledige jobber</Link></li><li><Link href="/candidate-register">Registrer deg</Link></li><li><Link href="/cv">CV-hjelp</Link></li><li><Link href="/become-a-partner">Bli partner</Link></li></ul>
            </div>
            <div>
              <h4 className={`${kicker} mb-2.5 !text-[#14202f]`}>Selskapet</h4>
              <ul className="grid gap-1.5"><li><Link href="/about">Om oss</Link></li><li><Link href="/contact">Kontakt</Link></li><li><Link href="/privacy">Personvern</Link></li><li><Link href="/cookies">Informasjonskapsler</Link></li></ul>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-border pt-4 text-[12.5px]">
            <span>ArbeidMatch Norge AS</span>
            <span>Beta: nettstedet er under utprøving.</span>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2.5 border-t border-border bg-[#fbfaf7] px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2.5 md:hidden">
        <a href="#jobb" className={`${btnOutline} flex-1`}>Finn jobb</a>
        <Link href="/request" className={`${btnGreen} flex-1`}>Be om folk</Link>
      </div>
      <div className="h-[72px] md:hidden" aria-hidden="true" />
    </div>
  );
}
