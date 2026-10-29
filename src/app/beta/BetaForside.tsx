import Image from "next/image";
import Link from "next/link";
import { Reveal } from "./Reveal";

/**
 * Design plan, his brief of 29 October 2026.
 *
 * Colour: paper #FBFAF7, ink #14202F, navy #0D1B2A, mist #6B7382, hairline
 * #E6E1D6, gold #C9A84C (a one pixel line, never a fill), green #1D9E75 (the
 * one button that asks us for people).
 * Type: Cormorant Garamond 300 for the headlines on a five step scale
 * (92, 56, 36, 26, 17), Plus Jakarta Sans for the text at 17 and 15, small
 * labels in 11.5 uppercase with 0.14em of tracking.
 * Layout: everything left aligned on a 1240 measure. One bold element, the
 * photograph across the width with the headline cut over its top edge; all
 * else quiet: lists with hairlines, no cards, no gradients, no icons.
 * Repetition: no button or text twice in sight (his rule, 29 October 2026):
 * the header carries only the menu, the hero the two buttons, the phone bar
 * replaces them below 768px, the beta line stands once, at the top.
 * Motion: one load sequence (headline, promise, photograph), then only
 * answers to the reader's hand: the gold line under a link thickens, a list
 * row warms, the green button darkens under the finger.
 */

const INDUSTRIES: Array<{ name: string; trades: string; href: string }> = [
  { name: "Bygg og anlegg", trades: "Tømrer, betong, flislegger, forskaling", href: "/bemanning-bygg-anlegg" },
  { name: "Elektro og teknikk", trades: "Elektriker, automatiker, montør", href: "/electricians-norway" },
  { name: "Industri og produksjon", trades: "Sveiser, operatør, mekaniker", href: "/bemanning-industri" },
  { name: "Logistikk og transport", trades: "Sjåfør, lager, truck", href: "/bemanning-logistikk" },
  { name: "Renhold og drift", trades: "Renholder, vaktmester", href: "/bemanning-renhold" },
  { name: "Horeca og helse", trades: "Kokk, servitør, helsefagarbeider", href: "/bemanning-horeca" },
];

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy";
const btn = `inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md px-5 text-[14.5px] font-semibold tracking-[0.01em] transition-colors duration-150 ${focus}`;
const btnGreen = `${btn} bg-[#1d9e75] text-white hover:bg-[#1a9069] active:bg-[#157c5b]`;
const btnOutline = `${btn} border-[1.5px] border-navy text-navy hover:bg-navy/[0.04] active:bg-navy/[0.08]`;
const tlink = `inline-block bg-[linear-gradient(#C9A84C,#C9A84C)] bg-[length:100%_1px] bg-[position:0_100%] bg-no-repeat pb-0.5 text-[14.5px] font-medium text-navy transition-[background-size] duration-200 hover:bg-[length:100%_2px] ${focus}`;
const label = "text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#6b7382]";
const serif = "font-[family-name:var(--font-serif)] font-light tracking-[-0.01em] [text-wrap:balance]";
const row = "grid gap-1 border-b border-[#e6e1d6] py-3.5 transition-colors duration-200 hover:bg-[#f4f1ea] md:-mx-3 md:items-center md:gap-6 md:px-3 md:py-[18px]";

