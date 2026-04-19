"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function IconDoc() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6M8 13h8M8 17h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconDiploma() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path d="M8 7h8M8 11h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconCert() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 8h8M8 12h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M9 18l2 2 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBrief() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M3 12h18" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

function IconPass() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 16h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconExternal() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStatusX() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" fill="none" className="shrink-0" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="#E24B4A" strokeWidth={1.75} />
      <path className="dsb-status-x-stroke" d="M18 18l12 12M30 18L18 30" stroke="#E24B4A" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function IconStatusClock() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" fill="none" className="shrink-0 text-[#C9A84C]" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth={1.75} />
      <g
        className="transition-transform duration-500 ease-out group-hover:rotate-[360deg]"
        style={{ transformOrigin: "24px 24px" }}
      >
        <path d="M24 24V14" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
        <path d="M24 24L32 28" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
      </g>
    </svg>
  );
}

function IconStatusCheck() {
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" fill="none" className="shrink-0" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="#1D9E75" strokeWidth={1.75} />
      <path
        className="dsb-status-check-draw"
        d="M15 24l6 6 12-14"
        stroke="#1D9E75"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IconFileSend() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M14 2v6h6M12 18v-6M9 15l3 3 3-3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconClockSm() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconStarSm() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-[#C9A84C]" aria-hidden>
      <path
        d="M12 2l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.9 6.4 19.5l2.1-6.7L3 8.8h6.8L12 2z"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
    </svg>
  );
}

const ACCORDION = [
  {
    icon: <IconDoc />,
    title: "CV med datert utdanning og praksis",
    body: "CV må inneholde biografiske data, datert utdanning og datert relevant praksis som elektriker. Erfaring må dokumenteres fra land utenfor Norge.",
  },
  {
    icon: <IconDiploma />,
    title: "Vitnemål og karakterutskrift",
    body: "Kopi av originalvitnemål med fag, karakterer og læreplan. Dokumenter på andre språk enn engelsk, svensk eller dansk må oversettes av autorisert translatør.",
  },
  {
    icon: <IconCert />,
    title: "Fagbrev, svennebrev eller kompetansebevis",
    body: "Kopi av originalt fagbrev eller tilsvarende kompetansebevis i det aktuelle elektroyrket. Både original og oversettelse må vedlegges.",
  },
  {
    icon: <IconBrief />,
    title: "Arbeidsattester - min. 1 år praksis siste 10 år",
    body: "Kopi av attester fra nåværende eller tidligere arbeidsgivere som dokumenterer minst ett års praksis i elektrikeryrket i løpet av de siste 10 år etter endt utdanning.",
  },
  {
    icon: <IconPass />,
    title: "Gyldig pass + prosjektbeskrivelse (midlertidig)",
    body: "Kopi av gyldig pass. Ved midlertidig godkjenning: vedlegg med prosjektets art, varighet, hyppighet og kontinuitet. DSB vurderer om arbeidet er av midlertidig karakter.",
  },
] as const;

type TimelineStep = {
  icon: ReactNode;
  label: string;
  text: string;
  fee?: string;
};

const TIMELINE: TimelineStep[] = [
  {
    icon: <IconFileSend />,
    label: "Dag 1",
    text: "Send komplett søknad via DSBs søknadsportal",
    fee: "Gebyr: 3.200 NOK",
  },
  {
    icon: <IconCheckCircle />,
    label: "Innen 1 måned",
    text: "DSB bekrefter mottak og informerer om eventuelle mangler",
  },
  {
    icon: <IconClockSm />,
    label: "Innen 2 måneder",
    text: "Svar på midlertidig godkjenning. Kandidaten kan starte ved positivt svar",
  },
  {
    icon: <IconStarSm />,
    label: "Innen 4 måneder",
    text: "Svar på permanent godkjenning (etablering)",
  },
];

