/**
 * The two halves of a job advert, Norwegian and English.
 *
 * HIS DECISION, 4 October 2026: "vreau sa fie distinctie in anunt intre limba
 * norvegiana si engleza ca pe finn, fara comutator". The page carries both,
 * the way finn.no does it: two visibly separate blocks, Norwegian first, both
 * always on the page, with no switcher to press.
 *
 * WHY THE MARKER IS A HEADING AND NOT A COMMENT. The advert arrives as HTML
 * sanitised in the ATS, and the ATS writes each half under its own heading
 * line ("Norsk", "English"). Those words are the label the reader sees AND the
 * thing this splits on, which is one decision rather than two: a separator
 * nobody can see is a separator that ends up printed the day some other reader
 * shows the description raw, and a comment would not survive the sanitiser.
 *
 * MOST ADVERTS HAVE NO MARKERS and never will: an imported posting is one
 * block of whatever language it was written in. Those answer null and the page
 * renders them exactly as it did before. Nothing here invents a translation.
 */

export type AdvertLanguages = { no: string; en: string };

/**
 * A block element whose entire text is the heading word, in any tag the
 * sanitiser allows. The word has to stand alone: an advert that opens
 * "Norsk arbeidsspraak" is a sentence, not a marker.
 */
function markerPattern(word: string): RegExp {
  return new RegExp(`<(h[1-6]|p|strong|b)\\b[^>]*>\\s*${word}\\s*</\\1>`, "i");
}

/**
 * Split an advert into its Norwegian and English halves, or null when it does
 * not carry both.
 *
 * Both are required: one marker alone means the text is not what this expects,
 * and guessing which half is which would put the wrong label on somebody's
 * advert. Either half coming out empty is the same answer, because an empty
 * panel under a heading reads as a page that failed to load.
 */
export function splitJobAdvertLanguages(html: string | null | undefined): AdvertLanguages | null {
  const text = String(html ?? "");
  if (!text.trim()) return null;

  const norsk = markerPattern("Norsk").exec(text);
  const english = markerPattern("English").exec(text);
  if (!norsk || !english) return null;
  // Norwegian first, as he asked. Anything else is not the shape we wrote.
  if (norsk.index > english.index) return null;

  const no = text.slice(norsk.index + norsk[0].length, english.index).trim();
  const en = text.slice(english.index + english[0].length).trim();
  if (!no || !en) return null;
  return { no, en };
}
