import Link from "next/link";

function IconSearchUser({ className }: { className?: string }) {
  return (
    <svg className={className} width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M5 20v-1a5 5 0 0 1 5-5h0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M17 17l4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth={1.5} />
      <path d="M4 20v-1a4 4 0 0 1 4-4h2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M14 20v-1a3 3 0 0 1 3-3h0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconMegaphone({ className }: { className?: string }) {
  return (
    <svg className={className} width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 14v8l4 2V12L6 14z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M10 12l8-3v12l-8-3" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M18 10c2 1 3 2 3 5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

const CARDS = [
  {
    title: "Full rekruttering",
    text: "Vi håndterer hele prosessen — sourcing, screening, intervju og presentasjon. Du velger, vi leverer.",
    href: "/request",
    cta: "Be om rekruttering →",
    icon: IconSearchUser,
    topBorder: true,
  },
  {
    title: "Bemanning og innleie",
    text: "Fleksibel arbeidskraft når du trenger det. Vi er arbeidsgiveren — du fokuserer på prosjektet.",
    href: "/request",
    cta: "Se bemanningsløsninger →",
    icon: IconUsers,
    topBorder: false,
  },
  {
    title: "Direkteannonsering",
    text: "Nå kandidater der de faktisk er. Vi publiserer stillingen din på våre EU/EEA-nettverk og kanaler — du ansetter direkte. Mer effektivt enn lokale jobbtavler, til en brøkdel av kostnaden.",
    href: "/contact",
    cta: "Hør mer om annonsering →",
    icon: IconMegaphone,
    topBorder: false,
  },
] as const;

export default function ForEmployersExtendedServices() {
  return (
    <section className="border-t border-border bg-white py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-4 md:px-6">
        <h2 className="text-center font-display text-2xl font-bold text-navy md:text-3xl">
          Trenger du kandidater — men ønsker å ansette selv?
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className={`group rounded-xl border border-border bg-surface px-6 py-7 transition-all duration-200 hover:-translate-y-1 hover:border-[#C9A84C] ${card.topBorder ? "border-t-2 border-t-[#C9A84C]" : ""}`}
              >
                <div className="text-gold transition-transform duration-200 group-hover:scale-110">
                  <Icon className="block" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{card.text}</p>
                <Link href={card.href} className="mt-5 inline-block text-sm font-semibold text-gold hover:underline">
                  {card.cta}
                </Link>
              </article>
            );
          })}
        </div>
        <p className="mx-auto mt-10 max-w-3xl text-center text-[13px] italic leading-relaxed text-text-secondary">
          Alle tjenester leveres innenfor norsk arbeidslovgivning. ArbeidMatch påtar seg ansvar for det som ligger
          innenfor vår kontroll. Vi er transparente om prosess, forventninger og begrensninger — og vi forbedrer oss
          kontinuerlig.
        </p>
      </div>
    </section>
  );
}
