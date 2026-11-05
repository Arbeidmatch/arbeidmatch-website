"use client";

import { useState } from "react";

import { InlineError, inputClass, labelClass, StepButtons, StepTitle } from "./ui";

/**
 * The code sent to the work e-mail, typed in the same popup. The check is the
 * existing /api/verify-request-otp, exactly as /request calls it.
 */
export default function CodeStep({
  email,
  titleId,
  busy,
  error,
  notice,
  onVerify,
  onResend,
  onBack,
}: {
  email: string;
  titleId: string;
  busy: boolean;
  error: string | null;
  notice: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const ready = code.length === 6;
  return (
    <div>
      <StepTitle id={titleId}>Skriv inn koden</StepTitle>
      <p className="mt-3 text-[15px] text-[#14202F]">
        Vi har sendt en kode på 6 siffer til <span className="break-all font-semibold">{email}</span>. Koden er gyldig i 10 minutter.
      </p>
      <div className="mt-5">
        <label htmlFor="rf-code" className={labelClass}>
          Kode
        </label>
        <input
          id="rf-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`${inputClass} mt-2 max-w-[220px] text-center text-[18px] tracking-[0.35em]`}
        />
        <p className="mt-2 text-[13.5px] text-[#6B7382]">
          <button
            type="button"
            className="font-medium text-[#0D1B2A] underline decoration-[#C9A84C] underline-offset-4"
            onClick={onResend}
            disabled={busy}
          >
            Send ny kode
          </button>
        </p>
      </div>
      {notice ? (
        <p role="status" className="mt-2 text-[13.5px] text-[#6B7382]">
          {notice}
        </p>
      ) : null}
      {tried && !ready ? <InlineError>Skriv inn den 6-sifrede koden fra e-posten.</InlineError> : error ? <InlineError>{error}</InlineError> : null}
      <StepButtons
        primary={busy ? "Sender ..." : "Bekreft"}
        primaryBlocked={!ready}
        busy={busy}
        onPrimary={() => {
          if (busy) return;
          if (!ready) {
            setTried(true);
            return;
          }
          onVerify(code);
        }}
        onBack={onBack}
      />
    </div>
  );
}