export function BetaForside({ totalOpen }: { totalOpen: number }) {
  return (
    <div
      className="-mb-[40px] min-h-screen bg-[#fbfaf7] text-[#14202f] antialiased [--t1:46px] [--t2:30px] [--t3:26px] [--t4:22px] [--t5:17px] md:[--t1:clamp(56px,6.4vw,92px)] md:[--t2:56px] md:[--t3:36px] md:[--t4:26px]"
    >
      <div className="border-b border-[#e6e1d6] text-[12.5px] text-[#6b7382]">
        <div className="mx-auto flex min-h-[34px] max-w-[1240px] items-center justify-between gap-4 px-6 sm:justify-center">
          <span>Nytt nettsted under utprøving.</span>
          <Link href="/feedback" className={tlink.replace("text-[14.5px]", "text-[12.5px]")}>Gi beskjed</Link>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-[#e6e1d6] bg-[#fbfaf7]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-7 px-6 md:h-[76px]">
          <Link href="/beta" className={`flex items-center gap-3 text-[19px] text-navy md:text-[22px] ${serif} !font-medium ${focus}`}>
            <Image src="/logo.png" alt="" width={38} height={38} className="h-[38px] w-[38px] rounded-full" priority />
            ArbeidMatch
            <span className="rounded-full border border-gold px-2 py-px text-[10.5px] font-semibold uppercase tracking-[0.12em] text-gold-ink">Beta</span>
          </Link>
          <nav className="ml-3 hidden gap-6 text-[14.5px] font-medium md:flex">
            <a href="#bemanning" className={`${focus} hover:text-gold-ink`}>Bemanning</a>
            <a href="#bransjer" className={`${focus} hover:text-gold-ink`}>Bransjer</a>
            <Link href="/jobs" className={`${focus} hover:text-gold-ink`}>Ledige jobber</Link>
            <a href="#om" className={`${focus} hover:text-gold-ink`}>Om oss</a>
          </nav>
          <span className="flex-1" />
          <a href="#bransjer" className={`grid h-11 w-11 place-items-center rounded-md border border-[#e6e1d6] text-navy md:hidden ${focus}`} aria-label="Til innholdet">
            <span aria-hidden="true" className="text-xl">&#9776;</span>
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-[1240px] px-6 pt-9 md:pt-[72px]">
        <div className="relative z-10 grid items-end gap-6 md:grid-cols-[1.2fr_0.8fr] md:gap-12">
          <Reveal>
            <h1 className={`${serif} text-[length:var(--t1)] leading-[1.0] text-navy`}>
              Fagfolk som møter opp.
            </h1>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="md:pb-16">
              <p className="mb-5 max-w-[36ch] text-[16px] leading-[1.6] text-[#4b5563] md:text-[17px]">
                Bemanning og rekruttering til bygg, industri, elektro og logistikk. Dere sier hva dere trenger, vi tar resten.
              </p>
              <div className="hidden flex-wrap gap-3 md:flex">
                <Link href="/request" className={btnGreen}>Be om folk</Link>
                <Link href="/jobs" className={btnOutline}>Finn jobb</Link>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal delay={0.3}>
          <figure className="relative -mt-3 h-[300px] overflow-hidden rounded bg-navy md:-mt-[0.28em] md:h-[640px] md:text-[length:var(--t1)]">
            <Image
              src="/images/home/carpenter-reviewed.webp"
              alt="Tømrer fra ArbeidMatch måler en bjelke på en byggeplass i Trøndelag"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1240px"
              className="object-cover object-[center_38%] max-md:origin-top max-md:scale-[1.12] max-md:object-top"
            />
            <figcaption className={`absolute bottom-4 left-[18px] text-[18px] text-white md:bottom-6 md:left-7 md:text-[22px] ${serif}`}>
              Byggeplass, Trøndelag
              <span className="mt-1 block font-sans text-[12px] uppercase tracking-[0.12em] opacity-80">Tømrere fra ArbeidMatch</span>
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <section id="om" className="mx-auto max-w-[1240px] px-6 py-14 md:py-24">
        <div className="grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:gap-16">
          <div>
            <span className={`${label} mb-5 block`}>Om oss</span>
            <h2 className={`${serif} text-[length:var(--t2)] leading-[1.06] text-navy`}>
              Et byrå som kjenner fagene, og folkene bak dem.
            </h2>
            <p className="mt-6 max-w-[58ch] text-[16px] leading-[1.65] text-[#4b5563] md:text-[17px]">
              Vi snakker med hver kandidat før vi foreslår dem. Dere får én kontaktperson gjennom hele oppdraget, og fagfolk fra Norge og EØS som er klare for oppstart. Avdelinger i sør, midt og nord, så vi er nær byggeplassen.
            </p>
            <Link href="/about" className={`${tlink} mt-7`}>Mer om oss</Link>
          </div>
          <figure className="relative h-[320px] overflow-hidden rounded bg-navy md:h-auto md:min-h-[420px]">
            <Image
              src="/images/home/painter.webp"
              alt="Maler fra ArbeidMatch ruller en vegg i en leilighet med utsikt mot fjorden"
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="origin-top scale-[1.14] object-cover object-[60%_top]"
            />
          </figure>
        </div>
      </section>

      <section id="bemanning" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="grid gap-8 md:grid-cols-2 md:gap-16">
          <div className="border-t border-navy pt-6">
            <span className={`${label} mb-3.5 block`}>For bedrifter</span>
            <h3 className={`${serif} mb-3 text-[length:var(--t3)] leading-[1.1] text-navy`}>Bemanning og rekruttering</h3>
            <p className="mb-5 max-w-[44ch] leading-[1.6] text-[#4b5563]">Send behovet: fag, antall, sted og oppstart. Vi svarer med kandidater vi har snakket med, og følger opp underveis.</p>
            <Link href="/for-employers" className={tlink}>Slik jobber vi</Link>
          </div>
          <div className="border-t border-navy pt-6">
            <span className={`${label} mb-3.5 block`}>For jobbsøkere</span>
            <h3 className={`${serif} mb-3 text-[length:var(--t3)] leading-[1.1] text-navy`}>Jobb i Norge</h3>
            <p className="mb-5 max-w-[44ch] leading-[1.6] text-[#4b5563]">Registrer fag og tilgjengelighet. Vi sier fra når en jobb passer, og hjelper med det praktiske før oppstart.</p>
            <div className="flex flex-wrap gap-x-7 gap-y-2"><Link href="/jobs" className={tlink}>{totalOpen > 0 ? `Se ${totalOpen} ledige jobber` : "Ledige jobber"}</Link><Link href="/candidate-register" className={tlink}>Registrer deg</Link></div>
          </div>
        </div>
      </section>

      <section id="bransjer" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-5">
          <h2 className={`${serif} text-[length:var(--t2)] leading-[1.06] text-navy`}>Bransjer</h2>
          <Link href="/jobs" className={tlink}>Alle fag</Link>
        </div>
        <ul className="border-t border-navy">
          {INDUSTRIES.map((i) => (
            <li key={i.name} className={`${row} md:grid-cols-[1fr_1.6fr_auto]`}>
              <span className={`${serif} !font-normal text-[length:var(--t4)] text-navy`}>{i.name}</span>
              <span className="text-[15px] text-[#4b5563]">{i.trades}</span>
              <Link href={i.href} className={`${tlink} mt-1.5 w-fit md:mt-0`}>Se faget</Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="forespørsel" className="mx-auto max-w-[1240px] px-6 pb-14 md:pb-24">
        <div className="flex flex-col items-start gap-6 border-t border-navy pt-10 md:flex-row md:items-center md:justify-between md:pt-14">
          <h2 className={`${serif} text-[length:var(--t2)] leading-[1.06] text-navy`}>Trenger dere folk?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/request" className={btnGreen}>Be om folk</Link>
            <Link href="/contact" className={btnOutline}>Ta kontakt</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e6e1d6] text-[14px] text-[#4b5563]">
        <div className="mx-auto max-w-[1240px] px-6 pb-7 pt-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
              <div className={`flex items-center gap-3 text-[20px] text-navy ${serif} !font-medium`}>
                <Image src="/logo.png" alt="" width={34} height={34} className="h-[34px] w-[34px] rounded-full" />
                ArbeidMatch Norge
              </div>
              <p className="mt-3 max-w-[38ch] leading-[1.6]">Bemanning og rekruttering for bygg, industri, elektro og logistikk i hele Norge.</p>
            </div>
            <div>
              <h4 className={`${label} mb-2.5 !text-[#14202f]`}>Bedrift</h4>
              <ul className="grid gap-1.5"><li><Link href="/for-employers" className={focus}>Bemanning</Link></li><li><Link href="/for-employers" className={focus}>Rekruttering</Link></li><li><a href="#bransjer" className={focus}>Bransjer</a></li><li><Link href="/request" className={focus}>Be om folk</Link></li></ul>
            </div>
            <div>
              <h4 className={`${label} mb-2.5 !text-[#14202f]`}>Jobbsøker</h4>
              <ul className="grid gap-1.5"><li><Link href="/jobs" className={focus}>Ledige jobber</Link></li><li><Link href="/candidate-register" className={focus}>Registrer deg</Link></li><li><Link href="/cv" className={focus}>CV-hjelp</Link></li><li><Link href="/become-a-partner" className={focus}>Bli partner</Link></li></ul>
            </div>
            <div>
              <h4 className={`${label} mb-2.5 !text-[#14202f]`}>Selskapet</h4>
              <ul className="grid gap-1.5"><li><Link href="/about" className={focus}>Om oss</Link></li><li><Link href="/contact" className={focus}>Kontakt</Link></li><li><Link href="/privacy" className={focus}>Personvern</Link></li><li><Link href="/cookies" className={focus}>Informasjonskapsler</Link></li></ul>
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 border-t border-[#e6e1d6] pt-4 text-[12.5px]">
            <span>ArbeidMatch Norge AS</span>
          </div>
        </div>
      </footer>

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2.5 border-t border-[#e6e1d6] bg-[#fbfaf7] px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2.5 md:hidden">
        <Link href="/jobs" className={`${btnOutline} flex-1`}>Finn jobb</Link>
        <Link href="/request" className={`${btnGreen} flex-1`}>Be om folk</Link>
      </div>
      <div className="h-[72px] md:hidden" aria-hidden="true" />
    </div>
  );
}
