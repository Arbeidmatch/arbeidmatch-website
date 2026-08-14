import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Bath, Building2, Check, ChevronRight, FileCheck2, Grid3X3, Hammer, House, Ruler, ShieldCheck, Sparkles } from "lucide-react";
import { FlisleggerProjectForm } from "./FlisleggerProjectForm";
import { FlisleggerBrand } from "./FlisleggerBrand";

export const metadata: Metadata = {
  title: "Flislegger i Trondheim",
  description: "ArbeidMatch tar ansvar for hele flisprosjektet, fra gratis vurdering til ferdig resultat.",
};

const hero = "https://static.wixstatic.com/media/1347ef_24e5f64d1a69467cb5d242caf8a64873~mv2.jpg/v1/fill/w_2500,h_2456,al_c/1347ef_24e5f64d1a69467cb5d242caf8a64873~mv2.jpg";
const bath = "https://static.wixstatic.com/media/1347ef_3ea93bc63819436e952b1ba504cd9fcf~mv2.jpg/v1/fill/w_1000,h_1200,al_c,q_85/Imagine%20WhatsApp%202025-02-11%20la%2008_53_33_e8a461d5.jpg";
const detail = "https://static.wixstatic.com/media/1347ef_7d0356f0489348559d9fd5552f5a357d~mv2.jpg/v1/fill/w_1000,h_1200,al_c,q_85/Imagine%20WhatsApp%202025-02-11%20la%2011_54_41_d33b38ce.jpg";
const terrace = "https://static.wixstatic.com/media/1347ef_9c058b58370f4c1885f70957a899797b~mv2.jpg/v1/fill/w_1200,h_800,al_c,q_85/Imagine%20WhatsApp%202025-02-10%20la%2020_19_51_1368e422.jpg";

const services = [
  { icon: Bath, title: "Bad og våtrom", text: "Komplett flisarbeid med riktig fall, membran og detaljer som varer.", href: "/flislegger/prosjekter/bad-og-vatrom" },
  { icon: Grid3X3, title: "Kjøkken og entré", text: "Presis legging, rene linjer og materialvalg tilpasset rommet.", href: "/flislegger/prosjekter/kjokken-og-flislagte-vegger" },
  { icon: House, title: "Terrasse og uteareal", text: "Slitesterke overflater planlagt for norske værforhold.", href: "/flislegger/prosjekter/terrasser" },
  { icon: Hammer, title: "Trapper", text: "Robuste kanter, jevne linjer og presis tilpasning i hele trappeløpet.", href: "/flislegger/prosjekter/trapper" },
  { icon: Sparkles, title: "Venetiansk stukkatur", text: "Eksklusive veggflater med dybde, glans og et individuelt uttrykk.", href: "/flislegger/prosjekter/venetiansk-stukkatur" },
  { icon: Building2, title: "Næring og større prosjekt", text: "Ett kontaktpunkt, forutsigbar fremdrift og kapasitet når du trenger det.", href: "/flislegger/prosjekter" },
];

