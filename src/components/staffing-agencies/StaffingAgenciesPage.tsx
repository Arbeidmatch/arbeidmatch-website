import Link from "next/link";

const OFFERS = [
  "Tilgang til pre-screenede EU/EEA-kandidater uten å bygge eget sourcing-team",
  "Dokumentasjonsstøtte og tydelige prosesser som kan tilpasses deres kvalitetssystem",
  "Skalerbar kapasitet i topper — dere beholder kundeforholdet",
  "Samarbeidsmodeller som avklarer roller, priser og forventninger på forhånd",
  "Målet vårt er forutsigbar leveranse innenfor norsk arbeidslovgivning",
] as const;

function IconHandshake({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 20c2-4 5-6 8-6l2 4-3 5-4-1-3-2zM16 20c-2-4-5-6-8-6l-2 4 3 5 4-1 3-2zM12 18l2-2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 4v5c0 5-3.5 9-7 11-3.5-2-7-6-7-11V7l7-4z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrending({ className }: { className?: string }) {
  return (
    <svg className={className} width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 16l4-4 3 3 5-6 4 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M16 8h4v4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const CARDS = [
  {
    title: "Du har kunden, vi har kandidatene",
    text: "Du fortsetter å betjene dine eksisterende kunder. Vi leverer pre-screenede kandidater fra EU/EEA som matcher dine oppdrag.",
    icon: IconHandshake,
  },
  {
    title: "Ingen konkurranse — bare samarbeid",
    text: "Vi opererer ikke som et tradisjonelt bemanningsbyrå overfor dine kunder. Vår rolle er sourcing og pre-screening — resten er ditt.",
    icon: IconShieldCheck,
  },
  {
    title: "Utvid kapasiteten din",
    text: "Ta på deg flere oppdrag uten å øke din egen rekrutteringskapasitet. Vi skalerer sourcing etter ditt behov.",
    icon: IconTrending,
  },
] as const;

export default function StaffingAgenciesPage() {
  return (
    <div className="bg-white text-navy">
      <section className="bg-[#0f1923] px-6 py-16 text-white md:px-12 md:py-24 lg:px-20 lg:py-28">
        <div className="mx-auto max-w-content text-center lg:text-left">
          <div className="mx-auto max-w-[800px] lg:mx-0">
            <p className="am-eyebrow font-semibold uppercase tracking-[0.14em] text-[#C9A84C]">For bemanningsbyråer</p>
            <h1 className="am-h1 mt-4 font-extrabold leading-tight text-white">
              Vi konkurrerer ikke med deg — vi hjelper deg å vokse
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/70">
              ArbeidMatch spesialiserer seg på sourcing og screening av EU/EEA-kandidater. Du beholder kundeforholdet. Vi
              leverer kandidatene.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <h2 className="am-h2 text-center font-bold text-navy">Hvordan det fungerer</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-12">
          {CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className={`group rounded-xl border border-black/[0.08] bg-white p-6 transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-[#C9A84C] md:p-8 ${i === 2 ? "md:col-span-2 md:mx-auto md:max-w-lg lg:col-span-1 lg:mx-0 lg:max-w-none" : ""}`}
              >
                <div className="text-[#C9A84C] transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-6 w-6 md:h-10 md:w-10" />
                </div>
                <h3 className="am-h3 mt-5 font-semibold text-navy">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{card.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border bg-surface px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-20">
        <div className="mx-auto max-w-content">
          <h2 className="am-h2 font-bold text-navy">Hva vi tilbyr deg</h2>
          <ul className="mt-8 max-w-2xl space-y-3">
            {OFFERS.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-text-secondary">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C9A84C]" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="btn-gold-premium mt-10 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-md bg-gold px-8 py-3 text-sm font-semibold text-white hover:bg-gold-hover sm:w-auto"
          >
            Ta kontakt for et partnerskap
          </Link>
        </div>
      </section>
    </div>
  );
}
