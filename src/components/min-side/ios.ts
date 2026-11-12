/**
 * ORDER 273 (12 November 2026): Min side in the iOS / iPadOS Settings look.
 * His words: "mai dinamice ca in meniul unui mobil ios", "putem face tot min
 * side in directia asta? da", and "sa fie butoane pentru degete mai groase si
 * text mai mari pe mobil pentru cei care nu vad prea bine".
 *
 * Grouped inset lists on #F2F2F7, white rounded cards with hairline rows,
 * large titles, round pill buttons. On a phone (below 768px) every tappable is
 * at least 52px tall and 48px wide, list rows 56px, body 17px, secondary 15px,
 * large titles 32px; on a computer nothing is below 13px. Sizes are in rem so
 * the page follows the reader's own text size. Navy #1B2B44 for text and the
 * selected state, gold only for the "nye" badge and the logo, green only for
 * Planlegg bemanning, every other button white with a navy outline.
 */

export const PAGE_BG = "bg-[#F2F2F7]";
export const NAVY = "text-[#1B2B44]";
/** Grey secondary text, never lighter than #6D6D72 on white. */
export const GREY = "text-[#6D6D72]";

export const BODY = "text-[1.0625rem] leading-[1.45] md:text-[0.9375rem]";
export const SMALL = "text-[0.9375rem] leading-[1.4] md:text-[0.8125rem]";
export const LARGE_TITLE = "text-[2rem] font-bold leading-[1.15] tracking-[-0.01em] md:text-[1.875rem]";
export const GROUP_HEAD = "px-4 pb-1.5 text-[0.8125rem] font-medium uppercase tracking-[0.04em] text-[#6D6D72]";

/** A white inset group of rows with hairlines between them. */
export const GROUP = "overflow-hidden rounded-[12px] bg-white divide-y divide-[#E5E5EA]";
/** One row of a group: 56px on a phone, 44px on a computer. */
export const ROW = "flex min-h-[3.5rem] w-full min-w-0 items-center gap-3 px-4 py-2 text-left md:min-h-[2.75rem]";
export const ROW_BUTTON = `${ROW} transition-colors hover:bg-[#F7F7FA] active:bg-[#EDEDF2] disabled:cursor-default disabled:hover:bg-white`;
/** A two-line row: 64px on a phone. */
export const ROW_TWO = "min-h-[4rem] md:min-h-[3.25rem]";
/** A white card on the grey page. */
export const CARD = "rounded-[12px] bg-white";

const PILL_BASE =
  "inline-flex min-h-[3.25rem] min-w-[3rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 text-[1.0625rem] font-semibold transition-colors disabled:opacity-50 md:min-h-[2.375rem] md:px-4 md:text-[0.9375rem]";
/** Every button but one: white with a navy outline. */
export const PILL = `${PILL_BASE} border border-[#1B2B44] bg-white text-[#1B2B44] hover:bg-[#F4F6F9]`;
/** Only Planlegg bemanning is green. */
export const PILL_GREEN = `${PILL_BASE} bg-[#2E9E6B] font-bold text-white hover:bg-[#278a5d]`;
/** A navy filled button, for the one dialog that asks a yes (Lagre nøkkel). */
export const PILL_NAVY = `${PILL_BASE} bg-[#1B2B44] font-bold text-white hover:bg-[#24385a]`;
/** A destructive row's words (Stopp varslene). */
export const DANGER = "text-[#C4231A]";

/** The grey rounded search field. */
export const SEARCH =
  "min-h-[3.25rem] w-full rounded-[10px] border-0 bg-[#E3E3E8] px-3.5 text-[1.0625rem] text-[#1B2B44] placeholder:text-[#6D6D72] focus:outline-none focus:ring-2 focus:ring-[#1B2B44] md:min-h-[2.5rem] md:text-[0.9375rem]";
/** A field inside a white row or card. */
export const INPUT =
  "min-h-[3.25rem] w-full min-w-0 rounded-[10px] border border-[#C7C7CC] bg-white px-3 text-[1.0625rem] text-[#1B2B44] focus:border-[#1B2B44] focus:outline-none focus:ring-1 focus:ring-[#1B2B44] md:min-h-[2.5rem] md:text-[0.9375rem]";

/** The iOS segmented control: a grey track, the chosen part navy. */
export const SEGMENTS = "inline-flex max-w-full flex-wrap gap-0.5 rounded-[10px] bg-[#E3E3E8] p-0.5";
export function segment(on: boolean): string {
  return `inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-[8px] px-3 text-[0.9375rem] font-semibold transition-colors md:min-h-[2rem] md:text-[0.8125rem] ${
    on ? "bg-[#1B2B44] text-white" : "text-[#1B2B44] hover:bg-white/60"
  }`;
}

/** A chip of the town filter, navy filled when chosen. */
export function chipIos(on: boolean): string {
  return `inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center whitespace-nowrap rounded-full px-4 text-[0.9375rem] transition-colors md:min-h-[2rem] md:px-3 md:text-[0.8125rem] ${
    on ? "bg-[#1B2B44] font-semibold text-white" : "border border-[#C7C7CC] bg-white text-[#1B2B44] hover:border-[#1B2B44]"
  }`;
}

/** The gold count badge of new projects: the only gold on the page besides the logo. */
export const NEW_BADGE = "inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-[#C9A84C] px-2 py-0.5 text-[0.8125rem] font-bold text-[#1B2B44]";
/** The small "Ny" tag on a project. */
export const NY_TAG = "inline-flex shrink-0 items-center rounded-full bg-[#F3E9CF] px-2 py-0.5 text-[0.8125rem] font-bold text-[#1B2B44]";

/** A stage's dot colour. */
export const STAGE_DOT: Record<string, string> = { planned: "#5B7BB0", tender: "#D9A93B", closed: "#8E8E93", awarded: "#2E9E6B" };
export const STAGE_WORD: Record<string, string> = { planned: "Planlagt", tender: "Åpen", closed: "Venter på tildeling", awarded: "Tildelt" };
