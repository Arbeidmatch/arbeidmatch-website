"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Send } from "lucide-react";

import {
  addressProblem,
  checkedFrom,
  counterWords,
  fieldsAllowed,
  filledAddresses,
  RECOMMEND_NO,
  RECOMMEND_NOTE_MAX,
  type CheckedAddress,
  type RecommendState,
} from "@/lib/min-side/recommend";
import type { Fetched } from "./MinSideHiring";
import { BODY, GREY, GROUP, INPUT, NAVY, PILL, PILL_NAVY, SMALL } from "./ios";

/**
 * ORDER 274: "Anbefal Prosjektvarsler". A centred dialog over a dimmed page,
 * in the look of the key dialog. It opens by itself at most once a login when
 * the ATS says it is due (the caller decides, after the key dialog and the
 * install prompt have had their turn), and always from the row "Anbefal til
 * andre". Nothing is mailed from here: each address becomes a card in the
 * owner's bell, and only his Send mails it.
 */

const FINE_PRINT =
  "Vi sender én e-post til hver adresse, med anbefalingen og hilsenen deres. Ingen påminnelser. Firmaer som allerede er kunder eller er anbefalt før, får ingen e-post.";

export default function MinSideRecommend({
  state,
  auto,
  sendData,
  onLater,
  onClose,
  onSent,
}: {
  state: RecommendState;
  /** Opened by itself: "Senere" then keeps it away for 14 days. From the row it only closes. */
  auto: boolean;
  sendData: (body: Record<string, unknown>) => Promise<Fetched>;
  onLater: () => void;
  onClose: () => void;
  onSent: () => void;
}) {
  const [used, setUsed] = useState(state.used);
  const [fields, setFields] = useState<string[]>([""]);
  const [problems, setProblems] = useState<(string | null)[]>([null]);
  const [checked, setChecked] = useState<Record<string, CheckedAddress>>({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thanks, setThanks] = useState<string | null>(null);
  const first = useRef<HTMLInputElement>(null);
  const lastChecked = useRef("");

  const allowed = fieldsAllowed(used, state.limit);

  useEffect(() => {
    first.current?.focus();
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, []);

  const later = () => {
    if (busy) return;
    if (auto && !thanks) onLater();
    onClose();
  };

  /** The firm beside each address, and whether it is already a client or already recommended. Nothing is saved. */
  const check = async () => {
    const emails = filledAddresses(fields).filter((e) => !addressProblem(e));
    const key = emails.join(",");
    if (!emails.length || key === lastChecked.current) return;
    lastChecked.current = key;
    const r = await sendData({ action: "recommend_check", emails });
    if (!r.ok) return;
    const got = checkedFrom(r.data);
    setChecked((m) => {
      const next = { ...m };
      for (const row of got.rows) next[row.email] = row;
      return next;
    });
    if (got.used !== null) setUsed(Math.min(got.used, state.limit));
  };

  const setField = (i: number, v: string) => {
    setFields((f) => f.map((x, j) => (j === i ? v : x)));
    setProblems((p) => p.map((x, j) => (j === i ? null : x)));
    setError(null);
  };

  const blur = (i: number) => {
    const p = addressProblem(fields[i] ?? "");
    setProblems((list) => list.map((x, j) => (j === i ? p : x)));
    if (!p) void check();
  };

  const add = () => {
    if (fields.length >= allowed) return;
    setFields((f) => [...f, ""]);
    setProblems((p) => [...p, null]);
  };

  const submit = async () => {
    const found = fields.map((f) => addressProblem(f));
    setProblems(found);
    if (found.some(Boolean)) return;
    const emails = filledAddresses(fields);
    if (!emails.length) {
      setError(RECOMMEND_NO.none);
      return;
    }
    if (note.length > RECOMMEND_NOTE_MAX) {
      setError(RECOMMEND_NO.noteTooLong);
      return;
    }
    setBusy(true);
    setError(null);
    const r = await sendData({ action: "recommend_send", emails, note: note.trim() });
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    const got = checkedFrom(r.data);
    if (got.used !== null) setUsed(Math.min(got.used, state.limit));
    const message = (r.data as { message?: unknown } | null)?.message;
    setThanks(typeof message === "string" && message.trim() ? message.trim() : RECOMMEND_NO.thanks);
    onSent();
  };

  const beside = (value: string) => {
    const c = checked[value.trim().toLowerCase()];
    if (!c) return null;
    if (c.mark_no) return <span className={`${SMALL} font-semibold text-[#9A6A00]`}>{c.mark_no}</span>;
    return c.company_name ? <span className={`${SMALL} ${GREY}`}>{c.company_name}</span> : null;
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#0D1B2A]/55 p-4" onKeyDown={(e) => e.key === "Escape" && later()}>
      <div role="dialog" aria-modal="true" aria-labelledby="ms-rec-title" className="my-auto flex w-full max-w-[480px] flex-col gap-4 rounded-[18px] bg-white p-6 shadow-xl">
        {thanks ? (
          <>
            <span className="flex h-14 w-14 items-center justify-center self-center rounded-full bg-[#EAF0F8]" aria-hidden>
              <Send className="h-7 w-7 text-[#1B2B44]" strokeWidth={1.75} />
            </span>
            <p id="ms-rec-title" role="status" className={`text-center text-[1.25rem] font-bold leading-snug ${NAVY}`}>
              {thanks}
            </p>
            <button type="button" className={`${PILL_NAVY} w-full`} onClick={onClose}>
              Lukk
            </button>
          </>
        ) : (
          <>
            <span className={`self-start rounded-full bg-[#EAF0F8] px-3 py-1 ${SMALL} font-semibold ${NAVY}`}>{RECOMMEND_NO.tag}</span>
            <h2 id="ms-rec-title" className={`text-[1.375rem] font-bold leading-tight ${NAVY}`}>
              {RECOMMEND_NO.title}
            </h2>
            <p className={`${BODY} ${NAVY}`}>{RECOMMEND_NO.text}</p>

            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-5 gap-1.5" aria-hidden>
                {Array.from({ length: state.limit }, (_, i) => (
                  <span key={i} className={`h-1.5 rounded-full ${i < used ? "bg-[#1B2B44]" : "bg-[#E3E3E8]"}`} />
                ))}
              </div>
              <p className={`${SMALL} ${GREY}`}>{counterWords(used, state.limit)}</p>
            </div>

            {allowed > 0 ? (
              <form
                className="flex flex-col gap-3"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                {fields.map((v, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <label htmlFor={`ms-rec-${i}`} className="sr-only">
                      E-postadresse {i + 1}
                    </label>
                    <input
                      ref={i === 0 ? first : undefined}
                      id={`ms-rec-${i}`}
                      type="email"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="navn@firma.no"
                      className={INPUT}
                      value={v}
                      maxLength={254}
                      aria-invalid={problems[i] ? true : undefined}
                      aria-describedby={problems[i] ? `ms-rec-e-${i}` : undefined}
                      onChange={(e) => setField(i, e.target.value)}
                      onBlur={() => blur(i)}
                    />
                    {problems[i] ? (
                      <span id={`ms-rec-e-${i}`} className={`${SMALL} text-[#C4231A]`}>
                        {problems[i]}
                      </span>
                    ) : (
                      beside(v)
                    )}
                  </div>
                ))}
                {fields.length < allowed ? (
                  <button type="button" className={`self-start font-semibold ${BODY} ${NAVY} min-h-[3rem] md:min-h-[2rem]`} onClick={add}>
                    {RECOMMEND_NO.addMore}
                  </button>
                ) : null}
                <div className="flex flex-col gap-1">
                  <label htmlFor="ms-rec-note" className={`${SMALL} font-semibold ${NAVY}`}>
                    Hilsen <span className={`font-normal ${GREY}`}>(valgfritt)</span>
                  </label>
                  <textarea
                    id="ms-rec-note"
                    rows={2}
                    maxLength={RECOMMEND_NOTE_MAX}
                    className={`${INPUT} py-2`}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <span className={`self-end ${SMALL} ${GREY}`}>
                    {note.length}/{RECOMMEND_NOTE_MAX}
                  </span>
                </div>
                {error ? (
                  <p role="alert" className={`${SMALL} text-[#C4231A]`}>
                    {error}
                  </p>
                ) : null}
                <div className="grid w-full grid-cols-2 gap-3">
                  <button type="button" className={`${PILL} w-full`} disabled={busy} onClick={later}>
                    {RECOMMEND_NO.later}
                  </button>
                  <button type="submit" className={`${PILL_NAVY} w-full !whitespace-normal`} disabled={busy}>
                    {RECOMMEND_NO.send}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className={`${BODY} ${NAVY}`}>Dere kan anbefale opptil {state.limit} firmaer.</p>
                <button type="button" className={`${PILL} w-full`} onClick={onClose}>
                  Lukk
                </button>
              </>
            )}

            {state.rows.length ? (
              <div className="flex flex-col gap-1.5">
                <p className={`${SMALL} font-semibold ${NAVY}`}>Deres anbefalinger</p>
                <ul className={`${GROUP} border border-[#E5E5EA]`}>
                  {state.rows.map((r) => (
                    <li key={r.id} className="flex min-w-0 items-center justify-between gap-3 px-3 py-2">
                      <span className={`min-w-0 truncate ${SMALL} ${NAVY}`}>{r.company_name ?? r.email ?? "Anbefaling"}</span>
                      <span className={`shrink-0 ${SMALL} ${GREY}`}>{r.status_no}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className={`${SMALL} ${GREY}`}>{FINE_PRINT}</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
