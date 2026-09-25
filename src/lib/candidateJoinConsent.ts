import { z } from "zod";

/**
 * What a candidate confirms when asking for a profile (/candidate-register), and
 * what /api/candidate-join-network accepts.
 *
 * Legal review, 25 September 2026: EU/EEA citizenship may be shown by a passport
 * or a national ID card, so the confirmation is about citizenship and is sent as
 * `eu_eea_citizenship_confirmed`. The old field `eu_eea_passport_confirmed` is
 * still sent with it and still accepted on its own, so an older page in a
 * visitor's browser keeps working. `gdpr_consent` keeps its meaning: consent to
 * process the request and the e-mail address. Reading the privacy notice is a
 * link, not part of the consent.
 */
export type CandidateJoinPayload = {
  email: string;
  gdpr_consent: boolean;
  eu_eea_citizenship_confirmed: boolean;
  /** Kept for compatibility with readers of the old field; same value as the citizenship answer. */
  eu_eea_passport_confirmed: boolean;
};

export function candidateJoinPayload(args: { email: string; consent: boolean; euEeaCitizen: boolean }): CandidateJoinPayload {
  return {
    email: args.email,
    gdpr_consent: args.consent,
    eu_eea_citizenship_confirmed: args.euEeaCitizen,
    eu_eea_passport_confirmed: args.euEeaCitizen,
  };
}

export const candidateJoinBodySchema = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    gdpr_consent: z.literal(true),
    eu_eea_citizenship_confirmed: z.boolean().optional(),
    eu_eea_passport_confirmed: z.boolean().optional(),
  })
  .refine((body) => body.eu_eea_citizenship_confirmed === true || body.eu_eea_passport_confirmed === true, {
    message: "EU/EEA citizenship must be confirmed.",
    path: ["eu_eea_citizenship_confirmed"],
  });