export default function FlisleggerPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0f1923] text-white">
      <style>{`.ats-route-progress{background-color:#1d9e75!important}`}</style>
      <header className="absolute inset-x-0 top-0 z-20 border-b border-white/15">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <FlisleggerBrand />
          <nav className="hidden items-center gap-6 text-sm font-medium text-white/65 lg:flex"><a href="#tjenester" className="inline-flex min-h-11 items-center hover:text-white">Tjenester</a><Link href="/flislegger/prosjekter" className="inline-flex min-h-11 items-center hover:text-white">Prosjekter</Link><a href="#prosess" className="inline-flex min-h-11 items-center hover:text-white">Prosess</a><a href="#kontakt" className="inline-flex min-h-11 items-center hover:text-white">Kontakt</a></nav>
          <div className="flex items-center gap-2 sm:gap-5"><a href="tel:+4741063773" className="hidden min-h-11 items-center text-sm font-medium text-white/80 hover:text-white sm:inline-flex">+47 410 63 773</a><a href="#kontakt" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#0f1923] hover:bg-white/90">Få et tilbud</a></div>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[760px] items-end overflow-hidden pb-20 pt-32 sm:min-h-[820px] sm:pb-28">
          <Image src={hero} alt="Ferdig flislagt kjøkken" fill priority unoptimized className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923] via-[#0f1923]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1923] via-transparent to-[#0f1923]/30" />
          <div className="relative mx-auto w-full max-w-7xl px-5 sm:px-8">
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-white/70"><span className="h-px w-9 bg-white/60" /> Ny fagavdeling i ArbeidMatch</p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-[88px]">Vi tar ansvar for hele flisprosjektet.</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">Fra første befaring til siste fuge. Du får fagfolk, fremdrift og kvalitet samlet hos én ansvarlig partner.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="#kontakt" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d9e75] px-7 font-semibold text-white hover:brightness-110">Be om gratis vurdering <ArrowRight className="h-4 w-4" /></a>
              <Link href="/flislegger/prosjekter" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 px-7 font-semibold hover:border-white">Se porteføljen <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-[#0f1923]">
          <div className="mx-auto grid max-w-7xl gap-px bg-white/10 sm:grid-cols-3">
            {["Én avtale, ett ansvar", "Dokumentert fagarbeid", "Tydelig pris og fremdrift"].map((item, index) => (
              <div key={item} className="flex min-h-24 items-center gap-4 bg-[#0f1923] px-6 sm:px-8"><span className="text-sm font-semibold text-[#1d9e75]">0{index + 1}</span><span className="font-medium">{item}</span></div>
            ))}
          </div>
        </section>

        <section id="tjenester" className="bg-white py-24 text-[#0f1923] sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
              <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#003d82]">Det nye tilbudet</p><h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.03em] sm:text-6xl">Mer enn en flislegger. En prosjektpartner.</h2></div>
              <div className="max-w-xl lg:justify-self-end"><p className="text-lg leading-relaxed text-[#0f1923]/70">ArbeidMatch har i flere år funnet dyktige fagfolk til norske bedrifter. Nå bruker vi samme nettverk og kvalitetsfokus til å gjennomføre flisprosjekter direkte for privatkunder, entreprenører og næringsbygg.</p><p className="mt-5 flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-[#1d9e75]" /> Vi følger prosjektet helt til overlevering.</p></div>
            </div>
            <div className="mt-16 grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {services.map(({ icon: Icon, title, text, href }) => <Link href={href} key={title} className="group block min-h-11 border-t border-[#0f1923]/20 pt-6" aria-label={`Se porteføljeprosjekt: ${title}`}><Icon className="h-7 w-7 text-[#003d82]" /><h3 className="mt-8 text-xl font-semibold transition-colors group-hover:text-[#003d82]">{title}</h3><p className="mt-3 leading-relaxed text-[#0f1923]/60">{text}</p><span className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">Se prosjektene <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span></Link>)}
            </div>
          </div>
        </section>

        <section className="bg-[#003d82] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Erfaring og leveranse</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">25 år med håndverk. 17 år i Trondheim.</h2><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">Fagmiljøet bak leveransen har erfaring med flislegging, marmor, granitt og skifer. Hvert prosjekt planlegges med presise målinger, tydelig budsjett, kvalitetskontroll og dokumentert overlevering.</p></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-[20px] border border-white/20 p-6"><Award className="h-7 w-7 text-[#1d9e75]" /><p className="mt-7 text-3xl font-semibold">5 års</p><p className="mt-2 text-sm leading-relaxed text-white/60">garanti på utført arbeid, i tråd med vilkårene for bruk og vedlikehold.</p></div><div className="rounded-[20px] border border-white/20 p-6"><FileCheck2 className="h-7 w-7 text-[#1d9e75]" /><p className="mt-7 text-3xl font-semibold">Full oversikt</p><p className="mt-2 text-sm leading-relaxed text-white/60">Sluttrapport, bilder fra arbeidsfasene, materialoversikt og detaljert faktura.</p></div></div>
          </div>
        </section>

        <section id="prosjekter" className="bg-[#0f1923] py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d9e75]">Utvalgte arbeider</p><Link href="/flislegger/prosjekter" className="group mt-4 inline-flex items-end gap-3"><h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Detaljene gjør forskjellen.</h2><ArrowRight className="mb-2 hidden h-7 w-7 transition-transform group-hover:translate-x-1 sm:block" /></Link></div><div className="max-w-sm"><p className="text-white/60">Inspirasjon fra reelle arbeider utført av fagfolkene i nettverket vårt.</p><Link href="/flislegger/prosjekter" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-[#1d9e75] hover:text-white">Se alle prosjektbildene <ArrowRight className="h-4 w-4" /></Link></div></div>
            <div className="mt-14 grid auto-rows-[280px] gap-4 md:grid-cols-2 md:auto-rows-[360px]">
              <Link href="/flislegger/prosjekter/bad-og-vatrom" className="group relative min-h-11 overflow-hidden rounded-[20px] md:row-span-2" aria-label="Åpne porteføljeprosjektet Bad og våtrom"><Image src={bath} alt="Moderne flislagt bad" fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 50vw" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f1923]/90 to-transparent px-6 pb-5 pt-16 font-semibold">Bad og våtrom <ArrowRight className="ml-2 inline h-4 w-4" /></span></Link>
              <Link href="/flislegger/prosjekter/terrasser" className="group relative min-h-11 overflow-hidden rounded-[20px]" aria-label="Åpne porteføljeprosjektet Terrasser"><Image src={terrace} alt="Flislagt terrasse" fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 50vw" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f1923]/90 to-transparent px-6 pb-5 pt-16 font-semibold">Terrasser og uteareal <ArrowRight className="ml-2 inline h-4 w-4" /></span></Link>
              <Link href="/flislegger/prosjekter/kjokken-og-flislagte-vegger" className="group relative min-h-11 overflow-hidden rounded-[20px]" aria-label="Åpne porteføljeprosjektet Kjøkken"><Image src={detail} alt="Detaljert flisarbeid" fill unoptimized className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 50vw" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f1923]/90 to-transparent px-6 pb-5 pt-16 font-semibold">Kjøkken og vegger <ArrowRight className="ml-2 inline h-4 w-4" /></span></Link>
            </div>
          </div>
        </section>

        <section id="prosess" className="border-y border-[#0f1923]/10 bg-white py-24 text-[#0f1923] sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.22em]">Slik jobber vi</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Trygt fra idé til ferdig rom.</h2><p className="mt-6 max-w-lg text-lg text-[#0f1923]/70">Ingen uklare overganger mellom formidler og utførende. ArbeidMatch koordinerer leveransen og holder deg oppdatert.</p></div><ol className="space-y-4">{[[Ruler,"Befaring og behov","Vi ser på rommet, ønskene og de tekniske rammene."],[Hammer,"Plan og gjennomføring","Du får tydelig omfang, fremdrift og én kontaktperson."],[Sparkles,"Kontroll og overlevering","Vi går gjennom resultatet sammen før prosjektet avsluttes."]].map(([Icon,title,text],i) => { const StepIcon = Icon as typeof Ruler; return <li key={String(title)} className="flex gap-5 border-b border-[#0f1923]/20 py-5"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f1923] text-white"><StepIcon className="h-5 w-5" /></span><div><span className="text-xs font-bold">0{i+1}</span><h3 className="text-xl font-semibold">{String(title)}</h3><p className="mt-1 text-[#0f1923]/65">{String(text)}</p></div></li>})}</ol></div></div>
        </section>

        <section id="kontakt" className="bg-[#0f1923] py-24 sm:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-10"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d9e75]">Start her</p><h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">Har du et prosjekt i tankene?</h2><p className="mt-6 max-w-lg text-lg leading-relaxed text-white/65">Fortell oss kort hva du trenger. Vi vurderer oppdraget og tar kontakt for en uforpliktende prat.</p><ul className="mt-8 space-y-3 text-sm text-white/75">{["Privat, næring og entreprenør","Små og store flisprosjekter","Trondheim og omegn i første fase"].map(item => <li key={item} className="flex items-center gap-3"><Check className="h-5 w-5 text-[#1d9e75]" /> {item}</li>)}</ul><div className="mt-10 border-t border-white/15 pt-7"><p className="text-sm text-white/50">Vil du heller snakke med oss?</p><a href="tel:+4741063773" className="mt-2 inline-flex min-h-11 items-center text-xl font-semibold hover:text-[#1d9e75]">+47 410 63 773</a></div></div>
            <FlisleggerProjectForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#0f1923] py-10"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>© {new Date().getFullYear()} ArbeidMatch Norge AS · Org.nr. 935 667 089 MVA</p><div className="flex flex-wrap gap-6"><Link href="/flislegger/prosjekter" className="inline-flex min-h-11 items-center hover:text-white">Prosjekter</Link><Link href="/flislegger/personvern" className="inline-flex min-h-11 items-center hover:text-white">Personvern for Flislegger</Link><a href="mailto:flislegger@arbeidmatch.no" className="inline-flex min-h-11 items-center hover:text-white">flislegger@arbeidmatch.no</a></div></div></footer>
    </div>
  );
}
