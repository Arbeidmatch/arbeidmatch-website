/**
 * Min side in the final design of 13 October 2026 (ORDER 101): a white page,
 * white cards with a warm 1px border, navy text, and three kinds of button
 * only. Green filled asks us for people; navy filled is a selection; white
 * with a navy outline is everything else. No gold buttons.
 *
 * The muted grey is a shade darker than the board's #6E7887 (4.47:1 on white)
 * so small text keeps 4.5:1; gold text is the dark gold of the tags (6.4:1).
 */

export const INK = "text-[#1B2B44]";
export const MUTED_L = "text-[#6B7584]";
export const SOFT = "text-[#3D4B60]";
export const GOLD_TEXT = "text-[#7A5A12]";
export const CARD_L = "rounded-[14px] border border-[#E6E1D6] bg-white";

const BASE = "inline-flex min-h-[44px] items-center justify-center rounded-[10px] px-[18px] text-[15px] transition-colors disabled:opacity-50";

/** Asking us for people. */
export const BTN_GREEN = `${BASE} bg-[#2E9E6B] font-bold text-white hover:bg-[#278a5d]`;
/** A selection. */
export const BTN_NAVY = `${BASE} bg-[#1B2B44] font-bold text-white hover:bg-[#24385a]`;
/** Everything else. */
export const BTN_OUTLINE = `${BASE} border border-[#1B2B44] bg-white font-semibold text-[#1B2B44] hover:bg-[#F4F6F9]`;

/** A filter chip, chosen or not. */
export function chip(on: boolean): string {
  return `inline-flex min-h-[36px] items-center rounded-full px-3.5 text-[13px] transition-colors disabled:opacity-60 ${
    on ? "bg-[#1B2B44] font-semibold text-white" : "border border-[#C9CFD8] bg-white text-[#3D4B60] hover:border-[#1B2B44]"
  }`;
}

/** A text link inside a list, navy and underlined. */
export const LINK_L = "inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap text-sm font-semibold text-[#1B2B44] underline underline-offset-4 hover:text-[#24385a]";
