"use client";

import Link from "next/link";
import { useId, useState } from "react";

type Props = {
  showLearnMore: boolean;
  onAccept: () => void;
  onLearnMore?: () => void;
  onCatchupCancel?: () => void;
  catchupMode?: boolean;
  /** Smaller typography and spacing (corner snack). */
  compact?: boolean;
  /** Top-right close: dismiss without accepting (initial snack only). */
  showDismiss?: boolean;
  onDismiss?: () => void;
};

export default function GdprConsentForm({
  showLearnMore,
  onAccept,
  onLearnMore,
  onCatchupCancel,
  catchupMode,
  compact,
  showDismiss,
  onDismiss,
}: Props) {
  const id = useId();
  const [agreed, setAgreed] = useState(false);

  const titleClass = compact ? "text-lg font-bold tracking-tight text-white" : "text-xl font-bold tracking-tight text-white sm:text-2xl";
  const bodyClass = compact
    ? "mt-2 text-xs leading-relaxed text-white/72 sm:text-[13px]"
    : "mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]";
  const linksClass = compact ? "mt-2 text-xs text-white/65" : "mt-3 text-sm text-white/70";

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {showDismiss && onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label="Close without accepting"
        >
          <span className="text-lg leading-none" aria-hidden>
            ×
          </span>
        </button>
      ) : null}

      <div>
        <h2 id={`${id}-title`} className={titleClass}>
          Your Privacy Matters
        </h2>
        <p className={bodyClass}>
          We process your data to operate recruitment matching for Norwegian employers. Your data is stored securely
          within the EEA. We use external service providers who maintain strict data protection standards.
        </p>
        <p className={linksClass}>
          <Link href="/privacy" className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          <span className="mx-2 text-white/40">·</span>
          <Link href="/terms" className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>

      <label
        className={`flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] ${
          compact ? "p-2.5 sm:p-3" : "p-3.5 sm:p-4"
        }`}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-[#0A0F18] text-[#C9A84C] focus:ring-[#C9A84C]"
          aria-describedby={`${id}-title`}
        />
        <span className={compact ? "text-xs leading-snug text-white/82" : "text-sm leading-snug text-white/85"}>
          I agree to the terms and data processing
        </span>
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <button
          type="button"
          disabled={!agreed}
          onClick={() => {
            onAccept();
            setAgreed(false);
          }}
          className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-md bg-[#C9A84C] font-bold text-[#0D1B2A] shadow-[0_6px_18px_rgba(201,168,76,0.18)] transition hover:bg-[#b8953f] disabled:pointer-events-none disabled:opacity-40 sm:w-auto ${
            compact ? "px-4 text-xs sm:min-w-[180px] sm:text-sm" : "px-6 text-sm sm:min-w-[220px]"
          }`}
        >
          Continue to ArbeidMatch
        </button>
        {catchupMode && onCatchupCancel ? (
          <button
            type="button"
            onClick={onCatchupCancel}
            className="text-center text-xs font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline sm:text-sm"
          >
            Not now
          </button>
        ) : showLearnMore && onLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            className="text-center text-xs font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline sm:text-left sm:text-sm"
          >
            Learn More
          </button>
        ) : null}
      </div>
    </div>
  );
}
