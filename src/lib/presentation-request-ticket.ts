/**
 * THE REQUEST TICKET A PERSONALISED PRESENTATION CARRIES (the owner, 24
 * September 2026: "vreau ca prezentarea pe care o trimit personalizata ... sa
 * poata fi trimisa direct catre formular fara sa mai treaca prin otp ... numai
 * cine vine din site sa treaca prin otp").
 *
 * A deck the ATS sends to a known company and a known address carries a
 * request_tokens row of its own, minted by the ATS
 * (src/lib/prospects/presentation-request-link.ts over there), with
 * how_did_you_hear = "presentation". Its "Send gratis forespørsel" button opens
 * the wizard on that ticket directly: no code by e-mail and no consent box,
 * because we wrote to that address ourselves and the request is what they
 * choose to send. The wizard's last step still links the privacy policy.
 *
 * gdpr_consent stays false on these rows, because nobody ticked anything, and
 * saying otherwise would be a false record. So the gate below lets such a
 * ticket through on the presentation marker alone. Every other ticket keeps
 * today's rule: consent given through the OTP step, or blocked.
 */

export const PRESENTATION_SOURCE = "presentation";

export type TicketGateRow = {
  gdpr_consent?: boolean | null;
  how_did_you_hear?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  used?: boolean | null;
};

/** True for a ticket a presentation carries. */
export function isPresentationTicket(row: Pick<TicketGateRow, "how_did_you_hear"> | null | undefined): boolean {
  return String(row?.how_did_you_hear ?? "").trim() === PRESENTATION_SOURCE;
}

/**
 * A presentation ticket always opens the wizard (his rule, 28 September 2026:
 * "din prezentarea trimisa trebuie sa intre in formularul de cerere"; the
 * "fill in the first request form" screen "nu are sens din prezentare"). It
 * used to close after one request and after 30 days, which sent a client who
 * came back to the deck to a dead end. Every request it sends is its own row.
 */
export function presentationTicketIsValid(row: TicketGateRow | null | undefined): boolean {
  return !!row && isPresentationTicket(row);
}

/** The wizard's gate: consent given through the OTP step, or a presentation's ticket. */
export function ticketPassesGate(row: TicketGateRow | null | undefined): boolean {
  if (!row) return false;
  if (row.gdpr_consent === true) return true;
  return presentationTicketIsValid(row);
}
