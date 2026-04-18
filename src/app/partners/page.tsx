import Link from "next/link";
import type { Metadata } from "next";
import {
  Building2,
  Calculator,
  GraduationCap,
  Home,
  Languages,
  Scale,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Partners",
  description:
    "Trusted partners for ArbeidMatch, accounting, translation, language courses, accommodation and more. Coming soon.",
};

const cards: { icon: typeof Building2; title: string }[] = [
  { icon: Calculator, title: "Accounting & Tax Services" },
  { icon: Languages, title: "Authorized Translators" },
  { icon: GraduationCap, title: "Norwegian Language Courses" },
  { icon: Home, title: "Accommodation in Norway" },
  { icon: Building2, title: "Construction Companies" },
  { icon: Scale, title: "Legal Services" },
];

export default function PartnersPage() {
  return (
    <div className="relative min-h-[70vh] overflow-hidden bg-[#06090e] text-white">
      <div className="pointer-events-none absolute inset-0 min-h-[70vh] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(201,168,76,0.12),transparent),linear-gradient(180deg,#0a0f14_0%,#06090e_100%)]" />
      <section className="relative px-4 py-20 md:py-28">
        <div className="mx-auto w-full max-w-content text-center md:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Ecosystem</p>
          <h1 className="mt-4 font-sans text-4xl font-bold tracking-tight md:text-5xl">Trusted Partners</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/65">
            Curated services for EU/EEA workers and Norwegian employers, quality bar, zero fluff.
          </p>
        </div>

        <div className="relative mx-auto mt-16 grid w-full max-w-content gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 md:px-6">
          {cards.map(({ icon: Icon, title }) => (
            <article
              key={title}
              className="card-premium group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[var(--shadow-card)] backdrop-blur-sm transition-all duration-300 ease-premium hover:border-gold/45"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/[0.06] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-105">
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <span className="badge-coming-soon rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                  Coming soon
                </span>
              </div>
              <h2 className="relative mt-5 font-display text-lg font-semibold text-white">{title}</h2>
              <Link
                href="/contact"
                className="relative mt-4 inline-flex text-sm font-medium text-gold/90 transition-colors duration-300 hover:text-gold"
              >
                Become a partner →
              </Link>
            </article>
          ))}
        </div>

        <div className="relative mx-auto mt-20 max-w-content rounded-2xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-transparent px-6 py-12 text-center md:px-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Interested in partnering with ArbeidMatch?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/65">
            We&apos;re building a premium partner network for workers and employers across Norway.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-full bg-gradient-to-r from-[#b8923f] to-gold px-8 py-3 text-sm font-semibold text-[#0a0f14] shadow-[0_8px_32px_rgba(201,168,76,0.25)] transition-transform duration-300 ease-premium hover:scale-[1.03]"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