const LEGAL_LINKS = [
  {
    label: "DSB: Søknad om godkjenning for EU/EEA-elektrikere",
    href: "https://www.dsb.no/en/Electrical-safety/kvalifikasjoner-foretak-og-virksomhet/Apply-for-approval-as-electrical-professionals-in-Norway/Applicants-with-professional-qualifications-within-the-EUEOS/",
  },
  {
    label: "Altinn: Elektriker - søknadsveiledning",
    href: "https://info.altinn.no/skjemaoversikt/direktoratet-for-samfunnssikkerhet-og-beredskap/elektriker/",
  },
  {
    label: "Elvirksomhetsregisteret - verifiser elektriker",
    href: "https://elvirksomhetsregisteret.dsb.no",
  },
] as const;

export default function DsbEmployerGuide() {
  const [heroIn, setHeroIn] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardStep, setCardStep] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineActive, setTimelineActive] = useState(false);
  const [openAcc, setOpenAcc] = useState<number | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setHeroIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const el = cardsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        setCardStep(1);
        window.setTimeout(() => setCardStep(2), 150);
        window.setTimeout(() => setCardStep(3), 300);
        io.disconnect();
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setTimelineActive(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="border-t border-white/10 bg-[#0b141c] py-12 text-white md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        {/* Hero */}
        <div
          className={`rounded-[20px] border border-[rgba(201,168,76,0.2)] bg-gradient-to-br from-[#0f1923] to-[#1a2a3a] px-8 py-10 md:px-[60px] md:py-[60px] ${heroIn ? "dsb-employer-hero-enter" : "opacity-0"}`}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#C9A84C]">
            Strategisk guide for norske arbeidsgivere
          </p>
          <h2
            className="mt-4 font-extrabold leading-[1.2] text-white"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            Elektriker fra EU/EEA uten DSB: Hva kan du gjøre lovlig?
          </h2>
          <p className="mt-5 max-w-[680px] text-base leading-[1.7] text-white/[0.65]">
            Vi hjelper deg å forstå regelverket og finne riktig kandidat. Her er det du trenger å vite om midlertidig
            godkjenning og lovlig ansettelse.
          </p>
        </div>

        {/* Status cards */}
        <div className="mt-14 md:mt-16">
          <h3 className="mb-8 text-2xl font-bold text-white">Tre situasjoner - tre svar</h3>
          <div ref={cardsRef} className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <article
              className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-500 ease-out ${
                cardStep >= 1 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              } border-t-[3px] border-t-[#E24B4A]`}
            >
              <IconStatusX />
              <h4 className="mt-4 text-base font-bold text-[#E24B4A]">Ingen søknad sendt til DSB</h4>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Kandidaten kan ikke utføre elektrisk arbeid i Norge. Søknad må sendes til DSB før oppstart. ArbeidMatch
                kan hjelpe med dokumentasjon og prosess.
              </p>
              <span className="mt-4 inline-block rounded-full bg-[rgba(226,75,74,0.1)] px-3 py-1 text-xs font-semibold text-[#E24B4A]">
                Ikke lovlig uten godkjenning
              </span>
            </article>

            <article
              className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-500 ease-out ${
                cardStep >= 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              } border-t-[3px] border-t-[#C9A84C]`}
            >
              <IconStatusClock />
              <h4 className="mt-4 text-base font-bold text-[#C9A84C]">Søknad sendt - venter på svar</h4>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Kandidaten har søkt om midlertidig godkjenning. DSB svarer innen 1 måned. Etter positivt svar kan
                kandidaten starte lovlig. Gyldighet: maks 12 måneder.
              </p>
              <span className="mt-4 inline-block rounded-full bg-[rgba(201,168,76,0.1)] px-3 py-1 text-xs font-semibold text-[#C9A84C]">
                DSB svarer innen 1 måned
              </span>
            </article>

            <article
              className={`group rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition-all duration-500 ease-out md:col-span-2 lg:col-span-1 ${
                cardStep >= 3 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              } border-t-[3px] border-t-[#1D9E75]`}
            >
              <IconStatusCheck />
              <h4 className="mt-4 text-base font-bold text-[#1D9E75]">Midlertidig godkjenning aktiv</h4>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Kandidaten er godkjent for inntil 12 måneder. Kan starte umiddelbart. Permanent godkjenning anbefales
                for langsiktige ansettelsesforhold.
              </p>
              <span className="mt-4 inline-block rounded-full bg-[rgba(29,158,117,0.12)] px-3 py-1 text-xs font-semibold text-[#1D9E75]">
                Kan starte umiddelbart
              </span>
            </article>
          </div>
        </div>

        {/* Accordion */}
        <div className="mt-16 border-t border-white/10 pt-14">
          <h3 className="text-[22px] font-bold text-white">Dokumenter som kreves av DSB</h3>
          <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">For EU/EEA-søkere</p>
          <ul className="mt-8 space-y-2">
            {ACCORDION.map((item, i) => {
              const open = openAcc === i;
              return (
                <li key={item.title} className="rounded-xl border border-white/10 bg-white/[0.03]">
                  <button
                    type="button"
                    className="flex w-full min-h-[48px] items-center gap-3 px-4 py-3 text-left md:px-5"
                    onClick={() => setOpenAcc(open ? null : i)}
                    aria-expanded={open}
                  >
                    {item.icon}
                    <span className="flex-1 text-[13px] font-semibold text-white md:text-[15px]">{item.title}</span>
                    <svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      className={`shrink-0 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <p
                        className={`px-4 pb-4 pl-[52px] text-[13px] leading-relaxed text-white/70 transition-opacity duration-300 md:px-5 md:text-sm ${open ? "opacity-100" : "opacity-0"}`}
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Timeline */}
        <div className="mt-16 border-t border-white/10 pt-14">
          <h3 className="text-[22px] font-bold text-white">Slik ser tidslinje ut</h3>
          <div ref={timelineRef} className="relative mt-10">
            {/* Desktop horizontal */}
            <div className="relative hidden lg:block">
              <div className="absolute left-0 right-0 top-[18px] h-0.5 bg-white/10" />
              <div
                className="absolute left-0 top-[18px] h-0.5 origin-left bg-[#C9A84C] transition-transform duration-[800ms] ease-out"
                style={{
                  width: "100%",
                  transform: timelineActive ? "scaleX(1)" : "scaleX(0)",
                  transformOrigin: "left center",
                }}
              />
              <div className="relative grid grid-cols-4 gap-6">
                {TIMELINE.map((step) => (
                  <div key={step.label} className="text-center">
                    <div className="mx-auto flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A84C] shadow-[0_0_0_4px_rgba(201,168,76,0.2)]" />
                    <div className="mt-4 flex justify-center">{step.icon}</div>
                    <p className="mt-3 text-sm font-bold text-[#C9A84C]">{step.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{step.text}</p>
                    {step.fee ? (
                      <p className="mt-2 text-xs font-semibold text-white/50">{step.fee}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile / tablet vertical */}
            <div className="relative pl-6 lg:hidden">
              <div className="absolute bottom-2 left-[7px] top-2 w-0.5 bg-white/10" />
              <div
                className="absolute left-[7px] top-2 w-0.5 origin-top bg-[#C9A84C] transition-transform duration-[800ms] ease-out"
                style={{
                  height: "calc(100% - 16px)",
                  transform: timelineActive ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "top center",
                }}
              />
              <ul className="space-y-10">
                {TIMELINE.map((step) => (
                  <li key={step.label} className="relative">
                    <span className="absolute -left-[1.35rem] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C9A84C]" />
                    <div className="flex items-center gap-2">{step.icon}</div>
                    <p className="mt-2 text-sm font-bold text-[#C9A84C]">{step.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/70">{step.text}</p>
                    {step.fee ? <p className="mt-2 text-xs font-semibold text-white/50">{step.fee}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-14 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-6 md:px-7 md:py-7">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#C9A84C]">
            Offisielle kilder og regelverk
          </h3>
          <ul className="mt-5 space-y-3">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-white/90 underline-offset-4 hover:text-[#C9A84C] hover:underline"
                >
                  <IconExternal />
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-xs italic leading-relaxed text-white/40 md:text-left">
            Informasjonen på denne siden er basert på offentlig tilgjengelig regelverk fra DSB og gjelder per april
            2026. ArbeidMatch påtar seg ikke juridisk ansvar. Kontakt DSB direkte for bindende veiledning.
          </p>
        </div>
      </div>
    </section>
  );
}
