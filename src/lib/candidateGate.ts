import { z } from "zod";

/**
 * THE ONE ENTRY GATE FOR NEW CANDIDATES (ORDER 396, 20 November 2026).
 *
 * His words: "sa fie o singura poarta de intrare si aia sa fie prin site nu prin
 * ats". A new candidate creates a profile only through /candidate-register. The
 * sheet asks, in this order: citizenship, date of birth (18 or older), e-mail,
 * and one consent that says exactly what is accepted. Our server sends the
 * answers to RecOS (api/public/candidate-gate), which stores them and hands
 * back a signed, single-use token; the letter's button opens RecOS's register
 * page with it. RecOS creates no self-registered profile without one.
 *
 * Every other door (a job's Register, a recruiter's /register/<handle>, a
 * referral, the Messenger bot) opens this page with a source, which travels
 * with the answers and ends up on the profile.
 */

/**
 * The one consent, word for word what the sheet shows (the lead, then the
 * privacy notice as a link); its version is recorded with the answers. A
 * change of these words is a new version.
 */
export const GATE_CONSENT_TEXT_LEAD =
  "I agree that ArbeidMatch Norge AS stores my e-mail address, my date of birth and my citizenship answer, creates my candidate profile in its recruitment system and contacts me about work, as described in the";
export const GATE_CONSENT_TEXT = `${GATE_CONSENT_TEXT_LEAD} privacy notice.`;
export const GATE_CONSENT_TEXT_VERSION = "candidate-register-2026-11-20";

export type GateCitizenship = "eu_eea" | "work_permit" | "other";
export type GateCitizenshipRule = "eu_eea_only" | "eu_eea_or_work_permit";
/**
 * His answer to card APR-DD1C18A0, 20 November 2026: rule B, EU/EEA citizens or
 * holders of a Norwegian work permit (ORDER 426). RecOS says the rule in force;
 * this is what the sheet asks when RecOS cannot be reached.
 */
export const DEFAULT_CITIZENSHIP_RULE: GateCitizenshipRule = "eu_eea_or_work_permit";

export function parseCitizenshipRule(value: unknown): GateCitizenshipRule {
  return value === "eu_eea_or_work_permit" || value === "eu_eea_only" ? value : DEFAULT_CITIZENSHIP_RULE;
}

export function citizenshipAccepted(answer: GateCitizenship, rule: GateCitizenshipRule): boolean {
  return answer === "eu_eea" || (answer === "work_permit" && rule === "eu_eea_or_work_permit");
}

const SOURCE = /^(job|invite|ref|bot|ga):[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;

/**
 * Where the visitor came from, as the address bar of /candidate-register says
 * it: `source=job:<slug>` and the like, or the shorter `job=`, `invite=`,
 * `ref=`, `bot=`. The site's own visitor id (am_ga) is the fallback. Anything
 * else is the site itself; RecOS checks the shape again.
 */
export function gateSourceFrom(params: { get(name: string): string | null }, amGa?: string | null): string {
  const direct = (params.get("source") ?? "").trim();
  if (SOURCE.test(direct)) return direct;
  for (const kind of ["job", "invite", "ref", "bot"] as const) {
    const value = (params.get(kind) ?? "").trim();
    if (value && SOURCE.test(`${kind}:${value}`)) return `${kind}:${value}`;
  }
  const ga = String(amGa ?? "").trim();
  if (ga && SOURCE.test(`ga:${ga}`)) return `ga:${ga}`;
  return "site";
}

/** The address of the gate with a source, for the other doors. */
export function candidateRegisterHref(source: string): string {
  return SOURCE.test(source) ? `/candidate-register?source=${encodeURIComponent(source)}` : "/candidate-register";
}

/** Years between a YYYY-MM-DD date and today, Oslo's calendar day being close enough here; RecOS checks again. */
export function isAdult(dob: string, today: Date = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1;
  return age >= 18 && age < 100;
}

export const candidateGateBodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  citizenship: z.enum(["eu_eea", "work_permit", "other"]),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consent: z.literal(true),
  consent_text_version: z.literal(GATE_CONSENT_TEXT_VERSION),
  source: z.string().max(220).optional(),
});

export type CandidateGateBody = z.infer<typeof candidateGateBodySchema>;
