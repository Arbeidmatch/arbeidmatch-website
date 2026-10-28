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

/** A filter chip, chosen or not; `tall` gives it the full 44px of a control on its own. */
export function chip(on: boolean, tall = false): string {
  return `inline-flex ${tall ? "min-h-[44px] justify-center" : "min-h-[36px]"} items-center rounded-full px-3.5 text-[13px] transition-colors disabled:opacity-60 ${
    on ? "bg-[#1B2B44] font-semibold text-white" : "border border-[#C9CFD8] bg-white text-[#3D4B60] hover:border-[#1B2B44]"
  }`;
}

// ORDER 157 (Bedrifter som ansetter): the gold card, the green "sent" card, the lock, and the light fields.

/** A card that offers something: the soft gold of the one-time question. */
export const GOLD_CARD = "rounded-[14px] border border-[#E9D9A6] bg-[#FBF6E8]";
/** A card that confirms something was sent. */
export const GREEN_CARD = "rounded-[14px] border border-[#BFE3CF] bg-[#E3F4EA]";
/** Dark green text on the green card. */
export const GREEN_TEXT = "text-[#146C43]";
/** What only Premium shows: a lock mark and the word, in dark gold, never clickable. */
export const LOCKED = "inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#7A5A12]";
/** A filter that only Premium has, drawn as a chip that cannot be pressed. */
export const LOCKED_CHIP = "inline-flex min-h-[44px] cursor-not-allowed items-center gap-1.5 rounded-full border border-dashed border-[#E9D9A6] bg-[#FBF6E8] px-3.5 text-[13px] text-[#7A5A12]";
/** A field on the white page: select, date or text. */
export const FIELD_L =
  "min-h-[44px] w-full rounded-[10px] border border-[#C9CFD8] bg-white px-3 text-[15px] text-[#1B2B44] focus:border-[#1B2B44] focus:outline-none focus:ring-1 focus:ring-[#1B2B44]";
/** The thin rule between rows and above a footer. */
export const RULE = "border-[#EFEBE2]";
export const DIVIDE_L = "divide-y divide-[#EFEBE2]";
/** A table's head row on the white page. */
export const TH_L = "border-b border-[#E6E1D6] px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#6B7584]";
/** An error on the white page, and inside a dark dialog. */
export const ERROR_L = "text-[#B42318]";
export const ERROR_D = "text-[#FF9B9B]";
/** A checkbox inside a dark dialog. */
export const CHECK_D = "h-5 w-5 shrink-0 accent-[#C9A84C]";
/** The smallest print on the page (the projects' source line has the same). */
export const FINE_PRINT = "text-[11px] font-normal leading-normal text-[#9AA3AF]";

/** A text link inside a list, navy and underlined. */
export const LINK_L = "inline-flex min-h-[44px] shrink-0 items-center whitespace-nowrap text-sm font-semibold text-[#1B2B44] underline underline-offset-4 hover:text-[#24385a]";
