"use client";

import { Check, Lightbulb, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";

import { IDEA_MAX, MORE_MAX, SAME_DAY_THRESHOLDS, nearestThreshold, preselectedOpinion, proposalPageOf, type OpinionKey, type ProposalPage } from "@/lib/min-side/proposal";
import { BTN_NAVY, BTN_OUTLINE, CARD_L, ERROR_L, FIELD_L, GOLD_TEXT, GREEN_CARD, GREEN_TEXT, INK, MUTED_L, SOFT, chip } from "./ui";

/** His rule of 3 November 2026: text buttons 160 x 44, never full width, label centred, icon in front. */
const SIZE = "min-w-[160px] gap-2";

type Done = { message: string; already: boolean };

async function post(body: Record<string, unknown>): Promise<{ ok: true; data: Done } | { ok: false; message: string }> {
  try {
    const res = await fetch("/api/min-side/forslag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !json) return { ok: false, message: typeof json?.error === "string" ? json.error : "Det ble ikke lagret. Prøv igjen." };
    return { ok: true, data: { message: String(json.message ?? "Takk"), already: json.already === true } };
  } catch {
    return { ok: false, message: "Det ble ikke lagret. Prøv igjen." };
  }
}

/**
 * ORDER 210 part (b): the page every button of the proposals letter opens.
 * The proposal is shown pre-selected with one Bekreft; nothing is written
 * until a press. A key answered before says so and changes nothing.
 */
export default function MinSideProposal({ token, svar }: { token: string; svar: string | null }) {
  const [page, setPage] = useState<ProposalPage | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [opinion, setOpinion] = useState<OpinionKey | null>(preselectedOpinion(svar));
  const [threshold, setThreshold] = useState<number>(2);
  const [idea, setIdea] = useState("");
  const [more, setMore] = useState("");
  const [moreDone, setMoreDone] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/api/min-side/forslag?t=${encodeURIComponent(token)}`, { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        const p = res.ok ? proposalPageOf(json) : null;
        if (!live) return;
        if (!p) {
          setLoadError(typeof json?.error === "string" ? json.error : "Lenken er ikke gyldig lenger.");
          return;
        }
        setPage(p);
        if (p.same_day) setThreshold(nearestThreshold(p.same_day.threshold_mnok));
      } catch {
        if (live) setLoadError("Siden kunne ikke lastes. Prøv igjen om litt.");
      }
    })();
    return () => {
      live = false;
    };
  }, [token]);

  const press = async (extra: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    const r = await post({ t: token, ...extra });
    setBusy(false);
    if (!r.ok) setError(r.message);
    else setDone(r.data);
  };

  const sendMore = async () => {
    setBusy(true);
    setError(null);
    const r = await post({ t: token, more });
    setBusy(false);
    if (!r.ok) setError(r.message);
    else setMoreDone(r.data.message);
  };

  const answered = page?.answered ? { message: page.answered.message, already: true } : done;

  return (
    <div className={`bg-white ${INK}`}>
      <div className="container-site flex max-w-[640px] flex-col gap-6 pb-16 pt-10 md:pb-24">
        <header>
          <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${GOLD_TEXT}`}>ArbeidMatch Norge AS</p>
          <h1 className={`mb-1 mt-1.5 text-[32px] font-normal leading-tight sm:text-[40px] ${INK}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Min side
          </h1>
          <div className="mb-2.5 mt-1.5 h-[2px] w-14 bg-[#C9A84C]" aria-hidden />
          {page?.company ? <p className={`text-[15px] ${SOFT}`}>{page.company}</p> : null}
        </header>

        {!page && !loadError ? (
          <p className={`text-sm ${MUTED_L}`} role="status">
            Laster ...
          </p>
        ) : null}

        {loadError ? (
          <div className={`${CARD_L} p-[18px]`} role="alert">
            <p className={`text-[15px] font-semibold ${INK}`}>{loadError}</p>
          </div>
        ) : null}

        {page ? (
          <section className={`${CARD_L} flex flex-col gap-4 p-[18px] sm:p-6`} aria-labelledby="forslag-title">
            <h2 id="forslag-title" className={`text-[20px] font-bold leading-snug ${INK}`}>
              {page.title}
            </h2>

            {answered ? (
              <div className={`${GREEN_CARD} flex flex-col gap-3 px-[18px] py-4`} role="status">
                <p className={`flex items-start gap-2 text-[15px] font-semibold ${GREEN_TEXT}`}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  {answered.message}
                </p>
                {page.target === "opinion" && done && !done.already ? (
                  moreDone ? (
                    <p className={`text-sm ${GREEN_TEXT}`}>{moreDone}</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <label htmlFor="forslag-more" className={`text-sm font-semibold ${INK}`}>
                        {page.line ?? "Hva kunne vært bedre?"}
                      </label>
                      <textarea id="forslag-more" rows={3} maxLength={MORE_MAX} value={more} onChange={(e) => setMore(e.target.value)} className={`${FIELD_L} py-2`} />
                      <div className="flex flex-wrap gap-2.5">
                        <button type="button" className={`${BTN_OUTLINE} ${SIZE}`} disabled={busy || !more.trim()} onClick={sendMore}>
                          <Send className="h-4 w-4" aria-hidden />
                          Send
                        </button>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            ) : page.target === "opinion" ? (
              <>
                <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-labelledby="forslag-title">
                  {(page.options ?? []).map((o) => (
                    <button key={o.key} type="button" role="radio" aria-checked={opinion === o.key} className={`${chip(opinion === o.key, true)} min-w-[110px]`} onClick={() => setOpinion(o.key as OpinionKey)}>
                      {o.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" className={`${BTN_NAVY} ${SIZE}`} disabled={busy || !opinion} onClick={() => press({ answer: opinion })}>
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    {page.button}
                  </button>
                </div>
              </>
            ) : page.target === "idea" ? (
              <>
                {page.line ? <p className={`text-[15px] leading-relaxed ${SOFT}`}>{page.line}</p> : null}
                <label htmlFor="forslag-idea" className="sr-only">
                  Ideen deres
                </label>
                <textarea id="forslag-idea" rows={5} maxLength={IDEA_MAX} value={idea} onChange={(e) => setIdea(e.target.value)} className={`${FIELD_L} py-2`} />
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" className={`${BTN_NAVY} ${SIZE}`} disabled={busy || idea.trim().length < 3} onClick={() => press({ text: idea })}>
                    <Lightbulb className="h-4 w-4" aria-hidden />
                    {page.button}
                  </button>
                </div>
              </>
            ) : (
              <>
                {page.line ? <p className={`text-[15px] leading-relaxed ${SOFT}`}>{page.line}</p> : null}
                {page.same_day ? (
                  <div className="flex flex-col gap-2.5">
                    <p className={`text-sm font-semibold ${INK}`} id="forslag-threshold">
                      Varsle meg når en konkurranse over dette lyses ut ({page.same_day.sms ? "SMS" : "e-post"})
                    </p>
                    <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-labelledby="forslag-threshold">
                      {SAME_DAY_THRESHOLDS.map((t) => (
                        <button key={t} type="button" role="radio" aria-checked={threshold === t} className={`${chip(threshold === t, true)} min-w-[88px]`} onClick={() => setThreshold(t)}>
                          {t} MNOK
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2.5">
                  <button type="button" className={`${BTN_NAVY} ${SIZE}`} disabled={busy} onClick={() => press(page.same_day ? { threshold_mnok: threshold } : {})}>
                    <Check className="h-4 w-4" aria-hidden />
                    {page.button}
                  </button>
                </div>
              </>
            )}

            {error ? (
              <p role="alert" className={`text-sm font-semibold ${ERROR_L}`}>
                {error}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
