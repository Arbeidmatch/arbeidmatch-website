/**
 * Which steps of the request wizard a client goes through.
 *
 * Internal step indexes: 0 company and contact, 1 job basics, 2 salary and
 * conditions, 3 requirements, 4 work tasks, 5 personal qualities, 6 we offer,
 * 7 review, 8 additional notes.
 *
 * A client who opens the wizard from a personalised presentation (a
 * presentation's request ticket, src/lib/presentation-request-ticket.ts) gets
 * a short wizard, the owner's decision of 24 September 2026: the three steps
 * where nothing is required are folded into the review, which becomes the last
 * step. Everyone else keeps all the steps. Whether pay and working conditions
 * are asked is decided by the service, below.
 */
/**
 * WHETHER PAY AND CONDITIONS ARE ASKED DEPENDS ON THE SERVICE, not on where the
 * client came from. His rule of 24 September 2026, the evening after the short
 * wizard: "pentru recrutare si sourcing sunt necesare, pentru clientii care vor
 * sa inchirieze de la noi nu sunt necesare ca astea le aranjam separat cu
 * clientul". Recruitment and sourcing ask them, on every path; staffing
 * (bemanning) never does, on any path, because we arrange them with the client.
 * Before a service is chosen the step is counted, so the step count only
 * shrinks once staffing is picked.
 */
export function conditionsAskedFor(service: string): boolean {
  return service !== "staffing";
}

export function wizardStepOrder(opts: { shortWizard: boolean; skipContact: boolean; askConditions?: boolean }): number[] {
  const conditions = opts.askConditions === false ? [] : [2];
  const steps = opts.shortWizard ? [1, ...conditions, 3, 4, 7] : [1, ...conditions, 3, 4, 5, 6, 7, 8];
  return opts.skipContact ? steps : [0, ...steps];
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
