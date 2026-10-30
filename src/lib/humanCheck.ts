/**
 * Our own check that a person filled a form in, with nothing leaving our servers.
 *
 * ORDER 187 (30 October 2026): no outside human check (an outside captcha service saw
 * every visitor's address and browser). Three free layers instead: a hidden field
 * a person cannot fill (the routes read it through hasHoneypotValue), how long
 * the form was open, and a rate limit per address and per e-mail. A refusal here
 * is answered as if it had worked, so a robot learns nothing.
 */

/** The form's render time (ms since epoch) sent with the submit. */
export const FORM_RENDERED_AT_FIELD = "formRenderedAt";

/** Under this, nobody typed it. */
export const MIN_FILL_MS = 3_000;

/**
 * True when the form was filled in faster than a person can. A missing or
 * unreadable stamp is not a refusal: a browser that stripped it is as likely as
 * a script that never had it, and the other two layers still apply.
 */
export function filledTooFast(fields: Record<string, unknown>, now: number = Date.now()): boolean {
  const raw = fields[FORM_RENDERED_AT_FIELD];
  const renderedAt = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(renderedAt) || renderedAt <= 0) return false;
  return now - renderedAt < MIN_FILL_MS;
}
