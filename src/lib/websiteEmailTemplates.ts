/** Placeholder replaced with encodeURIComponent(recipient) before sendMail. */
export const RECIPIENT_EMAIL_PLACEHOLDER = "{{RECIPIENT_EMAIL}}";

const LEGACY_UNSUBSCRIBE_URL_ENCODED_BRACKETS =
  "https://arbeidmatch.no/unsubscribed?email=%5Bemail_destinatar%5D";

const LEGACY_UNSUBSCRIBE_URL_PLAIN_BRACKETS =
  "https://arbeidmatch.no/unsubscribed?email=[email_destinatar]";

/** Standard href for templates; replace {{RECIPIENT_EMAIL}} at send time. */
export const UNSUBSCRIBED_PAGE_EMAIL_HREF = `https://arbeidmatch.no/unsubscribed?email=${RECIPIENT_EMAIL_PLACEHOLDER}`;

/**
 * Replaces {{RECIPIENT_EMAIL}} and legacy broken unsubscribe URLs with the
 * encoded recipient address (safe for query strings).
 */
export function applyRecipientEmailPlaceholders(html: string, recipientEmail: string): string {
  const trimmed = recipientEmail.trim();
  const encoded = encodeURIComponent(trimmed);
  return html
    .split(RECIPIENT_EMAIL_PLACEHOLDER)
    .join(encoded)
    .split(LEGACY_UNSUBSCRIBE_URL_ENCODED_BRACKETS)
    .join(`https://arbeidmatch.no/unsubscribed?email=${encoded}`)
    .split(LEGACY_UNSUBSCRIBE_URL_PLAIN_BRACKETS)
    .join(`https://arbeidmatch.no/unsubscribed?email=${encoded}`);
}
