"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

const GOLD = "#C9A84C";

type CardDef = {
  badge: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  body: string;
  steps: string[];
  cta: { label: string; href: string };
  subscriptionNote?: string;
};

const CARDS: CardDef[] = [
  {
    badge: "01",
    title: "For bemanningsbyråer",
    subtitle: "Dere har kunden. Vi finner kandidatene.",
    eyebrow: "Samarbeid med bemanningsbyråer",
    body: "Dere sender oss forespørselen. Vi søker i nettverket vårt i EU/EØS og gjør forhåndsscreeningen. Dere gjennomfører intervjuet og håndterer alle juridiske sider ved ansettelsen. Vi støtter dere med kandidatdokumentasjon og bakgrunnsinformasjon.",
    steps: [
      "Dere sender oss kandidatforespørselen med kravene",
      "Vi søker og forhåndsscreener i EU- og EØS-land",
      "Vi presenterer kvalifiserte kandidater for dere",
      "Dere intervjuer, velger ut og styrer ansettelsesprosessen",
    ],
    cta: { label: "Send oss en kandidatforespørsel", href: "/request" },
  },
  {
    badge: "02",
    title: "For arbeidsgivere",
    subtitle: "Full service fra søk til oppstart.",
    eyebrow: "Bemanning for sluttkunder",
    body: "Dere sender oss forespørselen. Vi søker, velger ut og presenterer kandidater. Vi går gjennom forslaget med dere, ansetter kandidaten på deres vegne, håndterer alle juridiske sider ved ansettelsen og forbereder kandidaten til oppstart. Etter plasseringen følger vi opp både kunden og kandidaten hver uke for å sikre at alt fungerer godt.",
    steps: [
      "Dere sender oss forespørselen med stilling, arbeidssted og krav",
      "Vi søker etter og velger ut kandidatene som passer best",
      "Vi presenterer forslaget vårt og går gjennom det med dere",
      "Vi ansetter kandidaten og tar oss av alle juridiske og administrative steg",
      "Kandidaten kommer forberedt og klar til å begynne",
      "Ukentlig oppfølging av kunde og kandidat ved behov",
    ],
    cta: { label: "Be om kandidater", href: "/request" },
  },
  {
    badge: "03",
    title: "Stillingsannonsering",
    subtitle: "Nå kandidater i EU/EØS direkte gjennom våre kanaler.",
    eyebrow: "Direkte annonsering",
    body: "Alle offisielt registrerte norske selskaper kan annonsere ledige stillinger gjennom ArbeidMatch. Vi publiserer stillingen deres i våre digitale kanaler og nettverk i EU/EØS for å nå kvalifiserte kandidater direkte. Tilgjengelig som månedlig abonnement eller per stilling.",
    steps: [
      "Dere sender oss annonseforespørselen",
      "Vi gjennomgår annonsen opp mot norske standarder for stillingsannonser",
      "Vi publiserer i våre kandidatkanaler i EU/EØS",
      "Kandidatene søker direkte eller via oss, etter hva dere foretrekker",
    ],
    subscriptionNote:
      "Tilgjengelig som månedlig abonnement eller per stilling. Kontakt oss for gjeldende priser.",
    cta: { label: "Spør om annonsering", href: "/contact" },
  },
];

function desktopGridCols(selected: number | null, reduceMotion: boolean): string {
  if (reduceMotion || selected === null) return "md:grid-cols-3";
  if (selected === 0) return "md:grid-cols-[2fr_0.75fr_0.75fr]";
  if (selected === 1) return "md:grid-cols-[0.75fr_2fr_0.75fr]";
  return "md:grid-cols-[0.75fr_0.75fr_2fr]";
}

