import { describe, expect, it } from "vitest";

import { candidateJoinBodySchema, candidateJoinPayload } from "./candidateJoinConsent";

/**
 * Candidate sign-up after the legal review of 25 September 2026: citizenship
 * (passport or national ID card) instead of "passport", the consent on its own,
 * and the old field still understood.
 */
describe("candidate join consent", () => {
  it("sends the consent and the citizenship answer, with the old field kept beside it", () => {
    expect(candidateJoinPayload({ email: "a@example.com", consent: true, euEeaCitizen: true })).toEqual({
      email: "a@example.com",
      gdpr_consent: true,
      eu_eea_citizenship_confirmed: true,
      eu_eea_passport_confirmed: true,
    });
  });

  it("accepts what the page sends now", () => {
    const body = candidateJoinPayload({ email: " A@Example.com ", consent: true, euEeaCitizen: true });
    const parsed = candidateJoinBodySchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.email).toBe("a@example.com");
  });

  it("still accepts the old payload with only eu_eea_passport_confirmed", () => {
    const parsed = candidateJoinBodySchema.safeParse({
      email: "a@example.com",
      gdpr_consent: true,
      eu_eea_passport_confirmed: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts the new field on its own", () => {
    expect(
      candidateJoinBodySchema.safeParse({ email: "a@example.com", gdpr_consent: true, eu_eea_citizenship_confirmed: true }).success,
    ).toBe(true);
  });

  it("refuses without consent or without the citizenship confirmation", () => {
    expect(candidateJoinBodySchema.safeParse(candidateJoinPayload({ email: "a@example.com", consent: false, euEeaCitizen: true })).success).toBe(false);
    expect(candidateJoinBodySchema.safeParse(candidateJoinPayload({ email: "a@example.com", consent: true, euEeaCitizen: false })).success).toBe(false);
    expect(candidateJoinBodySchema.safeParse({ email: "a@example.com", gdpr_consent: true }).success).toBe(false);
  });
});
