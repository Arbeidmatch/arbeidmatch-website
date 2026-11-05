"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { ANSWER_MODE_STORAGE_KEY, fetchPayFloors, formatKroner, selectPayFloor, type PayFloorRow } from "@/lib/pay-conditions";

import AnswerModeStep from "./AnswerModeStep";
import CodeStep from "./CodeStep";
import ContactStep from "./ContactStep";
import CountStep from "./CountStep";
import { chosenRoles, EMPTY_ANSWERS, firstOpenStep, INITIAL_STATE, STORAGE_KEY, TOTAL_STEPS, type RaskAnswers, type RaskState } from "./data";
import DoneStep from "./DoneStep";
import { buildRaskPayload, otpContext } from "./payload";
import PayStep from "./PayStep";
import PlaceStep from "./PlaceStep";
import RoleStep from "./RoleStep";
import TradeStep from "./TradeStep";
import WhenStep from "./WhenStep";

/**
 * "Rask forespørsel" (ORDER 224, the owner, 5 November 2026): a client asks
 * for people in eight steps, by tapping, over the page he is on.
 *
 * A centred panel of about 640px over a dimmed page on a computer, a full
 * screen sheet on a phone. Escape and the X close it; focus stays inside while
 * it is open and the page under it does not scroll. The answers are kept in
 * sessionStorage, so closing loses nothing, and are cleared once the request
 * is received.
 *
 * The code by e-mail and the save are the existing routes, called as /request
 * calls them; nothing about them changes here.
 */

type Phase = "steps" | "code" | "done";

function readStored(): RaskState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<RaskState>;
    const answers: RaskAnswers = { ...EMPTY_ANSWERS, ...(parsed.answers ?? {}) };
    const wanted = typeof parsed.step === "number" ? parsed.step : 1;
    // Never further than the first step still missing an answer.
    const step = Math.max(1, Math.min(wanted, firstOpenStep(answers) === 7 ? TOTAL_STEPS : firstOpenStep(answers)));
    return { step, answers };
  } catch {
    return INITIAL_STATE;
  }
}

