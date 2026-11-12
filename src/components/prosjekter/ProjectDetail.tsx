"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { BODY, CARD, GREY, LARGE_TITLE, NAVY, NY_TAG, PILL, PILL_GREEN, SMALL, STAGE_DOT } from "@/components/min-side/ios";
import { orgNumberNo } from "@/lib/min-side/profile";
import { dateCell } from "@/lib/min-side/project-list";
import { lotsOf, projectDetailFrom, tenderUrlFrom, timelineOf, type Firm, type SubscriberProjectDetail } from "@/lib/min-side/project-detail";
import { domainLabel, isDomainKey } from "@/lib/prosjekter/domains";
import { formatDateNo, readableText, regionNo, valueNo } from "@/lib/prosjekter/format";

/**
 * ORDER 273: one project of a client's alerts, across the whole section. His
 * words of 12 November 2026: "in loc sa apara doar pe o parte din ecran
 * detaliile sa apara pe toata partea", and "cand da click pe un alt proiect se
 * inchid detaliile celuilalt proiect si se deschid celelalte detalii". So the
 * detail replaces the list (never a side panel), there is only ever one, and
 * Forrige / Neste walk the list as it was filtered and sorted.
 *
 * Built from the body of ProjectPresentationClient (the single presented
 * project keeps its own page): the text, the dates on a line, the lots, the
 * competition's facts, and on the right the contractor and the byggherre with
 * their register numbers. Min side asks "Planlegg bemanning"; the map page
 * keeps "Be om folk". Nothing names where the project was found.
 */

const TRADE_NO: Record<string, string> = { painting: "Maling", carpentry: "Tømrer", floors: "Gulv og flis", glazing: "Glass" };

export type DetailPreview = { title: string; stage: string; buyer_name: string | null; place: string | null };
export type DetailAsk = { label: string; onClick?: () => void; href?: string };

export type ProjectDetailProps = {
  /** GET answers { project }, POST answers { url } while the tender is open. */
  url: string;
  preview?: DetailPreview | null;
  index: number;
  total: number;
  isNew?: boolean;
  onBack: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  /** "Alle prosjekter" on a computer; the phone says where it goes back to. */
  backLabel?: string;
  phoneBackLabel?: string;
  ask: DetailAsk;
};

function fagOf(p: Pick<SubscriberProjectDetail, "trades" | "domains">): string {
  const trades = p.trades.map((t) => TRADE_NO[t]).filter(Boolean);
  if (trades.length) return trades.join(", ");
  return p.domains.filter(isDomainKey).map((d) => domainLabel(d, "no")).slice(0, 2).join(", ");
}

function stageKey(p: Pick<SubscriberProjectDetail, "stage" | "deadline_at">): string {
  if (p.stage === "tender" && p.deadline_at && Date.parse(p.deadline_at) < Date.now()) return "closed";
  return p.stage;
}

const stageLine = (p: SubscriberProjectDetail) => {
  const date = dateCell({ stage: p.stage === "tender" || p.stage === "awarded" || p.stage === "planned" ? p.stage : "planned", deadline_at: p.deadline_at, published_on: p.contract_signed_on ?? p.published_on, start_on: p.start_on });
  // "Tildelt 20.10." already says the stage; the word is not said twice.
  return date && p.stage_label && date.startsWith(p.stage_label) ? date : [p.stage_label, date].filter(Boolean).join(" · ");
};

