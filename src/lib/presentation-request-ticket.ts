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
 * ticket through on its own terms instead: the presentation marker, unused,
 * and younger than 30 days by created_at (and inside expires_at, which the
 * ATS sets to the same 30 days). Every other ticket keeps today's rule:
 * consent given through the OTP step, or blocked.
 */

export const PRESENTATION_SOURCE = "presentation";

/** How long a presentation's ticket stays good, counted from when it was minted. */
export const PRESENTATION_TICKET_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type TicketGateRow = {
  gdpr_consent?: boolean | null;
  how_did_you_hear?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  used?: boolean | null;
};

/** True for a ticket a presentation carries, whatever its age. */
export function isPresentationTicket(row: Pick<TicketGateRow, "how_did_you_hear"> | null | undefined): boolean {
  return String(row?.how_did_you_hear ?? "").trim() === PRESENTATION_SOURCE;
}

/**
 * A presentation ticket that may still open the wizard and save a request:
 * unused, minted less than 30 days ago, and not past its own expires_at. A row
 * without a readable created_at is refused rather than trusted.
 */
export function presentationTicketIsValid(row: TicketGateRow | null | undefined, now: Date = new Date()): boolean {
  if (!row || !isPresentationTicket(row)) return false;
  if (row.used === true) return false;
  const created = Date.parse(String(row.created_at ?? ""));
  if (!Number.isFinite(created)) return false;
  const age = now.getTime() - created;
  if (age < 0 || age >= PRESENTATION_TICKET_MAX_AGE_MS) return false;
  if (row.expires_at) {
    const expires = Date.parse(String(row.expires_at));
    if (Number.isFinite(expires) && expires <= now.getTime()) return false;
  }
  return true;
}

/** The wizard's gate: consent given through the OTP step, or a live presentation ticket. */
export function ticketPassesGate(row: TicketGateRow | null | undefined, now: Date = new Date()): boolean {
  if (!row) return false;
  if (row.gdpr_consent === true) return true;
  return presentationTicketIsValid(row, now);
}
