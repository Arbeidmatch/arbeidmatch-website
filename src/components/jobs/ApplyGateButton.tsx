"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * The Apply button on an advert (17 September 2026).
 *
 * His instruction: pressing Apply opens a window that says a profile is needed
 * to apply, with the consent box first - GDPR, the Privacy Policy and the Terms -
 * and then the choice between signing in and creating a profile. Both doors are
 * in the candidate portal; the tick travels with them and is saved on the
 * profile when the person signs in.
 */
export function ApplyGateButton(props: {
  className: string;
  loginHref: string;
  registerHref: string;
  label?: string;
}) {
  const { className, loginHref, registerHref, label = "Apply for this job" } = props;
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const door =
    "inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
  const closed = "pointer-events-none opacity-40";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/60 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl md:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-xl font-bold text-navy">
                Sign in to apply
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="-mr-2 -mt-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none text-text-secondary hover:bg-surface"
              >
                ×
              </button>
            </div>
            <p className="mt-2 leading-relaxed text-text-secondary">
              To apply for this job, sign in to your candidate profile or create one. It takes a few minutes, and you
              apply to the next job with one press.
            </p>

            <label className="mt-5 flex items-start gap-3 rounded-xl border border-border p-4 text-sm leading-relaxed text-navy">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-[#C9A84C]"
              />
              <span>
                I consent to ArbeidMatch processing my personal data for recruitment, and I accept the{" "}
                <a href="/privacy" target="_blank" rel="noreferrer" className="font-semibold underline decoration-gold decoration-2 underline-offset-4">
                  Privacy Policy
                </a>{" "}
                and the{" "}
                <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold underline decoration-gold decoration-2 underline-offset-4">
                  Terms of Service
                </a>
                .
              </span>
            </label>

            <div className="mt-5 flex flex-col gap-3">
              <a
                href={loginHref}
                aria-disabled={!accepted}
                tabIndex={accepted ? undefined : -1}
                className={`${door} bg-gold text-navy hover:bg-gold-hover ${accepted ? "" : closed}`}
              >
                I have a profile
              </a>
              <a
                href={registerHref}
                aria-disabled={!accepted}
                tabIndex={accepted ? undefined : -1}
                className={`${door} border-2 border-navy text-navy hover:bg-surface ${accepted ? "" : closed}`}
              >
                Create my profile
              </a>
            </div>
            {!accepted ? (
              <p className="mt-3 text-center text-[13px] text-text-secondary">Tick the box to continue.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
