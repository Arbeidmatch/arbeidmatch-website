import { describe, expect, it } from "vitest";

import {
  isPresentationTicket,
  PRESENTATION_TICKET_MAX_AGE_MS,
  presentationTicketIsValid,
  ticketPassesGate,
} from "./presentation-request-ticket";

/**
 * The owner, 24 September 2026: a personalised presentation goes straight to
 * the request form, without the OTP step; only people from the site take it.
 */
const NOW = new Date("2026-09-24T12:00:00.000Z");
const DAY = 24 * 60 * 60 * 1000;
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();
const ahead = (ms: number) => new Date(NOW.getTime() + ms).toISOString();

const presentation = {
  how_did_you_hear: "presentation",
  gdpr_consent: false,
  created_at: ago(2 * DAY),
  expires_at: ahead(28 * DAY),
  used: false,
};

describe("presentation request ticket gate", () => {
  it("lets a live presentation ticket through without consent", () => {
    expect(presentationTicketIsValid(presentation, NOW)).toBe(true);
    expect(ticketPassesGate(presentation, NOW)).toBe(true);
  });

  it("refuses a presentation ticket at or past 30 days by created_at", () => {
    const old = { ...presentation, created_at: ago(PRESENTATION_TICKET_MAX_AGE_MS), expires_at: ahead(DAY) };
    expect(presentationTicketIsValid(old, NOW)).toBe(false);
    expect(ticketPassesGate(old, NOW)).toBe(false);
    expect(presentationTicketIsValid({ ...presentation, created_at: ago(29 * DAY) }, NOW)).toBe(true);
  });

  it("refuses one past its own expires_at, used, or without a readable created_at", () => {
    expect(presentationTicketIsValid({ ...presentation, expires_at: ago(1000) }, NOW)).toBe(false);
    expect(presentationTicketIsValid({ ...presentation, used: true }, NOW)).toBe(false);
    expect(presentationTicketIsValid({ ...presentation, created_at: null }, NOW)).toBe(false);
    expect(presentationTicketIsValid({ ...presentation, created_at: "not a date" }, NOW)).toBe(false);
    expect(presentationTicketIsValid({ ...presentation, created_at: ahead(DAY) }, NOW)).toBe(false);
  });

  it("keeps today's rule for every other ticket: consent or blocked", () => {
    for (const how of ["website-request", "partner", null, "Presentation ", "presentations"]) {
      const row = { ...presentation, how_did_you_hear: how };
      expect(ticketPassesGate(row, NOW)).toBe(false);
      expect(ticketPassesGate({ ...row, gdpr_consent: true }, NOW)).toBe(true);
    }
    expect(ticketPassesGate(null, NOW)).toBe(false);
  });

  it("marks only the exact source as a presentation", () => {
    expect(isPresentationTicket({ how_did_you_hear: "presentation" })).toBe(true);
    expect(isPresentationTicket({ how_did_you_hear: "partner" })).toBe(false);
    expect(isPresentationTicket(null)).toBe(false);
  });
});
