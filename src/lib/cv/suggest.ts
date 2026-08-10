import {
  ACTION_VERBS,
  EMPTY_PHRASES,
  FIRST_PERSON_REWRITES,
  GERUND_TO_PAST,
  MISSPELLINGS,
  NOT_TRUNCATED,
  PREFIX_COMPLETIONS,
  SKILL_NORMALISATION,
  TRADE_PROFILES,
  WEAK_OPENERS,
  type TradeProfile,
} from "@/lib/cv/phrasing-library";
import type { CvDocument } from "@/lib/cv/schema";

/**
 * Deterministic text improvement, run entirely in the browser.
 *
 * The wording comes from `phrasing-library.ts`, which was authored offline with the
 * Claude Code CLI. Nothing here makes a network call, so a candidate's draft never
 * leaves their device before they have consented.
 */

export interface Suggestion {
  /** The improved text, ready to accept. */
  text: string;
  /** Plain English reasons, shown so the user learns rather than just clicks. */
  notes: string[];
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function findTrade(headline: string, jobTitles: string[] = []): TradeProfile | null {
  const haystack = normalise([headline, ...jobTitles].join(" "));
  if (!haystack) return null;
  for (const profile of TRADE_PROFILES) {
    if (profile.match.some((word) => haystack.includes(word))) return profile;
  }
  return null;
}

/** Keeps the capitalisation of the word that was typed. */
function matchCase(original: string, replacement: string): string {
  if (original[0] === original[0]?.toUpperCase() && original[1] !== original[1]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Completes a word cut short mid-typing, such as "experie" for "experience". */
function completeTruncated(lower: string): string | null {
  if (lower.length < 5 || NOT_TRUNCATED.has(lower)) return null;
  const targets = PREFIX_COMPLETIONS.filter(
    (word) => word.length > lower.length && word.startsWith(lower),
  );
  if (targets.length === 0) return null;
  return targets.reduce((shortest, word) => (word.length < shortest.length ? word : shortest));
}

/**
 * Fixes spelling without sending the text anywhere. The browser underlines the same words
 * as the candidate types; this makes the fix happen on a single click instead.
 */
export function fixTypos(value: string): { text: string; fixed: Array<[string, string]> } {
  const fixed: Array<[string, string]> = [];
  const text = value.replace(/[A-Za-z']+/g, (word) => {
    const lower = word.toLowerCase();
    const replacement = MISSPELLINGS[lower] ?? completeTruncated(lower);
    if (!replacement || replacement === lower) return word;
    const cased = matchCase(word, replacement);
    if (!fixed.some(([from]) => from.toLowerCase() === lower)) fixed.push([word, cased]);
    return cased;
  });
  return { text, fixed };
}

/** Rewrites "I am a carpenter" as "Carpenter", which is the Norwegian CV convention. */
export function toThirdPerson(value: string): { text: string; changed: boolean } {
  let text = value;
  for (const { pattern, replacement } of FIRST_PERSON_REWRITES) {
    text = text.replace(pattern, replacement);
  }
  return { text: text.replace(/\s{2,}/g, " ").trim(), changed: text.trim() !== value.trim() };
}

/** Years of experience written into the summary itself, when no roles have been added yet. */
function yearsFromText(value: string): number | null {
  const match = /\b(\d{1,2})\s*(?:\+\s*)?(?:years?|yrs?|yeas|yers|ani|lat|år)\b/i.exec(value);
  const years = match ? Number(match[1]) : 0;
  return years > 0 ? years : null;
}

/** Removes the punctuation left behind once filler and pronouns are cut out. */
function tidy(value: string): string {
  return value
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/,\s*\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,;:]+(and|or|but|with|for)\s*$/i, "")
    .replace(/[,;:]\s*$/, "")
    .trim();
}

function capitaliseFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fixPersonalPronouns(value: string): string {
  return value
    .replace(/\bi\b/g, "I")
    .replace(/\bim\b/gi, "I am")
    .replace(/\bi'm\b/gi, "I am");
}

function endWithFullStop(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function stripEmptyPhrases(value: string): { text: string; removed: string[] } {
  let text = value;
  const removed: string[] = [];
  for (const phrase of EMPTY_PHRASES) {
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b[.,]?\\s*`, "gi");
    if (pattern.test(text)) {
      removed.push(phrase);
      text = text.replace(pattern, "");
    }
  }
  return { text: text.replace(/\s{2,}/g, " ").trim(), removed };
}

function yearsOfExperience(doc: CvDocument): number | null {
  const years = doc.experience
    .map((entry) => {
      const start = /^\d{2}\/(\d{4})$/.exec(entry.startDate)?.[1];
      if (!start) return null;
      const end =
        entry.endDate === "Present"
          ? new Date().getFullYear()
          : Number(/^\d{2}\/(\d{4})$/.exec(entry.endDate)?.[1] ?? 0);
      if (!end) return null;
      return end - Number(start);
    })
    .filter((value): value is number => value !== null && value >= 0);

  if (years.length === 0) return null;
  const total = years.reduce((sum, value) => sum + value, 0);
  return total > 0 ? total : null;
}

function countryList(doc: CvDocument): string {
  const countries = Array.from(
    new Set(doc.experience.map((entry) => entry.country.trim()).filter(Boolean)),
  );
  if (countries.length === 0) return "";
  if (countries.length === 1) return ` in ${countries[0]}`;
  return ` in ${countries.slice(0, -1).join(", ")} and ${countries[countries.length - 1]}`;
}

/** Suggestion for the professional summary. */
export function suggestSummary(doc: CvDocument): Suggestion | null {
  const notes: string[] = [];
  const original = doc.summary.trim();

  const cleaned = stripEmptyPhrases(original);
  if (cleaned.removed.length > 0) {
    notes.push(
      `Removed phrases that say nothing to an employer: ${cleaned.removed.slice(0, 3).join(", ")}.`,
    );
  }

  const spelling = fixTypos(cleaned.text);
  if (spelling.fixed.length > 0) {
    notes.push(
      `Corrected spelling: ${spelling.fixed
        .slice(0, 4)
        .map(([from, to]) => `${from} to ${to}`)
        .join(", ")}.`,
    );
  }

  // The summary itself counts as evidence of the trade: a candidate often writes
  // "carpenter" there before filling in the headline or a single role. Detection runs on the
  // corrected text, so a trade spelled wrong is still recognised.
  const trade = findTrade(doc.personal.headline, [
    ...doc.experience.map((entry) => entry.jobTitle),
    spelling.text,
  ]);

  const person = toThirdPerson(spelling.text);
  if (person.changed) {
    notes.push("Rewrote it in the third person, which is the convention on a Norwegian CV.");
  }

  let text = endWithFullStop(capitaliseFirst(tidy(person.text)));

  if (!trade) {
    if (!original) return null;
    if (text === original) return null;
    notes.push("Add the years of experience and your main certificates.");
    return { text: text.slice(0, 800), notes };
  }

  const years = yearsOfExperience(doc) ?? yearsFromText(original);
  const opener = years
    ? `${trade.title} with ${years} years of experience ${trade.summary[0]}${countryList(doc)}.`
    : `${trade.title} ${trade.summary[0]}${countryList(doc)}.`;

  const certificateSentence = doc.certifications.some((entry) => /hms|hse/i.test(entry.name))
    ? "Holds a valid HSE card and works safely in mixed-trade teams."
    : "";

  // Nothing usable was written, or the trade is buried too far in: lead with the title an
  // employer searches for. Otherwise the candidate's own wording is kept and extended.
  const leadsWithTrade = normalise(text).slice(0, 60).includes(trade.title.toLowerCase());
  if (!text || !leadsWithTrade) {
    text = opener;
    notes.push(`Put the job title an employer searches for, ${trade.title}, in the first words.`);
    if (years) notes.push(`Stated your ${years} years of experience up front.`);
  }

  const additions = [...trade.summary.slice(1), certificateSentence]
    .filter(Boolean)
    .filter((sentence) => !normalise(text).includes(normalise(sentence).slice(0, 25)));

  // Only pad a summary that is too thin to answer what an employer reads it for.
  if (text.length < 220 && additions.length > 0) {
    for (const sentence of additions) {
      if (`${text} ${sentence}`.length > 800) break;
      text = `${text} ${sentence}`;
    }
    notes.push(
      `Added ${trade.title.toLowerCase()} sentences an employer looks for. Edit them so they match what you have actually done.`,
    );
  }

  text = text.slice(0, 800);
  if (text === original && notes.length === 0) return null;
  return { text, notes };
}

/** Suggestion for a single work experience bullet. */
export function suggestBullet(bullet: string, doc: CvDocument, roleIndex = 0): Suggestion | null {
  const original = bullet.trim();
  const trade = findTrade(
    doc.personal.headline,
    doc.experience.map((entry) => entry.jobTitle),
  );

  // Nothing typed yet, so offer a model bullet from the trade instead of a rewrite.
  if (!original) {
    if (!trade) return null;
    const used = new Set(doc.experience[roleIndex]?.bullets.map((item) => item.trim()) ?? []);
    const fresh = trade.bullets.find((item) => !used.has(item));
    if (!fresh) return null;
    return {
      text: fresh,
      notes: [`A typical ${trade.title.toLowerCase()} task. Edit it so it matches what you did.`],
    };
  }

  const notes: string[] = [];
  let text = original;

  const cleaned = stripEmptyPhrases(text);
  if (cleaned.removed.length > 0) {
    notes.push("Removed filler that adds nothing.");
    text = cleaned.text;
  }

  const spelling = fixTypos(text);
  if (spelling.fixed.length > 0) {
    text = spelling.text;
    notes.push(
      `Corrected spelling: ${spelling.fixed
        .slice(0, 4)
        .map(([from, to]) => `${from} to ${to}`)
        .join(", ")}.`,
    );
  }

  for (const { pattern, replacement } of WEAK_OPENERS) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      notes.push('Replaced a weak opener such as "responsible for" with what you actually did.');
      break;
    }
  }

  const firstWord = normalise(text).split(" ")[0] ?? "";
  const pastTense = GERUND_TO_PAST[firstWord];
  if (pastTense) {
    text = `${pastTense}${text.slice(firstWord.length)}`;
    notes.push("Changed the verb to the past tense a CV uses.");
  }

  text = fixPersonalPronouns(text);
  text = capitaliseFirst(text.trim());
  text = endWithFullStop(text);

  const startsWithVerb = ACTION_VERBS.some((verb) => text.startsWith(verb));
  if (!startsWithVerb) {
    notes.push(
      `Start with an action verb: ${ACTION_VERBS.slice(0, 6).join(", ")}. It is the first thing a recruiter looks for.`,
    );
  }

  if (!/\d/.test(text)) {
    notes.push("Add a number if you can. How many units, how many people, how long?");
  }

  if (text === original && notes.length === 0) return null;
  return { text: text.slice(0, 220), notes };
}

/** Normalises a free text skill to the wording an employer searches for. */
export function suggestSkill(skill: string): Suggestion | null {
  const value = normalise(skill);
  if (!value) return null;

  for (const entry of SKILL_NORMALISATION) {
    if (entry.match.some((word) => value.includes(word))) {
      if (entry.skill.toLowerCase() === value) return null;
      return {
        text: entry.skill,
        notes: [`Employers and their systems search for "${entry.skill}".`],
      };
    }
  }

  const capitalised = capitaliseFirst(skill.trim());
  if (capitalised === skill.trim()) return null;
  return { text: capitalised, notes: ["Capitalised so the skills list reads consistently."] };
}

/** Model skills for the trade, offered when the list is short. */
export function suggestSkillsForTrade(doc: CvDocument): string[] {
  const trade = findTrade(doc.personal.headline, doc.experience.map((entry) => entry.jobTitle));
  if (!trade) return [];
  const existing = new Set(doc.skills.map((skill) => normalise(skill)));
  return SKILL_NORMALISATION.filter((entry) =>
    trade.bullets.join(" ").toLowerCase().includes(entry.match[0]),
  )
    .map((entry) => entry.skill)
    .filter((skill) => !existing.has(normalise(skill)));
}
