import {
  ACTION_VERBS,
  EMPTY_PHRASES,
  GERUND_TO_PAST,
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
  const trade = findTrade(doc.personal.headline, doc.experience.map((entry) => entry.jobTitle));
  const notes: string[] = [];
  const cleaned = stripEmptyPhrases(doc.summary);

  if (cleaned.removed.length > 0) {
    notes.push(
      `Removed phrases that say nothing to an employer: ${cleaned.removed.slice(0, 3).join(", ")}.`,
    );
  }

  if (!trade) {
    if (!doc.summary.trim()) return null;
    const rewritten = endWithFullStop(capitaliseFirst(fixPersonalPronouns(cleaned.text)));
    if (rewritten === doc.summary.trim()) return null;
    notes.push("Tidied the wording. Add the years of experience and your main certificates.");
    return { text: rewritten, notes };
  }

  const years = yearsOfExperience(doc);
  const opener = years
    ? `${trade.title} with ${years} years of experience ${trade.summary[0]}${countryList(doc)}.`
    : `${trade.title} ${trade.summary[0]}${countryList(doc)}.`;

  const certificateSentence = doc.certifications.some((entry) => /hms|hse/i.test(entry.name))
    ? "Holds a valid HSE card and works safely in mixed-trade teams."
    : "";

  const sentences = [opener, ...trade.summary.slice(1), certificateSentence].filter(Boolean);
  const text = sentences.join(" ").slice(0, 800);

  notes.push(`Put the job title an employer searches for, ${trade.title}, in the first words.`);
  if (years) notes.push(`Stated your ${years} years of experience up front.`);
  notes.push("Wrote it in the third person, which is the convention on a Norwegian CV.");

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
