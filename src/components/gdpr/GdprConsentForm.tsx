"use client";

import Link from "next/link";
import { useId, useState } from "react";

type Props = {
  showLearnMore: boolean;
  onAccept: () => void;
  onLearnMore?: () => void;
  onCatchupCancel?: () => void;
  catchupMode?: boolean;
};

export default function GdprConsentForm({
  showLearnMore,
  onAccept,
  onLearnMore,
  onCatchupCancel,
  catchupMode,
}: Props) {
  const id = useId();
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 id={`${id}-title`} className="text-xl font-bold tracking-tight text-white sm:text-2xl">
          Your Privacy Matters
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/75 sm:text-[15px]">
          We process your data to operate recruitment matching for Norwegian employers. Your data is stored securely
          within the EEA. We use external service providers who maintain strict data protection standards.
        </p>
        <p className="mt-3 text-sm text-white/70">
          <Link href="/privacy" className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          <span className="mx-2 text-white/40">·</span>
          <Link href="/terms" className="font-semibold text-[#C9A84C] underline-offset-2 hover:underline">
            Terms of Service
          </Link>
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3.5 sm:p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-[#0A0F18] text-[#C9A84C] focus:ring-[#C9A84C]"
          aria-describedby={`${id}-title`}
        />
        <span className="text-sm leading-snug text-white/85">I agree to the terms and data processing</span>
      </label>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <button
          type="button"
          disabled={!agreed}
          onClick={() => {
            onAccept();
            setAgreed(false);
          }}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-md bg-[#C9A84C] px-6 text-sm font-bold text-[#0D1B2A] shadow-[0_8px_24px_rgba(201,168,76,0.22)] transition hover:bg-[#b8953f] disabled:pointer-events-none disabled:opacity-40 sm:w-auto sm:min-w-[220px]"
        >
          Continue to ArbeidMatch
        </button>
        {catchupMode && onCatchupCancel ? (
          <button
            type="button"
            onClick={onCatchupCancel}
            className="text-center text-sm font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
          >
            Not now
          </button>
        ) : showLearnMore && onLearnMore ? (
          <button
            type="button"
            onClick={onLearnMore}
            className="text-center text-sm font-medium text-white/55 underline-offset-2 hover:text-white/80 hover:underline sm:text-left"
          >
            Learn More
          </button>
        ) : null}
      </div>
    </div>
  );
}
