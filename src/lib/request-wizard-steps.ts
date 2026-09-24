/**
 * Which steps of the request wizard a client goes through.
 *
 * Internal step indexes: 0 company and contact, 1 job basics, 2 salary and
 * conditions, 3 requirements, 4 work tasks, 5 personal qualities, 6 we offer,
 * 7 review, 8 additional notes.
 *
 * A client who opens the wizard from a personalised presentation (a
 * presentation's request ticket, src/lib/presentation-request-ticket.ts) gets
 * a short wizard, the owner's decision of 24 September 2026: pay and working
 * conditions are not asked here, because the ATS asks them per position
 * afterwards in a letter of its own, and the three steps where nothing is
 * required are folded into the review, which becomes the last step. Everyone
 * else keeps the wizard exactly as before.
 */
export function wizardStepOrder(opts: { shortWizard: boolean; skipContact: boolean }): number[] {
  if (opts.shortWizard) return opts.skipContact ? [1, 3, 4, 7] : [0, 1, 3, 4, 7];
  if (opts.skipContact) return [1, 2, 3, 4, 5, 6, 7, 8];
  return [0, 1, 2, 3, 4, 5, 6, 7, 8];
}

/** The salary and conditions answers of a submission to /api/save-employer-request. */
export const CONDITION_PAYLOAD_KEYS = [
  "salaryPeriod",
  "salaryMode",
  "salary",
  "salaryAmount",
  "salaryFrom",
  "salaryTo",
  "hoursUnit",
  "hoursAmount",
  "maxOvertimeHours",
  "hasRotation",
  "rotationWeeksOn",
  "rotationWeeksOff",
  "internationalTravel",
  "localTravel",
  "localTravelOther",
  "accommodation",
  "accommodationCost",
  "accommodationOther",
  "equipment",
  "equipmentOther",
] as const;

/**
 * A submission without the salary and conditions answers, for a client who was
 * never asked them. The form's defaults ("Candidate finds own", "No rotation",
 * "Per hour", a salary of "-") are not his answers and must not reach the ATS
 * as if they were.
 */
export function withoutConditionAnswers<T extends Record<string, unknown>>(payload: T): T {
  const out: Record<string, unknown> = { ...payload };
  for (const key of CONDITION_PAYLOAD_KEYS) if (key in out) out[key] = "";
  if ("overtime" in out) out.overtime = null;
  return out as T;
}
