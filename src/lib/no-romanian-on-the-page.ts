/**
 * Romanian has no place on a public job page.
 *
 * HIS WORDS, 4 October 2026: "are texte in romana desi am stabilit reguli
 * clare". The page is Norwegian and English. The worker language belongs to
 * the Facebook post, which is written for the people who read it.
 *
 * It got there through the screener questions: the public feed served those
 * prompts as the job's "requirements", and a screener is written in the
 * language of whoever will answer it. Three live pages carried "Esti cetatean
 * UE/SEE?" under an English heading for a day.
 *
 * TWO SIGNALS, BECAUSE EITHER ALONE IS WRONG. The diacritics catch properly
 * written Romanian; the words catch the stripped-down form our own generators
 * produce. Norwegian has no a-breve, i-circumflex or comma-below letters, so
 * the first costs nothing. The word list is small and specific on purpose: a
 * single word, matched whole, and nothing that is also a Norwegian or English
 * word.
 */

/** Letters that appear in Romanian and in neither Norwegian nor English. */
const ROMANIAN_LETTERS = /[ăâîșțşţ]/u;

/** Whole words from the adverts and questions we actually generate. */
const ROMANIAN_WORDS = [
  "esti",
  "cetatean",
  "cand",
  "poti",
  "incepe",
  "diploma",
  "calificare",
  "angajam",
  "cazare",
  "asigurata",
  "experienta",
  "permisul",
  "aplici",
  "stabilim",
  "verificam",
];

export type RomanianHit = { kind: "letter" | "word"; found: string };

/** What gave it away, or null when the text carries no Romanian. */
export function romanianIn(text: string | null | undefined): RomanianHit | null {
  const value = String(text ?? "");
  if (!value) return null;

  const letter = ROMANIAN_LETTERS.exec(value);
  if (letter) return { kind: "letter", found: letter[0] };

  const lower = value.toLowerCase();
  for (const word of ROMANIAN_WORDS) {
    if (new RegExp(`\\b${word}\\b`, "u").test(lower)) return { kind: "word", found: word };
  }
  return null;
}

export function hasRomanian(text: string | null | undefined): boolean {
  return romanianIn(text) !== null;
}
