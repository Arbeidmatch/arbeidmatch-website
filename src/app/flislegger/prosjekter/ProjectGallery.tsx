"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Ruler, X } from "lucide-react";
import type { PortfolioCategory } from "../portfolio-data";
import { trackFlislegger } from "../FlisleggerTracker";

function categoryId(title: string) {
  return title.toLowerCase().replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function ProjectGallery({ categories, otherProjectsHref }: { categories: PortfolioCategory[]; otherProjectsHref?: string }) {
  const [active, setActive] = React.useState<{ category: number; image: number } | null>(null);
  const [showChoice, setShowChoice] = React.useState(false);

  function closeImage() {
    setActive(null);
    setShowChoice(true);
  }

  function move(direction: -1 | 1) {
    if (!active) return;
    const images = categories[active.category].images;
    setActive({ category: active.category, image: (active.image + direction + images.length) % images.length });
  }

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && active) closeImage();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <nav className="sticky top-0 z-20 border-y border-white/10 bg-[#0f1923]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">
          {categories.map(category => <a key={category.title} href={`#${categoryId(category.title)}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/15 px-4 text-sm text-white/70 hover:border-[#1d9e75] hover:text-white">{category.title}</a>)}
        </div>
      </nav>

      {categories.map((category, categoryIndex) => (
        <section id={categoryId(category.title)} key={category.title} className={`scroll-mt-20 ${categoryIndex % 2 === 0 ? "bg-white py-20 text-[#0f1923]" : "py-20"}`}>
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-5 sm:grid-cols-[1fr_2fr] sm:items-end"><div><p className={`text-xs font-bold uppercase tracking-[0.22em] ${categoryIndex % 2 === 0 ? "text-[#003d82]" : "text-[#1d9e75]"}`}>0{categoryIndex + 1}</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{category.title}</h2></div><p className={`max-w-xl sm:justify-self-end ${categoryIndex % 2 === 0 ? "text-[#0f1923]/60" : "text-white/60"}`}>{category.description}</p></div>
            <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {category.images.map((src, imageIndex) => (
                <button type="button" key={src} onClick={() => { trackFlislegger("image_open", { projectSlug: category.slug, imageKey: src.split("/").pop() ?? src }); setActive({ category: categoryIndex, image: imageIndex }); }} className="group relative mb-4 block min-h-11 w-full break-inside-avoid overflow-hidden rounded-[16px] bg-[#0f1923]/10 text-left" aria-label={`Åpne ${category.title}, bilde ${imageIndex + 1}`}>
                  <Image src={`${src}/v1/fill/w_1100,h_1400,al_c,q_85/portfolio.jpg`} alt={`${category.title}, prosjektbilde ${imageIndex + 1}`} width={1100} height={1400} unoptimized className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f1923]/85 to-transparent px-5 pb-4 pt-12 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">Se prosjektbildet</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      ))}

      {active ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f1923]/95 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Prosjektbilde">
          <button onClick={closeImage} className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0f1923]" aria-label="Lukk bildet"><X className="h-5 w-5" /></button>
          <button onClick={() => move(-1)} className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#0f1923] sm:left-6" aria-label="Forrige bilde"><ChevronLeft className="h-6 w-6" /></button>
          <div className="relative h-[82vh] w-full max-w-6xl"><Image src={`${categories[active.category].images[active.image]}/v1/fill/w_1800,h_1600,al_c,q_90/project.jpg`} alt={`${categories[active.category].title}, stort prosjektbilde`} fill unoptimized className="object-contain" /></div>
          <button onClick={() => move(1)} className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#0f1923] sm:right-6" aria-label="Neste bilde"><ChevronRight className="h-6 w-6" /></button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">{categories[active.category].title} · {active.image + 1} / {categories[active.category].images.length}</p>
        </div>
      ) : null}

      {showChoice ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0f1923]/75 p-4" role="dialog" aria-modal="true" aria-labelledby="project-choice-title">
          <div className="relative w-full max-w-lg rounded-[24px] bg-white p-7 text-[#0f1923] sm:p-9">
            <button onClick={() => setShowChoice(false)} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#0f1923]/15" aria-label="Lukk"><X className="h-5 w-5" /></button>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d9e75]">Hva vil du gjøre videre?</p>
            <h2 id="project-choice-title" className="mt-4 pr-10 text-3xl font-semibold tracking-[-0.03em]">Inspirert av prosjektet?</h2>
            <p className="mt-3 leading-relaxed text-[#0f1923]/60">Vi kan vurdere prosjektet ditt gratis, eller du kan fortsette å se flere arbeider.</p>
            <div className="mt-7 grid gap-3">
              <Link href="/flislegger#kontakt" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d9e75] px-6 font-semibold text-white"><Ruler className="h-4 w-4" /> Ja, jeg ønsker gratis befaring</Link>
              {otherProjectsHref ? <Link href={otherProjectsHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#0f1923]/20 px-6 font-semibold">Se andre porteføljeprosjekter <ArrowRight className="h-4 w-4" /></Link> : <button onClick={() => setShowChoice(false)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#0f1923]/20 px-6 font-semibold">Se flere bilder <ArrowRight className="h-4 w-4" /></button>}
              <Link href="/flislegger" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm text-[#0f1923]/55 hover:text-[#0f1923]"><ArrowLeft className="h-4 w-4" /> Tilbake til forsiden</Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

import React from "react";

