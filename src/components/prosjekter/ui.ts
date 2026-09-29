/**
 * The look shared by the three project pages, in the site's own palette: navy
 * sheet, gold accent, white text at reduced opacity for the quiet parts.
 *
 * Stage colours: planned blue, open tender gold, awarded green. A tender whose
 * deadline has passed ("closed", waiting for the award) is grey.
 */

export const STAGE_COLOR: Record<string, string> = {
  planned: "#6EA8FE",
  tender: "#C9A84C",
  awarded: "#4FC98A",
  closed: "rgba(255,255,255,0.55)",
  cancelled: "rgba(255,255,255,0.45)",
};

export const MUTED = "text-white/65";
export const CARD = "rounded-xl border border-white/10 bg-white/[0.03]";
export const PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-md bg-gold px-6 text-[15px] font-semibold text-[#0D1B2A] transition-colors hover:bg-gold-hover disabled:opacity-50";
export const SECONDARY =
  "inline-flex min-h-[44px] items-center justify-center rounded-md border border-white/20 px-5 text-sm font-medium text-white transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-50";
export const EYEBROW = "am-eyebrow font-semibold uppercase tracking-[0.2em] text-gold";
export const FIELD =
  "min-h-[44px] w-full rounded-md border border-white/15 bg-[#0A1624] px-3 text-[15px] text-white placeholder:text-white/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold";

/** A tinted background of a stage colour, for a pill. */
export function tint(color: string, percent = 14): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
