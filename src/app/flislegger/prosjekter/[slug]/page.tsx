import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { portfolioCategories } from "../../portfolio-data";
import { ProjectGallery } from "../ProjectGallery";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return portfolioCategories.map(project => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = portfolioCategories.find(item => item.slug === slug);
  if (!project) return {};
  return { title: `${project.title} | ArbeidMatch Flislegger`, description: project.description };
}

export default async function FlisleggerPortfolioProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = portfolioCategories.find(item => item.slug === slug);
  if (!project) notFound();

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <style>{`.ats-route-progress{background-color:#1d9e75!important}`}</style>
      <header className="border-b border-white/10"><div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/flislegger" className="inline-flex min-h-11 items-center gap-3 font-semibold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-[#0f1923]">A</span> ArbeidMatch <span className="hidden text-white/45 sm:inline">/ Flislegger</span></Link><Link href="/flislegger#kontakt" className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#0f1923]">Få et tilbud</Link></div></header>
      <main>
        <section className="py-16 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8"><Link href="/flislegger/prosjekter" className="inline-flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" /> Alle porteføljeprosjekter</Link><p className="mt-9 text-xs font-bold uppercase tracking-[0.22em] text-[#1d9e75]">Porteføljeprosjekt</p><h1 className="mt-4 max-w-4xl text-5xl font-semibold tracking-[-0.04em] sm:text-7xl">{project.title}</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">{project.description} Se alle {project.images.length} bildene fra dette prosjektarkivet.</p></div></section>
        <ProjectGallery categories={[project]} otherProjectsHref="/flislegger/prosjekter" />
      </main>
    </div>
  );
}