function durationNo(text: string | null): string | null {
  if (!text) return null;
  return text
    .replace(/years?/, () => "år")
    .replace(/months?/, (m) => (m === "month" ? "måned" : "måneder"))
    .replace(/days?/, (m) => (m === "day" ? "dag" : "dager"));
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-5`}>
      <h2 className={`text-[0.8125rem] font-semibold uppercase tracking-[0.04em] ${GREY}`}>{title}</h2>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
      <dt className={`${SMALL} ${GREY}`}>{label}</dt>
      <dd className={`${BODY} min-w-0 font-semibold ${NAVY}`}>{children}</dd>
    </div>
  );
}

function FirmFact({ firm }: { firm: Firm }) {
  const line = [firm.orgnr ? `Org.nr ${orgNumberNo(firm.orgnr)}` : null, firm.town, firm.industry].filter(Boolean).join(" · ");
  return (
    <>
      <span className="block whitespace-nowrap">{firm.name}</span>
      {line ? <span className={`block font-normal ${SMALL} ${GREY}`}>{line}</span> : null}
    </>
  );
}

function AskButton({ ask, className }: { ask: DetailAsk; className: string }) {
  if (ask.href)
    return (
      <Link href={ask.href} data-rask-foresporsel className={className}>
        {ask.label}
      </Link>
    );
  return (
    <button type="button" className={className} aria-haspopup="dialog" onClick={ask.onClick}>
      {ask.label}
    </button>
  );
}

export default function ProjectDetail({ url, preview, index, total, isNew = false, onBack, onPrev, onNext, backLabel = "Alle prosjekter", phoneBackLabel = "Prosjektvarsler", ask }: ProjectDetailProps) {
  const [project, setProject] = useState<SubscriberProjectDetail | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tenderError, setTenderError] = useState<string | null>(null);

  useEffect(() => {
    // Each project is its own instance (the callers key it by id), so a new one starts empty by itself.
    let live = true;
    window.scrollTo({ top: 0 });
    void fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!live) return;
        const parsed = res.ok ? projectDetailFrom(body) : null;
        if (parsed) setProject(parsed);
        else setFailed(res.status === 404 ? "Prosjektet er ikke lenger blant varslene deres." : (body.error ?? "Prosjektet kunne ikke hentes akkurat nå. Prøv igjen om litt."));
      })
      .catch(() => live && setFailed("Prosjektet kunne ikke hentes akkurat nå. Prøv igjen om litt."));
    return () => {
      live = false;
    };
  }, [url]);

  const goToTender = async () => {
    setBusy(true);
    setTenderError(null);
    // Opened on the click itself, so a pop-up blocker counts it as the click's own window.
    const tab = window.open("", "_blank");
    try {
      const res = await fetch(url, { method: "POST" });
      const link = tenderUrlFrom(await res.json().catch(() => ({})));
      if (link) {
        if (tab) {
          tab.opener = null;
          tab.location.href = link;
        } else window.open(link, "_blank", "noopener,noreferrer");
      } else {
        tab?.close();
        setTenderError("Konkurransen er ikke åpen lenger.");
      }
    } catch {
      tab?.close();
      setTenderError("Noe gikk galt. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const title = project?.title ?? preview?.title ?? "";
  const place = project ? project.place ?? project.city ?? regionNo(project.regions) : (preview?.place ?? "");
  const buyer = project?.buyer?.name ?? project?.buyer_name ?? preview?.buyer_name ?? null;
  const subline = [buyer, place, project ? fagOf(project) : null, total > 0 ? `${index} av ${total}` : null].filter(Boolean).join(" · ");
  const key = project ? stageKey(project) : (preview?.stage ?? "tender");
  const paragraphs = project ? readableText(project.description) : [];
  const timeline = project ? timelineOf(project) : [];
  const lots = project ? lotsOf(project.details) : [];
  const procedure = project?.details.find((d) => d.label === "Om prosedyren")?.value ?? null;
  const value = project ? valueNo(project) : null;
  const estimated = project?.awarded_value_nok && project.estimated_value_nok && project.estimated_value_nok !== project.awarded_value_nok ? valueNo({ awarded_value_nok: null, estimated_value_nok: project.estimated_value_nok }) : null;
  const start = project ? formatDateNo(project.start_on) : null;
  const end = project ? formatDateNo(project.end_on) : null;
  const startEnd = start && end ? `${start} til ${end}` : start ? `Fra ${start}` : end ? `Til ${end}` : "";
  const competition = project
    ? (
        [
          ["Prosedyre", procedure],
          ["Tilbud mottatt", project.tenders_received !== null ? String(project.tenders_received) : null],
          ["Kontrakt signert", formatDateNo(project.contract_signed_on)],
          ["Varighet", durationNo(project.duration_text)],
        ] as const
      ).filter(([, v]) => Boolean(v))
    : [];
  const tender = project?.tender_open ? goToTender : null;

  const arrows = (
    <div className="flex items-center gap-2">
      <button type="button" className={`${PILL} px-3 md:px-4`} disabled={!onPrev} onClick={onPrev ?? undefined} aria-label="Forrige prosjekt">
        <ChevronLeft className="h-5 w-5" aria-hidden />
        <span className="hidden md:inline">Forrige</span>
      </button>
      <button type="button" className={`${PILL} px-3 md:px-4`} disabled={!onNext} onClick={onNext ?? undefined} aria-label="Neste prosjekt">
        <span className="hidden md:inline">Neste</span>
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );

  return (
    <article className="flex min-w-0 flex-col gap-5 pb-28 md:pb-0" data-project-detail="" data-project-id={project?.id ?? ""}>
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={`inline-flex min-h-[3.25rem] min-w-[3rem] items-center gap-1 rounded-full pr-3 font-semibold md:min-h-[2.5rem] ${BODY} ${NAVY} hover:underline`}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
          <span className="hidden md:inline">{backLabel}</span>
          <span className="md:hidden">{phoneBackLabel}</span>
        </button>
        {arrows}
      </div>

      <header className="flex flex-col gap-2">
        <p className={`flex flex-wrap items-center gap-2 ${SMALL} ${GREY}`}>
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STAGE_DOT[key] ?? STAGE_DOT.tender }} aria-hidden />
          {project ? stageLine(project) : null}
          {isNew ? <span className={NY_TAG}>Ny</span> : null}
        </p>
        <h1 className={`${LARGE_TITLE} ${NAVY} break-words`}>{title}</h1>
        {subline ? <p className={`${BODY} ${GREY}`}>{subline}</p> : null}
      </header>

      {failed ? (
        <div className={`${CARD} p-5 ${BODY} ${NAVY}`} role="alert">
          {failed}
        </div>
      ) : !project ? (
        <p className={`${BODY} ${GREY}`}>Henter prosjektet ...</p>
      ) : (
        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            {paragraphs.length ? (
              <Block title="Om prosjektet">
                <div className={`flex max-w-[68ch] flex-col gap-3 ${BODY} ${NAVY}`}>
                  {paragraphs.map((t, i) => (
                    <p key={i}>{t}</p>
                  ))}
                </div>
              </Block>
            ) : null}
            {timeline.length ? (
              <Block title="Tidslinje">
                <ol className="flex flex-col gap-4 border-l-2 border-[#E5E5EA] pl-5 sm:flex-row sm:gap-0 sm:border-l-0 sm:border-t-2 sm:pl-0 sm:pt-4">
                  {timeline.map((t) => (
                    <li key={t.label} className="relative sm:flex-1 sm:pr-3">
                      <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-[#1B2B44] sm:-top-[23px] sm:left-0" aria-hidden />
                      <p className={`${SMALL} ${GREY}`}>{t.label}</p>
                      <p className={`${BODY} font-semibold ${NAVY}`}>{formatDateNo(t.at)}</p>
                    </li>
                  ))}
                </ol>
              </Block>
            ) : null}
            {lots.length ? (
              <Block title="Delkontrakter">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {lots.map((l, i) => (
                    <li key={`${l.name}-${i}`} className="rounded-[10px] border border-[#E5E5EA] p-3">
                      <p className={`${BODY} font-semibold ${NAVY} break-words`}>{l.name}</p>
                      {l.value || l.winner ? <p className={`${SMALL} ${GREY}`}>{[l.value, l.winner].filter(Boolean).join(" · ")}</p> : null}
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}
            {competition.length ? (
              <Block title="Om konkurransen">
                <dl className="divide-y divide-[#E5E5EA]">
                  {competition.map(([label, v]) => (
                    <Fact key={label} label={label}>
                      <span className="font-normal">{v}</span>
                    </Fact>
                  ))}
                </dl>
              </Block>
            ) : null}
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <section className={`${CARD} p-5`} aria-label="Fakta">
              <dl className="divide-y divide-[#E5E5EA]">
                <Fact label="Entreprenør">
                  {project.winners.length ? (
                    project.winners.map((w) => (
                      <span key={`${w.name}-${w.orgnr ?? ""}`} className="block py-0.5">
                        <FirmFact firm={w} />
                      </span>
                    ))
                  ) : (
                    <span className={`font-normal ${GREY}`}>Ikke tildelt</span>
                  )}
                </Fact>
                {buyer ? (
                  <Fact label="Byggherre">
                    {project.buyer ? <FirmFact firm={project.buyer} /> : <span className="block whitespace-nowrap">{buyer}</span>}
                  </Fact>
                ) : null}
                {value ? (
                  <Fact label="Kontraktsverdi">
                    <span className="tabular-nums">{value}</span>
                    {estimated ? <span className={`font-normal ${GREY}`}> (anslått {estimated})</span> : null}
                  </Fact>
                ) : null}
                {startEnd ? <Fact label="Byggestart og slutt">{startEnd}</Fact> : null}
              </dl>
            </section>
            <section className={`${CARD} hidden flex-col gap-3 p-5 md:flex`} aria-label="Bemanning">
              <p className={`${BODY} font-semibold ${NAVY}`}>Trenger dere folk til dette prosjektet?</p>
              <AskButton ask={ask} className={`${PILL_GREEN} w-full`} />
              {tender ? (
                <button type="button" className={`${PILL} w-full`} disabled={busy} onClick={() => void tender()}>
                  Se kunngjøringen
                </button>
              ) : null}
              {tenderError ? (
                <p role="status" className={`${SMALL} text-[#C4231A]`}>
                  {tenderError}
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      )}

      {/* The phone: the two actions fixed at the bottom, 56px tall. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-[#E5E5EA] bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        {tender ? (
          <button type="button" className={`${PILL} min-h-[3.5rem] flex-1`} disabled={busy} onClick={() => void tender()}>
            Kunngjøring
          </button>
        ) : null}
        <AskButton ask={ask} className={`${PILL_GREEN} min-h-[3.5rem] flex-1`} />
      </div>
    </article>
  );
}
