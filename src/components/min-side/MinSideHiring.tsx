"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import dynamic from "next/dynamic";

import { FIELD, MUTED, PRIMARY, SECONDARY } from "@/components/prosjekter/ui";
import {
  HIRING_STATUS_NO,
  NO_HIRING_FILTER,
  dayNo,
  hiringCardFrom,
  hiringCsvHref,
  leadAction,
  leadCardText,
  orgNumberNo,
  projectStageNo,
  visibleHiringRows,
  type Hiring,
  type HiringCard,
  type HiringFilter,
  type HiringProjects,
  type HiringRow,
  type TermsText,
} from "@/lib/min-side/profile";
import {
  BTN_GREEN,
  BTN_OUTLINE,
  CARD_L,
  CHECK_D,
  DIVIDE_L,
  ERROR_D,
  ERROR_L,
  FIELD_L,
  FINE_PRINT,
  GOLD_CARD,
  GOLD_TEXT,
  GREEN_CARD,
  GREEN_TEXT,
  INK,
  LOCKED,
  LOCKED_CHIP,
  MUTED_L,
  RULE,
  SOFT,
  TH_L,
  chip,
} from "./ui";

/**
 * ORDER 157: "Bedrifter som ansetter", the firms that hire in the client's
 * counties and trades, on Min side. Nothing of the list shows before the
 * terms are accepted. Premium shows everything and opens the lead card; Basis
 * (after the trial) shows the list with the need, the language filter, the
 * new-only filter and the download locked, and keeps the status and the
 * feedback usable.
 *
 * The list never links to where a position was announced: a row is the firm,
 * its place, its trades, its need and when it was published, and the card is
 * the firm's own details.
 *
 * Under the list, for a firm without project alerts, a card toward the public
 * building projects in the same counties; the same trial is offered from the
 * Prosjektvarsler section as a teaser of the real list (ProjectsTeaser).
 */

const PortalModal = dynamic(() => import("@/components/prosjekter/PortalModal"), { ssr: false });

export type Saved = { ok: true } | { ok: false; message: string; field: string | null };
export type Fetched = { ok: true; data: unknown } | { ok: false; message: string; status: number };
type Send = (body: Record<string, unknown>) => Promise<Saved>;
type SendData = (body: Record<string, unknown>) => Promise<Fetched>;

/** Rows at a time: on a phone the section stays a few screens long. */
const PAGE = 20;

export const FOOTER_LINE = "Opplysningene om stillingene kan ha endret seg siden de ble publisert. ArbeidMatch Norge AS.";

/** The lock mark and the word Premium, never clickable. */
export function Locked({ label }: { label?: string }) {
  return (
    <span className={LOCKED} data-locked="">
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
        <rect x="2" y="5.5" width="8" height="5.5" rx="1" fill="currentColor" />
        <path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      </svg>
      {label ? `${label} · Premium` : "Premium"}
    </span>
  );
}