export default function HowItWorksInteractive() {
  const [selected, setSelected] = useState<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      const on = mq.matches;
      setReduceMotion(on);
      if (on) setSelected(0);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const toggle = (i: number) => {
    setSelected((s) => (s === i ? null : i));
  };

  const gridTransition = reduceMotion ? "" : "md:transition-[grid-template-columns] md:duration-[350ms] md:ease-out";

  return (
    <section id="how-it-works" className="bg-[#0D1B2A] py-12 md:py-20">
      <div className="mx-auto w-full max-w-content px-6 md:px-12 lg:px-20">
        <h2 className="heading-premium-xl text-center font-display text-4xl text-white">Slik jobber vi</h2>
        <p className="subheading-premium mt-4 text-center text-white/70">Velg tjenesten som passer behovet deres.</p>

        <div className={`mt-14 grid grid-cols-1 gap-6 ${desktopGridCols(selected, reduceMotion)} ${gridTransition}`}>
          {CARDS.map((card, i) => {
            const open = reduceMotion ? i === 0 : selected === i;
            const dimOthers = !reduceMotion && selected !== null && !open;

            return (
              <div
                key={card.badge}
                role={reduceMotion ? undefined : "button"}
                tabIndex={reduceMotion ? -1 : 0}
                onClick={() => !reduceMotion && toggle(i)}
                onKeyDown={(e) => {
                  if (reduceMotion) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(i);
                  }
                }}
                className={`relative overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.15)] bg-[rgba(255,255,255,0.03)] px-5 py-6 md:px-7 md:py-8 ${
                  reduceMotion ? "cursor-default" : "cursor-pointer"
                } ${
                  !reduceMotion && !open
                    ? "transition-all duration-[350ms] ease-out md:hover:-translate-y-1 md:hover:border-[rgba(201,168,76,0.4)]"
                    : !reduceMotion
                      ? "transition-all duration-[350ms] ease-out"
                      : ""
                } ${open ? "md:scale-[1.01]" : ""} ${
                  dimOthers ? "md:scale-[0.98] md:opacity-50" : "opacity-100"
                }`}
                style={{
                  borderColor: open ? GOLD : "rgba(201,168,76,0.15)",
                  borderWidth: "1px",
                  transitionProperty: reduceMotion ? "none" : "transform, opacity, border-color, border-width",
                  transitionDuration: reduceMotion ? "0ms" : "350ms",
                  transitionTimingFunction: "ease-out",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[32px] font-extrabold leading-none" style={{ color: GOLD }}>
                      {card.badge}
                    </p>
                    <h3 className="mt-3 text-[18px] font-bold text-white">{card.title}</h3>
                    <p className="mt-2 text-[14px] leading-snug text-white/70">{card.subtitle}</p>
                  </div>
                  <ChevronRight
                    className={`mt-1 h-4 w-4 shrink-0 ${reduceMotion ? "" : "transition-transform duration-300 ease-out"} ${
                      open ? "rotate-90" : ""
                    }`}
                    style={{ color: GOLD }}
                    aria-hidden
                  />
                </div>

                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: open ? 600 : 0,
                    transitionProperty: reduceMotion ? "none" : "max-height, opacity",
                    transitionDuration: reduceMotion ? "0ms" : "350ms",
                    transitionTimingFunction: "ease-out",
                    opacity: open ? 1 : 0,
                  }}
                >
                  <div
                    className="pt-4"
                    style={{
                      opacity: open ? 1 : 0,
                      transitionProperty: reduceMotion ? "none" : "opacity",
                      transitionDuration: reduceMotion ? "0ms" : "200ms",
                      transitionTimingFunction: "ease-out",
                      transitionDelay: open && !reduceMotion ? "150ms" : "0ms",
                    }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GOLD }}>
                      {card.eyebrow}
                    </p>
                    <p className="mt-3 text-sm leading-[1.75] text-white/70">{card.body}</p>
                    <ul className="mt-4 flex flex-col gap-2.5">
                      {card.steps.map((s) => (
                        <li key={s} className="flex items-start gap-2.5 text-[13px] leading-snug text-white/70">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                    {card.subscriptionNote ? (
                      <div
                        className="mt-4 rounded-lg border-l-[3px] px-4 py-3 text-[13px] leading-relaxed text-white/70"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderLeftColor: GOLD,
                        }}
                      >
                        {card.subscriptionNote}
                      </div>
                    ) : null}
                    <Link
                      href={card.cta.href}
                      className="mt-5 flex w-full items-center justify-center rounded-lg text-center text-sm font-bold text-[#0D1B2A] transition-opacity hover:opacity-95"
                      style={{ background: GOLD, padding: "12px 20px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {card.cta.label}
                    </Link>
                    {open && !reduceMotion ? (
                      <p className="mt-2.5 text-center text-[11px] text-white/70">Klikk for å lukke</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
