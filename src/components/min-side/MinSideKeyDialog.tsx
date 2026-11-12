"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ShieldCheck } from "lucide-react";

import { addPasskey } from "@/lib/min-side/passkey-browser";
import { BODY, GREY, NAVY, PILL, PILL_NAVY, SMALL } from "./ios";

/**
 * ORDER 273: "Lagre en sikkerhetsnøkkel", once, after a login from the e-mail
 * on an access with no key (lib/min-side/key-prompt.ts decides). A centred
 * dialog over a dimmed page; "Lagre nøkkel" runs the same addPasskey as the
 * Innlogging section, "Senere" keeps it away for 30 days on the ATS. After
 * either the page is on Prosjektvarsler (the caller's onDone).
 */

const TICKS = ["Tar fem sekunder", "Ingen passord å huske", "Bare denne enheten kan bruke nøkkelen"];

export default function MinSideKeyDialog({ token, onLater, onDone }: { token: string; onLater: () => void; onDone: (saved: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const save = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    save.current?.focus();
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = before;
    };
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => onDone(true), 1400);
    return () => window.clearTimeout(t);
  }, [saved, onDone]);

  const later = () => {
    onLater();
    onDone(false);
  };

  const add = async () => {
    setBusy(true);
    setError(null);
    const r = await addPasskey(token);
    setBusy(false);
    if (r.ok) setSaved(true);
    else if (!r.cancelled) setError(r.error);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0D1B2A]/55 p-4" onKeyDown={(e) => e.key === "Escape" && !busy && later()}>
      <div role="dialog" aria-modal="true" aria-labelledby="ms-key-title" className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-[18px] bg-white p-6 text-center shadow-xl">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF0F8]" aria-hidden>
          <ShieldCheck className="h-8 w-8 text-[#1B2B44]" strokeWidth={1.75} />
        </span>
        {saved ? (
          <p id="ms-key-title" role="status" className={`text-[1.375rem] font-bold ${NAVY}`}>
            Nøkkelen er lagret
          </p>
        ) : (
          <>
            <h2 id="ms-key-title" className={`text-[1.375rem] font-bold leading-tight ${NAVY}`}>
              Lagre en sikkerhetsnøkkel
            </h2>
            <p className={`${BODY} ${NAVY}`}>Neste gang logger dere inn med fingeravtrykk, ansikt eller PIN på denne enheten. Ingen e-post å vente på.</p>
            <ul className="flex w-full flex-col gap-2 text-left">
              {TICKS.map((t) => (
                <li key={t} className={`flex items-center gap-2.5 ${BODY} ${NAVY}`}>
                  <Check className="h-5 w-5 shrink-0 text-[#2E9E6B]" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            {error ? (
              <p role="alert" className={`${SMALL} text-[#C4231A]`}>
                {error}
              </p>
            ) : null}
            <div className="grid w-full grid-cols-2 gap-3">
              <button type="button" className={`${PILL} w-full`} disabled={busy} onClick={later}>
                Senere
              </button>
              <button ref={save} type="button" className={`${PILL_NAVY} w-full`} disabled={busy} onClick={() => void add()}>
                Lagre nøkkel
              </button>
            </div>
            <p className={`${SMALL} ${GREY}`}>Etterpå går dere rett til prosjektene.</p>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
