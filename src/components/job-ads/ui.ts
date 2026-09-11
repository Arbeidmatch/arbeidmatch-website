/**
 * Class names for the paid-advert pages, taken from the employer request
 * wizard (app/request/[token]/page.tsx) so both read as one product: navy
 * ground, white/[0.03] cards with a gold hairline, gold labels and buttons.
 */

export const labelClass = "mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#C9A84C]";
export const fieldErrorTextClass = "mt-1 text-[12px] text-[#ef4444]";
export const fieldNoteTextClass = "mt-1 text-[12px] text-amber-300";
export const hintTextClass = "mt-1 text-[12px] text-white/50";

export function inputClass(invalid: boolean, extraClass = ""): string {
  return [
    "w-full min-h-[44px] rounded-[12px] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/40",
    "focus:outline-none focus:border-2 focus:border-[#C9A84C]",
    invalid ? "border-2 border-[#ef4444]" : "border border-white/10",
    extraClass,
  ]
    .filter(Boolean)
    .join(" ");
}

export function choiceClass(selected: boolean, extraClass = ""): string {
  return [
    "min-h-[44px] rounded-[12px] border px-4 py-3 text-left text-sm transition-colors duration-150",
    "focus:outline-none focus-visible:border-2 focus-visible:border-[#C9A84C]",
    selected
      ? "border-[#C9A84C] bg-[rgba(201,168,76,0.1)] text-white"
      : "border-white/15 text-white/70 hover:border-[rgba(201,168,76,0.4)] hover:text-white",
    extraClass,
  ]
    .filter(Boolean)
    .join(" ");
}

export const cardClass =
  "relative overflow-hidden rounded-[24px] border border-[rgba(201,168,76,0.15)] bg-white/[0.03] px-5 py-6 md:px-9 md:py-10";

export const cardHairline =
  "pointer-events-none absolute left-[10%] right-[10%] top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(201,168,76,0.5),transparent)]";

export const primaryButtonClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-[#C9A84C] px-6 py-2 text-sm font-bold text-[#0D1B2A] transition-colors duration-150 hover:bg-[#b8953f] disabled:cursor-not-allowed disabled:opacity-40";

export const secondaryButtonClass =
  "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[10px] border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors duration-150 hover:border-[rgba(201,168,76,0.4)] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

export const spinnerClass =
  "inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#0f1923]/40 border-t-[#0f1923]";

export const bigSpinnerClass =
  "inline-block h-12 w-12 animate-spin rounded-full border-[3px] border-[rgba(201,168,76,0.2)] border-t-[#C9A84C]";

export const pageShellClass = "min-h-dvh bg-[#0a0f18] px-4 py-10 text-white md:px-6 md:py-14";
