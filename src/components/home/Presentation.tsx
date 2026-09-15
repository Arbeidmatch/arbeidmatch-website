import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowRight, Check, HardHat, Wrench, Factory, Zap } from "lucide-react";
import s from "./presentation.module.css";

const sectors = [{ Icon: HardHat, name: "Bygg og anlegg" }, { Icon: Wrench, name: "Bil og verksted" }, { Icon: Factory, name: "Industri" }, { Icon: Zap, name: "Elektro" }];

export default function Presentation() {
  return <div className={s.page}>
    <section className={s.hero}>
      <div className={s.heroCopy}>
        <p className={s.eyebrow}><span /> BEMANNING OG REKRUTTERING</p>
        <h1>Riktig kompetanse.<br /><em>På rett plass.</em></h1>
        <p className={s.intro}>Trenger du flere fagfolk? Vi hjelper deg med bemanning og rekruttering, så du kan holde prosjektet i gang og bygge teamet videre.</p>
        <div className={s.actions}>
          <Link href="/request" className={s.primary}>Jeg trenger medarbeidere <ArrowUpRight size={19} /></Link>
          <Link href="/jobs" className={s.secondary}>Jeg ser etter jobb <ArrowRight size={18} /></Link>
        </div>
        <div className={s.details}><span><Check size={15} /> Personlig oppfølging</span><span><Check size={15} /> Kandidater vurdert for ditt behov</span></div>
      </div>
      <div className={s.heroPhoto}>
        <Image src="/images/home/carpenter-watermarked.webp" alt="Fagarbeider i ArbeidMatch-arbeidstøy måler og merker treverk" fill priority sizes="(max-width: 800px) 100vw, 48vw" />
      </div>
    </section>
    <section className={s.sectors} aria-label="Våre fagområder">
      <span className={s.sectorLabel}>FAGFOLK TIL<br /><b>DIN BRANSJE</b></span>
      {sectors.map(({ Icon, name }) => <span key={name} className={s.sector}><Icon size={23} strokeWidth={1.4} />{name}</span>)}
    </section>
    <section className={s.services} id="tjenester">
      <div className={s.sectionHeading}><div><p className={s.eyebrow}>FOR BEDRIFTER</p><h2>Et behov. Flere muligheter.</h2></div><p>Ekstra kapasitet til prosjektet eller en ny kollega?<br />Vi finner løsningen sammen med deg.</p></div>
      <div className={s.serviceGrid}>
        <Link href="/for-employers" className={s.service}><span className={s.number}>01 / BEMANNING</span><h3>Fagfolk når du<br />trenger dem.</h3><p>Våre medarbeidere jobber i ditt prosjekt. Vi tar hånd om ansettelse, lønn og oppfølging.</p><span className={s.serviceLink}>Se hvordan bemanning fungerer <ArrowUpRight size={22} /></span></Link>
        <Link href="/for-employers" className={s.service}><span className={s.number}>02 / REKRUTTERING</span><h3>Din neste<br />faste medarbeider.</h3><p>Vi finner og presenterer aktuelle kandidater. Du velger hvem som blir en del av bedriften din.</p><span className={s.serviceLink}>Finn din neste medarbeider <ArrowUpRight size={22} /></span></Link>
      </div>
    </section>
    <section id="how-it-works" className={s.process}>
      <div><p className={s.eyebrow}>SLIK JOBBER VI</p><h2>En tydelig prosess.<br />En personlig kontakt.</h2><Link href="/contact">La oss ta en prat <ArrowUpRight size={18} /></Link></div>
      <ol>{[["Vi lytter", "Fortell oss om faget, prosjektet og hvem du trenger."], ["Vi finner riktig kompetanse", "Vi går gjennom erfaring, ferdigheter og tilgjengelighet."], ["Vi følger opp", "Du møter aktuelle kandidater. Vi holder kontakten videre."]].map(([title, text], i) => <li key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
    </section>
    <section className={s.candidate}><div><p className={s.eyebrow}>FOR DEG SOM SØKER JOBB</p><h2>Ditt neste kapittel<br />kan starte i Norge.</h2><p>Finn en stilling som passer faget ditt, og ta neste steg med ArbeidMatch.</p></div><Link href="/jobs" className={s.primary}>Se ledige stillinger <ArrowUpRight size={22} /></Link></section>
    <section className="mx-auto max-w-[1200px] px-6 py-14 md:py-20"><p className={s.eyebrow}>HOLD KONTAKTEN</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0D1B2A]">Nye muligheter. Rett i innboksen.</h2><div className="mt-7 grid gap-7 md:grid-cols-2"><div><h3 className="font-semibold text-[#0D1B2A]">Ser du etter jobb?</h3><p className="mt-2 text-sm leading-relaxed text-[#53616c]">Velg faget ditt og få e-post når vi publiserer nye, relevante stillinger.</p><Link href="/newsletter#candidates" className="mt-3 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[#806520]">Velg jobbvarsler <ArrowUpRight size={18} /></Link></div><div><h3 className="font-semibold text-[#0D1B2A]">Trenger bedriften fagfolk?</h3><p className="mt-2 text-sm leading-relaxed text-[#53616c]">Send en gratis forespørsel og velg å motta kandidatpresentasjoner som passer behovet ditt.</p><Link href="/newsletter#employers" className="mt-3 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[#806520]">Få relevante kandidatpresentasjoner <ArrowUpRight size={18} /></Link></div></div></section>
  </div>;
}
