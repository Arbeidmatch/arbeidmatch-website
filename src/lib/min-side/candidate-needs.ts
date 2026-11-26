/**
 * "Hva trenger kandidatene?" (ORDER 506, his question of 25 November 2026):
 * the second, optional step of the request for people on Min side, so a
 * recruiter finds the right person without calling back. Chips rather than
 * free text, at most six controls, every one optional: the step never stops a
 * request from being sent.
 *
 * The keys are the ATS's own (src/lib/client-profile/profile.ts in RecOS): it
 * drops any value outside these lists rather than refuse the request.
 */

export type Choice = { key: string; label: string };

export const EXPERIENCE_CHOICES: readonly Choice[] = [
  { key: "0-2", label: "0-2 år" },
  { key: "3-5", label: "3-5 år" },
  { key: "5+", label: "5+ år" },
];

export const LANGUAGE_CHOICES: readonly Choice[] = [
  { key: "not_required", label: "Ikke nødvendig" },
  { key: "elementary", label: "Grunnleggende" },
  { key: "professional", label: "God" },
  { key: "full_professional", label: "Flytende" },
];

export const LICENCE_CHOICES: readonly Choice[] = [
  { key: "none", label: "Ikke nødvendig" },
  { key: "B", label: "Klasse B" },
  { key: "BE", label: "Klasse BE" },
  { key: "C/CE", label: "Klasse C/CE" },
];

export const CERTIFICATES_SHOWN = 5;

/** Certificates a trade asks for, found by a word of the trade as the client wrote it; the first match wins. */
const TRADE_CERTIFICATES: readonly { words: RegExp; certificates: readonly string[] }[] = [
  { words: /elektr|automatik/i, certificates: ["FSE-kurs"] },
  { words: /sveis/i, certificates: ["Sveisesertifikat"] },
  { words: /maskin|anlegg|grav|asfalt|vei/i, certificates: ["Maskinførerbevis"] },
  { words: /kran/i, certificates: ["Kranførerbevis"] },
  { words: /stillas/i, certificates: ["Stillaskurs"] },
  { words: /truck|lager|terminal/i, certificates: ["Truckførerbevis"] },
  { words: /rør|vvs|blikk|tak/i, certificates: ["Varme arbeider"] },
];

/** What every trade in building and construction may ask for. */
const COMMON_CERTIFICATES = ["Fagbrev", "HMS-kort", "Arbeid i høyden", "Varme arbeider"] as const;

/** The certificate chips for this trade: its own first, then the common ones, at most five. */
export function certificatesForTrade(trade: string): string[] {
  const own = TRADE_CERTIFICATES.find((t) => t.words.test(trade))?.certificates ?? [];
  const out: string[] = [];
  for (const c of [...own, ...COMMON_CERTIFICATES]) if (!out.includes(c)) out.push(c);
  return out.slice(0, CERTIFICATES_SHOWN);
}

export type CandidateNeeds = { experience: string; certificates: string[]; norwegian: string; english: string; licence: string; requirements: string };

export const EMPTY_NEEDS: CandidateNeeds = { experience: "", certificates: [], norwegian: "", english: "", licence: "", requirements: "" };

/** The needs as the request body carries them: plain short strings, certificates joined by commas. */
export function needsBody(n: CandidateNeeds): Record<string, string> {
  return { experience: n.experience, certificates: n.certificates.join(", "), norwegian: n.norwegian, english: n.english, licence: n.licence, requirements: n.requirements };
}

/** The route's pass-through of the needs to the ATS: short text only, the ATS checks every value. */
export function needsFromRaw(raw: Record<string, unknown>): Record<string, string> {
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  return {
    experience: text(raw.experience, 10),
    certificates: text(raw.certificates, 500),
    norwegian: text(raw.norwegian, 30),
    english: text(raw.english, 30),
    licence: text(raw.licence, 10),
    requirements: text(raw.requirements, 200),
  };
}
