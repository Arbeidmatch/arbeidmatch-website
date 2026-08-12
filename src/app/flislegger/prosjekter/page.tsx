import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { portfolioCategories, portfolioImageCount } from "../portfolio-data";

export const metadata: Metadata = {
  title: "Prosjekter og galleri | ArbeidMatch Flislegger",
  description: "Se utførte arbeider innen bad, kjøkken, trapper, terrasser og venetiansk stukkatur.",
};

export default function FlisleggerProjectsPage() {
  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <style>{`.ats-route-progress{background-color:#1d9e75!important}`}</style>
      <header className="border-b border-white/10">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/flislegger" className="inline-flex min-h-11 items-center gap-3 font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0f1923]">A</span> ArbeidMatch <span className="hidden text-white/45 sm:inline">/ Flislegger</span></Link><Link href="/flislegger#kontakt" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#0f1923]">Få et tilbud</Link></div>
      </header>
      <main>
        <section className="py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8"><Link href="/flislegger" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Tilbake</Link><p className="mt-10 text-xs font-bold uppercase tracking-[0.22em] text-[#1d9e75]">Komplett prosjektarkiv</p><h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">Utførte arbeider, samlet på ett sted.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">{portfolioImageCount} bilder fra det eksisterende prosjektarkivet, organisert etter type arbeid. Bildene viser både ferdige flater, detaljer og arbeid underveis.</p></div></section>
        <section className="bg-white py-20 text-[#0f1923]"><div className="mx-auto grid max-w-7xl gap-5 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">{portfolioCategories.map((project, index) => <Link key={project.slug} href={`/flislegger/prosjekter/${project.slug}`} className="group overflow-hidden rounded-[20px] border border-[#0f1923]/10 hover:border-[#1d9e75]"><div className="relative aspect-[4/3] overflow-hidden"><Image src={`${project.images[0]}/v1/fill/w_900,h_675,al_c,q_85/cover.jpg`} alt={project.title} fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /></div><div className="p-6"><p className="text-xs font-bold text-[#1d9e75]">0{index + 1} · {project.images.length} bilder</p><h2 className="mt-4 text-2xl font-semibold">{project.title}</h2><p className="mt-3 text-sm leading-relaxed text-[#0f1923]/60">{project.description}</p><span className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold">Åpne prosjektet <ArrowRight className="h-4 w-4" /></span></div></Link>)}</div></section>
        <section className="py-24"><div className="mx-auto max-w-7xl px-5 text-center sm:px-8"><h2 className="text-4xl font-semibold tracking-[-0.03em]">Har du et lignende prosjekt?</h2><p className="mx-auto mt-4 max-w-xl text-white/60">Send oss noen detaljer, så vurderer vi løsning, kapasitet og neste steg.</p><Link href="/flislegger#kontakt" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1d9e75] px-7 font-semibold">Be om gratis vurdering <ArrowRight className="h-4 w-4" /></Link></div></section>
      </main>
    </div>
  );
}