function writeStored(state: RaskState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode: the answers live as long as the popup */
  }
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export default function RaskForesporselDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, setState] = useState<RaskState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("steps");
  const [floors, setFloors] = useState<PayFloorRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = "rask-foresporsel-title";
  const { step, answers } = state;

  useEffect(() => {
    setState(readStored());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && phase !== "done") writeStored(state);
  }, [state, hydrated, phase]);

  // The page under the popup does not scroll while it is open.
  useEffect(() => {
    const body = document.body;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, []);

  // Each new step is announced by moving focus to its heading.
  useEffect(() => {
    if (!hydrated) return;
    requestAnimationFrame(() => document.getElementById(titleId)?.focus());
  }, [step, phase, hydrated, answers.county]);

  // The floor RecOS holds for the trade; any failure is no floor.
  useEffect(() => {
    if (!answers.trade) {
      setFloors([]);
      return;
    }
    let cancelled = false;
    void fetchPayFloors(answers.trade).then((rows) => {
      if (!cancelled) setFloors(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [answers.trade]);

  const roles = chosenRoles(answers);
  const floor = selectPayFloor(floors, roles);

  const update = useCallback((patch: Partial<RaskAnswers>) => {
    setState((s) => ({ ...s, answers: { ...s.answers, ...patch } }));
  }, []);

  // Fra starts at the floor on this variant, until the client changes it himself.
  useEffect(() => {
    if (!hydrated || answers.payFromTouched) return;
    const next = floor !== null ? formatKroner(floor) : "";
    if (answers.payFrom !== next) update({ payFrom: next });
  }, [floor, hydrated, answers.payFromTouched, answers.payFrom, update]);

  const go = useCallback((next: number) => setState((s) => ({ ...s, step: Math.max(1, Math.min(TOTAL_STEPS, next)) })), []);

  const close = useCallback(() => {
    if (phase === "done") {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
    onClose();
  }, [onClose, phase]);

  // Escape closes wherever focus is, even after the element that held it went away.
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    // Focus that leaves the panel (a click on the dimmed page, a removed element) is brought back.
    const onFocusIn = (e: FocusEvent) => {
      const panel = panelRef.current;
      if (panel && e.target instanceof Node && !panel.contains(e.target)) document.getElementById(titleId)?.focus();
    };
    document.addEventListener("keydown", onEscape);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [close]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const sendCode = async (): Promise<boolean> => {
    const email = answers.email.trim().toLowerCase();
    const response = await fetch("/api/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, flow: "new_company", gdprConsent: true, ...otpContext(answers) }),
    });
    const data = (await response.json().catch(() => null)) as { success?: boolean; verificationId?: string; error?: string } | null;
    if (!response.ok || !data?.success || !data.verificationId) {
      throw new Error(data?.error || "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    }
    setVerificationId(data.verificationId);
    return true;
  };

  const onSend = async () => {
    setBusy(true);
    setSendError(null);
    try {
      await sendCode();
      setCodeError(null);
      setCodeNotice(null);
      setPhase("code");
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setBusy(true);
    setCodeError(null);
    setCodeNotice(null);
    try {
      await sendCode();
      setCodeNotice(`Vi har sendt en ny kode til ${answers.email.trim().toLowerCase()}.`);
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : "Vi kunne ikke sende bekreftelseskoden. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async (code: string) => {
    setBusy(true);
    setCodeError(null);
    setCodeNotice(null);
    try {
      const email = answers.email.trim().toLowerCase();
      const verify = await fetch("/api/verify-request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, flow: "new_company", verificationId: verificationId || undefined }),
      });
      const verified = (await verify.json().catch(() => null)) as { success?: boolean; token?: string; error?: string } | null;
      if (!verify.ok || !verified?.success || !verified.token) {
        setCodeError(verified?.error || "Vi kunne ikke bekrefte koden. Prøv igjen.");
        return;
      }
      const token = verified.token;
      const save = await fetch("/api/save-employer-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildRaskPayload(answers, token, floor)),
      });
      const saved = (await save.json().catch(() => null)) as { success?: boolean; referenceId?: string; error?: string; code?: string } | null;
      if (!save.ok || saved?.success !== true) {
        // The route's own refusal of pay and conditions is already in Norwegian; anything else is said here.
        setCodeError(saved?.code === "pay_conditions" && saved.error ? saved.error : "Forespørselen kunne ikke sendes. Prøv igjen.");
        return;
      }
      // The ticket is spent, as the detailed wizard spends it after its own save.
      await fetch(`/api/verify-token?token=${encodeURIComponent(token)}`, { method: "DELETE" }).catch(() => null);
      setReference(typeof saved.referenceId === "string" ? saved.referenceId : "");
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setPhase("done");
    } catch {
      setCodeError("Vi kunne ikke bekrefte koden akkurat nå. Prøv igjen.");
    } finally {
      setBusy(false);
    }
  };

  const chooseMode = (mode: "rolle" | "detaljer") => {
    if (mode === "detaljer") {
      try {
        window.sessionStorage.setItem(ANSWER_MODE_STORAGE_KEY, "detaljer");
      } catch {
        /* the address carries it too */
      }
      update({ answerMode: "detaljer" });
      onClose();
      router.push("/request?svar=detaljer");
      return;
    }
    update({ answerMode: "rolle" });
    go(2);
  };

  const stepProps = {
    answers,
    update,
    onNext: () => go(step + 1),
    onBack: () => go(step - 1),
    titleId,
  };

  const shownStep = phase === "steps" ? step : TOTAL_STEPS;

  return (
    <div className="fixed inset-0 z-[10070] flex items-stretch justify-center sm:items-center sm:p-6" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-[#0D1B2A]/55" aria-hidden="true" onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        lang="nb"
        className="relative flex h-[100dvh] w-full flex-col bg-[#FBFAF7] text-[#14202F] sm:h-auto sm:max-h-[min(92dvh,860px)] sm:w-[640px] sm:rounded-md"
      >
        <div className="relative shrink-0 border-b border-[#E6E1D6] px-5 pb-3 pt-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Image src="/brand/arbeidmatch-emblem-email.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full" />
            <span className="text-[14px] font-semibold text-[#0D1B2A]">Rask forespørsel</span>
            <span className="flex-1" />
            <button
              type="button"
              onClick={close}
              aria-label="Lukk"
              className="-mr-2 grid h-11 w-11 place-items-center rounded-md text-[26px] leading-none text-[#0D1B2A] hover:bg-[#0D1B2A]/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0D1B2A]"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          {phase !== "done" ? (
            <p className="mt-2 text-[12px] uppercase tracking-[0.14em] text-[#6B7382]" aria-live="polite">
              Steg {shownStep} av {TOTAL_STEPS}
            </p>
          ) : null}
          <div className="absolute inset-x-0 bottom-[-1px] h-px" aria-hidden="true">
            <div className="h-px bg-[#C9A84C] transition-[width] duration-300" style={{ width: `${phase === "done" ? 100 : (shownStep / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-6 sm:px-8">
          {!hydrated ? null : phase === "done" ? (
            <DoneStep titleId={titleId} reference={reference} onClose={close} />
          ) : phase === "code" ? (
            <CodeStep
              email={answers.email.trim().toLowerCase()}
              titleId={titleId}
              busy={busy}
              error={codeError}
              notice={codeNotice}
              onVerify={(code) => void onVerify(code)}
              onResend={() => void onResend()}
              onBack={() => {
                setCodeError(null);
                setPhase("steps");
              }}
            />
          ) : step === 1 ? (
            <AnswerModeStep titleId={titleId} value={answers.answerMode} onChoose={chooseMode} />
          ) : step === 2 ? (
            <TradeStep {...stepProps} />
          ) : step === 3 ? (
            <RoleStep {...stepProps} />
          ) : step === 4 ? (
            <CountStep {...stepProps} />
          ) : step === 5 ? (
            <WhenStep {...stepProps} />
          ) : step === 6 ? (
            <PlaceStep {...stepProps} />
          ) : step === 7 ? (
            <PayStep {...stepProps} floor={floor} />
          ) : (
            <ContactStep {...stepProps} onSend={() => void onSend()} busy={busy} error={sendError} />
          )}
        </div>
      </div>
    </div>
  );
}
