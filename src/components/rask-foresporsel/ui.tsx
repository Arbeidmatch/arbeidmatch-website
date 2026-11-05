import type { ReactNode } from "react";

/**
 * The popup's few parts, on the brief of 29 October 2026 (src/app/beta/BetaForside.tsx):
 * paper, ink, navy, mist, hairline; gold only as a one pixel line; green only
 * for the button that asks us for people. No cards, no gradients, no icons.
 *
 * Buttons, his rules of 15 October and 3 November 2026: one or two words, the
 * same size, 160 x 44 on a computer, stacked full width on a phone with the
 * primary first. Context lines go above them, never inside.
 */

export type Tone = "light" | "dark";

const focus = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D1B2A]";
const focusDark = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export const serif = "font-[family-name:var(--font-serif)] font-light tracking-[-0.01em]";

export function StepTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} tabIndex={-1} className={`${serif} text-[30px] leading-[1.1] text-[#0D1B2A] outline-none sm:text-[36px]`}>
      {children}
    </h2>
  );
}

export function Tile({
  selected,
  onClick,
  children,
  sub,
  tone = "light",
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  sub?: string;
  tone?: Tone;
  /** A multi-select tile says so to a screen reader with aria-pressed. */
  multi?: boolean;
}) {
  const light = selected
    ? "border-[#0D1B2A] bg-[#0D1B2A] text-white"
    : "border-[#E6E1D6] bg-white text-[#14202F] hover:border-[#0D1B2A]/40";
  const dark = selected ? "border-white bg-white text-[#0D1B2A]" : "border-white/20 bg-transparent text-white hover:border-white/50";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={multi ? selected : undefined}
      data-selected={selected ? "true" : undefined}
      className={`flex min-h-[52px] w-full flex-col items-start justify-center rounded-md border px-4 py-3 text-left text-[15px] font-medium leading-snug transition-colors duration-150 ${
        tone === "dark" ? `${dark} ${focusDark}` : `${light} ${focus}`
      }`}
    >
      <span>{children}</span>
      {sub ? (
        <span
          className={`mt-0.5 text-[13px] font-normal ${
            selected ? (tone === "dark" ? "text-[#0D1B2A]/70" : "text-white/75") : tone === "dark" ? "text-white/60" : "text-[#6B7382]"
          }`}
        >
          {sub}
        </span>
      ) : null}
    </button>
  );
}

export function TileGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={`grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 ${cols === 3 ? "sm:grid-cols-3" : ""}`}>{children}</div>;
}

const btn = `inline-flex h-11 w-full items-center justify-center whitespace-nowrap rounded-md px-5 text-[14.5px] font-semibold transition-colors duration-150 sm:w-40 ${focus}`;
export const btnGreen = `${btn} bg-[#1D9E75] text-white hover:bg-[#1a9069] active:bg-[#157c5b]`;
export const btnOutline = `${btn} border-[1.5px] border-[#0D1B2A] bg-white text-[#0D1B2A] hover:bg-[#0D1B2A]/[0.04]`;
const btnBlocked = "aria-disabled:cursor-not-allowed aria-disabled:opacity-45 aria-disabled:hover:bg-[#1D9E75]";

/**
 * The step's buttons: the primary first in the markup (first on a phone),
 * Tilbake to its left on a computer. A blocked primary stays pressable and
 * says why (aria-disabled), so the client is told what is missing.
 */
export function StepButtons({
  primary,
  onPrimary,
  primaryBlocked = false,
  busy = false,
  onBack,
}: {
  primary?: string;
  onPrimary?: () => void;
  primaryBlocked?: boolean;
  busy?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
      {primary && onPrimary ? (
        <button
          type="button"
          onClick={onPrimary}
          aria-disabled={primaryBlocked || busy ? "true" : undefined}
          className={`${btnGreen} ${btnBlocked}`}
        >
          {primary}
        </button>
      ) : null}
      {onBack ? (
        <button type="button" onClick={onBack} className={btnOutline}>
          Tilbake
        </button>
      ) : null}
    </div>
  );
}

export function InlineError({ id, children, tone = "light" }: { id?: string; children: ReactNode; tone?: Tone }) {
  return (
    <p id={id} role="alert" className={`mt-2 text-[13.5px] ${tone === "dark" ? "text-red-300" : "text-[#A33A2B]"}`}>
      {children}
    </p>
  );
}

export const inputClass = `h-11 w-full rounded-md border border-[#E6E1D6] bg-white px-3 text-[15px] text-[#14202F] placeholder:text-[#6B7382]/70 ${focus}`;
export const inputClassDark = `h-11 w-full rounded-md border border-white/25 bg-transparent px-3 text-[15px] text-white placeholder:text-white/40 ${focusDark}`;
export const labelClass = "text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#6B7382]";
export const labelClassDark = "text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/60";
