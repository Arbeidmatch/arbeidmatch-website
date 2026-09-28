import { describe, expect, it } from "vitest";

import { isPresentationTicket, presentationTicketIsValid, ticketPassesGate } from "./presentation-request-ticket";

/**
 * The owner, 24 September 2026: a personalised presentation goes straight to
 * the request form, without the OTP step; only people from the site take it.
 * And 28 September 2026: from a presentation it always does, however often
 * and however late the client comes back to it.
 */
const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-09-28T12:00:00.000Z");

const presentation = {
  how_did_you_hear: "presentation",
  gdpr_consent: false,
  created_at: new Date(NOW - 2 * DAY).toISOString(),
  expires_at: new Date(NOW + 28 * DAY).toISOString(),
  used: false,
};

describe("presentation request ticket gate", () => {
  it("lets a presentation ticket through without consent", () => {
    expect(presentationTicketIsValid(presentation)).toBe(true);
    expect(ticketPassesGate(presentation)).toBe(true);
  });

  it("still opens the form after a request was sent, and after 30 days", () => {
    expect(ticketPassesGate({ ...presentation, used: true })).toBe(true);
    expect(ticketPassesGate({ ...presentation, created_at: new Date(NOW - 90 * DAY).toISOString(), expires_at: new Date(NOW - DAY).toISOString() })).toBe(true);
  });

  it("keeps today's rule for every other ticket: consent or blocked", () => {
    for (const how of ["website-request", "partner", null, "Presentation ", "presentations"]) {
      const row = { ...presentation, how_did_you_hear: how };
      expect(ticketPassesGate(row)).toBe(false);
      expect(ticketPassesGate({ ...row, gdpr_consent: true })).toBe(true);
    }
    expect(ticketPassesGate(null)).toBe(false);
  });

  it("marks only the exact source as a presentation", () => {
    expect(isPresentationTicket({ how_did_you_hear: "presentation" })).toBe(true);
    expect(isPresentationTicket({ how_did_you_hear: "partner" })).toBe(false);
    expect(isPresentationTicket(null)).toBe(false);
  });
});
