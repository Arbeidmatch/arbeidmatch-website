export type HiringModel = "staffing" | "recruitment" | null;

export function contractLabel(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw) return null;
  // REPAIR R46, 4 October 2026. This answered "Fast", a Norwegian word, in the
  // English facts panel and in "The terms", on a page whose every other word is
  // English. The Norwegian wording belongs in the Norsk block, which is built
  // from the job's fields in the ATS.
  if (raw === "permanent" || raw.startsWith("permanent ") || raw === "fast" || raw.startsWith("fast ")) return "Permanent";
  if (raw === "temporary" || raw.startsWith("temporary ") || raw === "contract" || raw.startsWith("contract ") || raw === "midlertidig") return "Temporary";
  if (raw === "substitute" || raw.startsWith("substitute ") || raw === "vikariat") return "Vikariat";
  if (raw === "seasonal" || raw.startsWith("seasonal ") || raw === "sesong" || raw === "sesongarbeid") return "Seasonal";
  return value instanceof String || typeof value === "string" ? String(value).trim() || null : null;
}

export function hiringModelLabel(model: HiringModel): string | null {
  if (model === "staffing") return "ArbeidMatch employs you directly (Bemanning)";
  if (model === "recruitment") return "The client employs you; ArbeidMatch recruits (Recruitment)";
  return null;
}

/**
 * What happens after the person presses Apply, which is not the same sentence
 * for the two arrangements.
 *
 * REPAIR R21, 4 October 2026. The advert told every reader "we review your
 * application with the client, and if selected we contact you", which is the
 * recruitment process. Under bemanning ArbeidMatch is the employer: we
 * interview, we take the person on, and the client signs a timesheet. Telling a
 * bemanning applicant that a client picks them describes a decision nobody
 * makes, and the two sentences also set different expectations about who they
 * will be talking to.
 *
 * When the ATS has not resolved the model, the sentence says only what is true
 * either way rather than guessing one of them.
 */
export function applyNextStep(model: HiringModel): string {
  if (model === "staffing") {
    return "We review your application and contact you for an interview. If we take you on, ArbeidMatch is your employer and places you with the client.";
  }
  if (model === "recruitment") {
    return "We review your application with the client. If selected, we contact you to arrange an interview.";
  }
  return "We review your application and contact you about the next step.";
}