function LockedChip({ label }: { label: string }) {
  return (
    <span className={LOCKED_CHIP} aria-disabled="true">
      <Locked label={label} />
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dialog contents, in the dark dialog Min side uses for every form.
// ---------------------------------------------------------------------------

function DialogButtons({ busy, label, busyLabel, disabled, onCancel }: { busy: boolean; label: string; busyLabel: string; disabled?: boolean; onCancel: () => void }) {
  return (
    <div className="flex flex-wrap gap-3 pt-1">
      <button type="submit" className={PRIMARY} disabled={busy || disabled}>
        {busy ? busyLabel : label}
      </button>
      <button type="button" className={SECONDARY} disabled={busy} onClick={onCancel}>
        Avbryt
      </button>
    </div>
  );
}

function Failure({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className={`text-sm ${ERROR_D}`}>
      {message}
    </p>
  ) : null;
}

/** The terms to read, one box to tick, and Godta, which stays disabled until the box is ticked. */
export function TermsForm({ terms, onAccept, onCancel }: { terms: TermsText; onAccept: () => Promise<Saved>; onCancel: () => void }) {
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticked) return;
    setBusy(true);
    setFailed(null);
    const r = await onAccept();
    if (!r.ok) setFailed(r.message);
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto pr-1 text-[15px] leading-relaxed text-white">
        {terms.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {terms.version ? <p className={`text-xs ${MUTED}`}>Versjon {terms.version}</p> : null}
      </div>
      <label htmlFor="ms-terms-ok" className="flex min-h-[44px] items-center gap-3 text-[15px] text-white">
        <input id="ms-terms-ok" data-autofocus type="checkbox" className={CHECK_D} checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
        {terms.consent}
      </label>
      <Failure message={failed} />
      <DialogButtons busy={busy} label="Godta" busyLabel="Lagrer ..." disabled={!ticked} onCancel={onCancel} />
    </form>
  );
}

export function TermsDialog({ terms, onAccept, onCancel }: { terms: TermsText; onAccept: () => Promise<Saved>; onCancel: () => void }) {
  return (
    <PortalModal title={terms.title} onClose={onCancel}>
      <TermsForm terms={terms} onAccept={onAccept} onCancel={onCancel} />
    </PortalModal>
  );
}

/** A yes-or-no question with one line of text: Avbryt, and the action. */
export function ConfirmForm({ text, label, onConfirm, onCancel }: { text: string; label: string; onConfirm: () => Promise<Saved>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFailed(null);
    const r = await onConfirm();
    if (!r.ok) setFailed(r.message);
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[15px] leading-relaxed text-white">{text}</p>
      <Failure message={failed} />
      <DialogButtons busy={busy} label={label} busyLabel="Sender ..." onCancel={onCancel} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// The projects trial: from the gold card here and from the Prosjektvarsler teaser.
// ---------------------------------------------------------------------------

export type ProjectsTrial = { start: () => void; busy: boolean; error: string | null; dialog: ReactNode };

/**
 * "Prøv gratis": the projects terms first when they are not accepted yet (the
 * same dialog as the hiring terms), then the trial request. Already accepted
 * sends the request at once. The page reloads after each, so a sent request
 * turns the banner green.
 */
export function useProjectsTrial(projects: HiringProjects | null, send: Send): ProjectsTrial {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const start = () => {
    if (!projects || projects.request || busy) return;
    setError(null);
    if (!projects.terms_accepted) {
      setOpen(true);
      return;
    }
    setBusy(true);
    void send({ action: "projects_trial" }).then((r) => {
      setBusy(false);
      if (!r.ok) setError(r.message);
    });
  };
  const dialog =
    open && projects ? (
      <TermsDialog
        terms={projects.terms}
        onCancel={() => setOpen(false)}
        onAccept={async () => {
          const accepted = await send({ action: "hiring_terms", service: "projects" });
          if (!accepted.ok) return accepted;
          const sent = await send({ action: "projects_trial" });
          if (sent.ok) setOpen(false);
          return sent;
        }}
      />
    ) : null;
  return { start, busy, error, dialog };
}

function TrialButton({ projects, trial }: { projects: HiringProjects; trial: ProjectsTrial }) {
  if (projects.request) {
    return (
      <button type="button" className={BTN_OUTLINE} disabled>
        Sendt {dayNo(projects.request.sent_at)}
      </button>
    );
  }
  return (
    <button type="button" className={BTN_OUTLINE} aria-haspopup={projects.terms_accepted ? undefined : "dialog"} disabled={trial.busy} onClick={trial.start}>
      {trial.busy ? "Sender ..." : "Prøv gratis"}
    </button>
  );
}

/** The green line once the trial was asked for. */
function sentWords(projects: HiringProjects, trades: string[]): string {
  const where = [projects.counties.join(", "), trades.join(", ")].filter(Boolean).join(", ");
  return `Forespørselen er sendt. Vi behandler den så snart som mulig. Dere får e-post til ${projects.email} når prøveperioden for prosjektvarsler er aktiv for ${where}.`;
}

function TrialBanner({ projects, trades, trial, text }: { projects: HiringProjects; trades: string[]; trial: ProjectsTrial; text: string }) {
  const sent = Boolean(projects.request);
  return (
    <div className={`${sent ? GREEN_CARD : GOLD_CARD} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`} role={sent ? "status" : undefined}>
      <p className={`min-w-0 flex-1 basis-[260px] text-[15px] leading-relaxed ${sent ? GREEN_TEXT : INK}`}>{sent ? sentWords(projects, trades) : text}</p>
      <TrialButton projects={projects} trial={trial} />
      {trial.error ? (
        <p role="alert" className={`w-full text-sm font-semibold ${ERROR_L}`}>
          {trial.error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The Prosjektvarsler section for a person without project alerts who has the
 * hiring alerts: the real list, with only the title, the county and the stage
 * open; the buyer, the place, the deadline and the value locked, and the
 * filters locked.
 */
export function ProjectsTeaser({ projects, trades, trial }: { projects: HiringProjects; trades: string[]; trial: ProjectsTrial }) {
  const [shown, setShown] = useState(PAGE);
  const banner = `${projects.count} prosjekter i deres fylker og fag akkurat nå. Listen er ekte og oppdateres daglig. Prøv gratis ut desember, så bestemmer dere etterpå.`;
  const rows = projects.rows.slice(0, shown);
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <TrialBanner projects={projects} trades={trades} trial={trial} text={banner} />
      <div className="flex flex-wrap gap-2" aria-label="Filtre">
        <LockedChip label="Fylke" />
        <LockedChip label="Fag" />
        <LockedChip label="Fase" />
      </div>
      <table className="hidden w-full table-fixed border-collapse text-sm sm:table">
        <thead>
          <tr>
            <th className={`${TH_L} w-[30%]`}>Prosjekt</th>
            <th className={TH_L}>Fylke</th>
            <th className={TH_L}>Fase</th>
            <th className={TH_L}>Oppdragsgiver</th>
            <th className={TH_L}>Sted</th>
            <th className={TH_L}>Frist</th>
            <th className={TH_L}>Verdi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className={`border-b ${RULE} align-top`}>
              <td className={`break-words px-2 py-2.5 font-semibold ${INK}`}>{p.title}</td>
              <td className={`break-words px-2 py-2.5 ${SOFT}`}>{p.county ?? ""}</td>
              <td className={`break-words px-2 py-2.5 ${SOFT}`}>{projectStageNo(p.stage)}</td>
              <td className="px-2 py-2.5">
                <Locked />
              </td>
              <td className="px-2 py-2.5">
                <Locked />
              </td>
              <td className="px-2 py-2.5">
                <Locked />
              </td>
              <td className="px-2 py-2.5">
                <Locked />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className={`flex flex-col sm:hidden ${DIVIDE_L}`}>
        {rows.map((p) => (
          <li key={p.id} className="flex min-w-0 flex-col gap-1 py-3 first:pt-0">
            <p className={`break-words text-[15px] font-semibold ${INK}`}>{p.title}</p>
            <p className={`text-sm ${MUTED_L}`}>{[p.county, projectStageNo(p.stage)].filter(Boolean).join(" · ")}</p>
            <p className={`text-xs ${MUTED_L}`}>
              Oppdragsgiver, sted, frist og verdi: <Locked />
            </p>
          </li>
        ))}
      </ul>
      {projects.rows.length > shown ? (
        <button type="button" className={`${BTN_OUTLINE} self-start`} onClick={() => setShown((n) => n + PAGE)}>
          Vis flere
        </button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The lead card.
// ---------------------------------------------------------------------------

function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
      <dt className={`text-xs font-semibold uppercase tracking-[0.12em] ${MUTED}`}>{label}</dt>
      <dd className="min-w-0 break-words text-[15px] text-white">{children}</dd>
    </div>
  );
}

/** Opening the card is the POST hiring_card (the ATS records that it was opened). */
function LeadCard({ orgnr, send, sendData }: { orgnr: string; send: Send; sendData: SendData }) {
  const [card, setCard] = useState<HiringCard | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [busy, setBusy] = useState<"save" | "contacted" | null>(null);
  const [said, setSaid] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    void sendData({ action: "hiring_card", orgnr }).then((r) => {
      if (!live) return;
      if (!r.ok) {
        setFailed(r.status === 402 ? "Bedriftskortet er Premium." : r.message);
        return;
      }
      const parsed = hiringCardFrom((r.data as { card?: unknown } | null)?.card);
      if (!parsed) {
        setFailed("Bedriftskortet kunne ikke hentes akkurat nå. Prøv igjen om litt.");
        return;
      }
      setCard(parsed);
      setNote(parsed.note ?? "");
      setFollowUp(parsed.follow_up_on ?? "");
    });
    return () => {
      live = false;
    };
  }, [orgnr, sendData]);

  if (failed) return <Failure message={failed} />;
  if (!card) return <p className={`text-sm ${MUTED}`}>Henter bedriftskortet ...</p>;

  const contacted = async () => {
    setBusy("contacted");
    setSaid(null);
    const r = await send({ action: "hiring_lead", orgnr, status: "contacted" });
    setBusy(null);
    if (r.ok) setCard({ ...card, status: "contacted" });
    else setFailed(r.message);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setSaid(null);
    const r = await send({ action: "hiring_lead", orgnr, note: note.slice(0, 2000), follow_up_on: followUp });
    setBusy(null);
    if (r.ok) setSaid("Lagret.");
    else setFailed(r.message);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(leadCardText(card, note, followUp));
      setSaid("Kopiert.");
    } catch {
      setSaid("Kunne ikke kopiere.");
    }
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-lg font-semibold text-white">{card.name}</p>
      <dl className="flex flex-col gap-3">
        <CardRow label="Org.nr">
          <span className="tabular-nums">{orgNumberNo(card.orgnr)}</span>
        </CardRow>
        <CardRow label="Bransje">{card.industry ?? "Ikke oppgitt"}</CardRow>
        <CardRow label="Ansatte">{card.employees ?? "Ikke oppgitt"}</CardRow>
        <CardRow label="Adresse">{card.address ?? ([card.town, card.county_name].filter(Boolean).join(", ") || "Ikke oppgitt")}</CardRow>
        <CardRow label="Nettsted">
          {card.website ? (
            <a href={card.website} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-4">
              {card.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          ) : (
            "Ikke oppgitt"
          )}
        </CardRow>
        <CardRow label="Behov">{card.behov ?? "Ikke oppgitt"}</CardRow>
        <CardRow label="Byrå">{card.recruits ?? "Ikke oppgitt"}</CardRow>
        <CardRow label="Språk">{card.english_ok ? "Aksepterer engelsk" : "Ikke oppgitt"}</CardRow>
        {card.won ? <CardRow label="Offentlig kontrakt">{card.won}</CardRow> : null}
        <CardRow label="Status">{HIRING_STATUS_NO[card.status]}</CardRow>
      </dl>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ms-lead-follow" className="text-sm font-medium text-white">
          Følg opp
        </label>
        <input id="ms-lead-follow" type="date" className={FIELD} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ms-lead-note" className="text-sm font-medium text-white">
          Notat
        </label>
        <textarea id="ms-lead-note" className={`${FIELD} min-h-[96px] py-2`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} />
      </div>
      {said ? (
        <p role="status" className={`text-sm ${MUTED}`}>
          {said}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-1">
        <button type="submit" className={PRIMARY} disabled={busy !== null}>
          {busy === "save" ? "Lagrer ..." : "Lagre"}
        </button>
        <button type="button" className={SECONDARY} onClick={() => void copy()}>
          Kopier
        </button>
        <button type="button" className={SECONDARY} disabled={busy !== null || card.status === "contacted"} onClick={() => void contacted()}>
          Kontaktet
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// The section.
// ---------------------------------------------------------------------------

export type MinSideHiringProps = {
  token: string;
  hiring: Hiring;
  /** last_viewed_at as it stood before this visit's hiring_viewed. */
  since: string | null;
  send: Send;
  sendData: SendData;
  trial: ProjectsTrial;
  /** "Be om folk": the staffing request Min side already has. */
  onAskPeople: () => void;
  /** ?hiring=projects: scroll to the projects card once. */
  focusProjects?: boolean;
};

function StatusButton({ row, send }: { row: HiringRow; send: Send }) {
  const [busy, setBusy] = useState(false);
  const next = row.status === "new" ? "contacted" : "new";
  return (
    <button
      type="button"
      className={chip(row.status === "contacted", true)}
      aria-label={`Status ${HIRING_STATUS_NO[row.status]}. Endre til ${HIRING_STATUS_NO[next]}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await send({ action: "hiring_lead", orgnr: row.orgnr, status: next });
        setBusy(false);
      }}
    >
      {HIRING_STATUS_NO[row.status]}
    </button>
  );
}

export default function MinSideHiring({ token, hiring, since, send, sendData, trial, onAskPeople, focusProjects = false }: MinSideHiringProps) {
  const { terms, subscription } = hiring;
  const basis = subscription.tier === "basis";
  const [termsOpen, setTermsOpen] = useState(!terms.accepted && terms.ready);
  const [filter, setFilter] = useState<HiringFilter>(NO_HIRING_FILTER);
  const [shown, setShown] = useState(PAGE);
  const [lead, setLead] = useState<string | null>(null);
  const [premiumAsk, setPremiumAsk] = useState(false);
  const [premiumSent, setPremiumSent] = useState(false);
  const [premiumBusy, setPremiumBusy] = useState(false);
  const [premiumError, setPremiumError] = useState<string | null>(null);

  const rows = useMemo(() => visibleHiringRows(hiring.rows, filter, since, subscription.tier), [hiring.rows, filter, since, subscription.tier]);

  useEffect(() => {
    if (!focusProjects) return;
    const t = window.setTimeout(() => document.getElementById("ms-hiring-projects")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => window.clearTimeout(t);
  }, [focusProjects]);

  if (!terms.accepted) {
    if (!terms.ready) return <p className={`text-sm ${MUTED_L}`}>Tjenesten åpnes snart.</p>;
    return (
      <>
        <div className={`${GOLD_CARD} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
          <p className={`min-w-0 flex-1 basis-[240px] text-[15px] ${INK}`}>Godta vilkårene for å se bedriftene.</p>
          <button type="button" className={BTN_OUTLINE} aria-haspopup="dialog" onClick={() => setTermsOpen(true)}>
            Les vilkår
          </button>
        </div>
        {termsOpen ? (
          <TermsDialog
            terms={terms}
            onCancel={() => setTermsOpen(false)}
            onAccept={async () => {
              const r = await send({ action: "hiring_terms", service: "hiring" });
              if (r.ok) setTermsOpen(false);
              return r;
            }}
          />
        ) : null}
      </>
    );
  }

  const askPremium = async () => {
    setPremiumBusy(true);
    setPremiumError(null);
    const r = await send({ action: "hiring_premium" });
    setPremiumBusy(false);
    if (r.ok) {
      setPremiumSent(true);
      setPremiumAsk(false);
    } else setPremiumError(r.message);
    return r;
  };
  const openLead = (row: HiringRow) => (leadAction(subscription.tier) === "card" ? setLead(row.orgnr) : setPremiumAsk(true));
  const set = (part: Partial<HiringFilter>) => {
    setFilter((f) => ({ ...f, ...part }));
    setShown(PAGE);
  };
  const page = rows.slice(0, shown);
  const projects = hiring.projects;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {basis ? (
        <div className={`${GOLD_CARD} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
          <p className={`min-w-0 flex-1 basis-[200px] text-[15px] font-semibold ${INK}`}>{premiumSent ? "Vi har fått beskjed og sender dere et tilbud." : "Prøveperioden er over"}</p>
          {premiumSent ? null : (
            <button type="button" className={BTN_OUTLINE} disabled={premiumBusy} onClick={() => void askPremium()}>
              {premiumBusy ? "Sender ..." : "Premium"}
            </button>
          )}
          {premiumError ? (
            <p role="alert" className={`w-full text-sm font-semibold ${ERROR_L}`}>
              {premiumError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3" role="group" aria-label="Filtre">
        <label className="flex min-w-[150px] flex-1 basis-[150px] flex-col gap-1 sm:flex-none">
          <span className={`text-xs font-semibold ${MUTED_L}`}>Fylke</span>
          <select className={FIELD_L} value={filter.county} onChange={(e) => set({ county: e.target.value })}>
            <option value="">Alle</option>
            {hiring.filters.counties.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-[150px] flex-1 basis-[150px] flex-col gap-1 sm:flex-none">
          <span className={`text-xs font-semibold ${MUTED_L}`}>Fag</span>
          <select className={FIELD_L} value={filter.trade} onChange={(e) => set({ trade: e.target.value })}>
            <option value="">Alle</option>
            {hiring.filters.trades.map((t) => (
              <option key={t.key} value={t.key}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        {basis ? (
          <>
            <LockedChip label="Aksepterer engelsk" />
            <LockedChip label="Bare nye siden sist" />
            <LockedChip label="Last ned" />
          </>
        ) : (
          <>
            <button type="button" aria-pressed={filter.english} className={chip(filter.english, true)} onClick={() => set({ english: !filter.english })}>
              Aksepterer engelsk
            </button>
            <button type="button" aria-pressed={filter.onlyNew} className={chip(filter.onlyNew, true)} onClick={() => set({ onlyNew: !filter.onlyNew })}>
              Bare nye siden sist
            </button>
            <a href={hiringCsvHref(token, filter)} download className={BTN_OUTLINE}>
              Last ned
            </a>
          </>
        )}
      </div>

      <p className={`border-t ${RULE} pt-3.5 text-[15px] font-bold ${INK}`} aria-live="polite">
        {rows.length === 1 ? "1 bedrift" : `${rows.length} bedrifter`}
      </p>

      {rows.length === 0 ? (
        <p className={`text-sm ${MUTED_L}`}>{hiring.rows.length ? "Ingen bedrifter passer filteret." : "Ingen bedrifter ennå. Listen oppdateres fortløpende."}</p>
      ) : (
        <>
          <table className="hidden w-full table-fixed border-collapse text-sm sm:table">
            <thead>
              <tr>
                <th className={`${TH_L} w-[22%]`}>Bedrift</th>
                <th className={TH_L}>Sted</th>
                <th className={TH_L}>Fag</th>
                <th className={TH_L}>Behov</th>
                <th className={TH_L}>Publisert</th>
                <th className={TH_L}>Status</th>
                <th className={TH_L}>
                  <span className="sr-only">Lead</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {page.map((r) => (
                <tr key={r.orgnr} className={`border-b ${RULE} align-top`}>
                  <td className={`break-words px-2 py-2.5 font-semibold ${INK}`}>
                    {r.name}
                    {r.positions > 1 ? <span className={`block text-xs font-normal ${MUTED_L}`}>{r.positions} stillinger</span> : null}
                  </td>
                  <td className={`break-words px-2 py-2.5 ${SOFT}`}>{[r.town, r.county_name].filter(Boolean).join(", ")}</td>
                  <td className={`break-words px-2 py-2.5 ${SOFT}`}>{r.trade_names.join(", ")}</td>
                  <td className={`break-words px-2 py-2.5 ${SOFT}`}>{basis ? <Locked /> : (r.behov ?? "")}</td>
                  <td className={`px-2 py-2.5 ${SOFT}`}>{dayNo(r.published)}</td>
                  <td className="px-2 py-1.5">
                    <StatusButton row={r} send={send} />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button type="button" className={`${BTN_OUTLINE} px-3 text-sm`} aria-haspopup="dialog" onClick={() => openLead(r)}>
                      Åpne lead
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className={`flex flex-col sm:hidden ${DIVIDE_L}`}>
            {page.map((r) => (
              <li key={r.orgnr} className="flex min-w-0 flex-col gap-2 py-3 first:pt-0">
                <div className="min-w-0">
                  <p className={`break-words text-[15px] font-semibold ${INK}`}>{r.name}</p>
                  <p className={`break-words text-sm ${MUTED_L}`}>{[[r.town, r.county_name].filter(Boolean).join(", "), r.trade_names.join(", "), r.published ? dayNo(r.published) : null].filter(Boolean).join(" · ")}</p>
                  <p className={`break-words text-sm ${SOFT}`}>{basis ? <Locked label="Behov" /> : r.behov}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusButton row={r} send={send} />
                  <button type="button" className={BTN_OUTLINE} aria-haspopup="dialog" onClick={() => openLead(r)}>
                    Åpne lead
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {rows.length > shown ? (
            <button type="button" className={`${BTN_OUTLINE} self-start`} onClick={() => setShown((n) => n + PAGE)}>
              Vis flere ({rows.length - shown})
            </button>
          ) : null}
        </>
      )}

      {projects ? (
        <div id="ms-hiring-projects" className="scroll-mt-6">
          <TrialBanner
            projects={projects}
            trades={subscription.trades}
            trial={trial}
            text={`${projects.count} offentlige byggeprosjekter i ${projects.counties.join(", ")} akkurat nå. ${projects.won_count} av bedriftene som ansetter her har nettopp vunnet ett av dem. Prøv prosjektvarsler gratis ut desember.`}
          />
        </div>
      ) : null}

      <div className={`${CARD_L} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
        <p className={`min-w-0 flex-1 basis-[220px] text-[15px] font-semibold ${INK}`}>Trenger dere folk selv?</p>
        <button type="button" className={BTN_GREEN} aria-haspopup="dialog" onClick={onAskPeople}>
          Be om folk
        </button>
      </div>

      <Feedback send={send} />

      <p className={FINE_PRINT}>{FOOTER_LINE}</p>

      {lead ? (
        <PortalModal title="Bedriftskort" onClose={() => setLead(null)}>
          <LeadCard orgnr={lead} send={send} sendData={sendData} />
        </PortalModal>
      ) : null}
      {premiumAsk ? (
        <PortalModal title="Bedriftskortet er Premium" size="narrow" onClose={() => setPremiumAsk(false)}>
          <ConfirmForm text="Med Premium ser dere hele bedriftskortet: behov, språk, bransje, ansatte og kontaktopplysninger." label="Premium" onConfirm={askPremium} onCancel={() => setPremiumAsk(false)} />
        </PortalModal>
      ) : null}
    </div>
  );
}

/** Score 1 to 5 and a few words, then a thank-you line. */
function Feedback({ send }: { send: Send }) {
  const [score, setScore] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  if (sent) {
    return (
      <div className={`${CARD_L} p-4 sm:p-5`} role="status">
        <p className={`text-[15px] ${INK}`}>Takk for tilbakemeldingen.</p>
      </div>
    );
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (score === null && !text.trim()) return;
    setBusy(true);
    setFailed(null);
    const r = await send({ action: "hiring_feedback", ...(score !== null ? { score } : {}), ...(text.trim() ? { text: text.trim().slice(0, 2000) } : {}) });
    setBusy(false);
    if (r.ok) setSent(true);
    else setFailed(r.message);
  };
  return (
    <form onSubmit={submit} className={`${CARD_L} flex flex-col gap-3 p-4 sm:p-5`}>
      <p className={`text-[15px] font-semibold ${INK}`}>Hvor nyttig er listen?</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Poeng fra 1 til 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-pressed={score === n} className={`${chip(score === n, true)} min-w-[44px]`} onClick={() => setScore(score === n ? null : n)}>
            {n}
          </button>
        ))}
      </div>
      <label htmlFor="ms-hiring-feedback" className="sr-only">
        Tilbakemelding
      </label>
      <textarea id="ms-hiring-feedback" className={`${FIELD_L} min-h-[88px] py-2`} value={text} maxLength={2000} placeholder="Hva kan bli bedre?" onChange={(e) => setText(e.target.value)} />
      {failed ? (
        <p role="alert" className={`text-sm ${ERROR_L}`}>
          {failed}
        </p>
      ) : null}
      <button type="submit" className={`${BTN_OUTLINE} self-start`} disabled={busy || (score === null && !text.trim())}>
        {busy ? "Sender ..." : "Send"}
      </button>
    </form>
  );
}

/** "Stopp" in the section's head: a confirm dialog, then hiring_stop. */
export function HiringStop({ send, onStopped }: { send: Send; onStopped: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={BTN_OUTLINE} aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Stopp
      </button>
      {open ? (
        <PortalModal title="Stopp varslene" size="narrow" onClose={() => setOpen(false)}>
          <ConfirmForm
            text="Dere får ikke flere varsler om bedrifter som ansetter."
            label="Stopp"
            onCancel={() => setOpen(false)}
            onConfirm={async () => {
              const r = await send({ action: "hiring_stop" });
              if (r.ok) {
                setOpen(false);
                onStopped();
              }
              return r;
            }}
          />
        </PortalModal>
      ) : null}
    </>
  );
}
