import { escapeHtml } from "@/lib/htmlSanitizer";
import { applyRecipientEmailPlaceholders, UNSUBSCRIBED_PAGE_EMAIL_HREF } from "@/lib/websiteEmailTemplates";

/** Label + value as two stacked <p> tags only (no wrapper). */
export function buildEmailFieldRow(label: string, valueHtml: string): string {
  return `<p style="margin:0 0 3px 0;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);">${label}</p>
<p style="margin:0 0 16px 0;font-size:14px;font-weight:500;color:#ffffff;">${valueHtml}</p>`;
}

/** Label/value rows for `buildEmail` bodies; labels and values are HTML-escaped. */
export function emailFieldRows(rows: { label: string; value: string }[]): string {
  return rows.map((r) => buildEmailFieldRow(escapeHtml(r.label), escapeHtml(r.value))).join("");
}

/** Paragraph for dark `buildEmail` bodies. */
export function emailBodyParagraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:rgba(255,255,255,0.8);">${text}</p>`;
}

export function emailBodySupportHint(): string {
  return `<p style="margin:16px 0 0;line-height:1.65;font-size:13px;color:rgba(255,255,255,0.55);">${escapeHtml(
    "If the button does not work, reply to this email and we will help you on business days.",
  )}</p>`;
}

export function buildEmail(options: {
  title: string;
  preheader?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  footerNote?: string;
  unsubscribeToken?: string;
  /** When set, footer includes notification settings link and placeholders are replaced. */
  recipientEmail?: string;
}): string {
  const { title, preheader, body, ctaText, ctaUrl, footerNote, unsubscribeToken, recipientEmail } = options;
  const safeTitle = escapeHtml(title);
  const preheaderBlock = preheader
    ? `<p style="margin:0 0 24px 0;font-size:13px;color:#C9A84C;">${escapeHtml(preheader)}</p>`
    : '<div style="margin-bottom:24px;"></div>';

  const ctaBlock =
    ctaText && ctaUrl
      ? `
    <div style="margin-top:28px;text-align:center;">
      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;">${escapeHtml(ctaText)}</a>
    </div>`
      : "";

  const footerNoteBlock = footerNote
    ? `<p style="margin:8px 0 0 0;font-size:11px;color:rgba(255,255,255,0.2);">${escapeHtml(footerNote)}</p>`
    : "";

  const recipientTrimmed = recipientEmail?.trim() ?? "";
  const footerLinks: string[] = [];
  if (unsubscribeToken) {
    footerLinks.push(
      `<a href="https://arbeidmatch.no/api/unsubscribe?token=${escapeHtml(unsubscribeToken)}" style="color:rgba(255,255,255,0.2);text-decoration:none;">unsubscribe</a>`,
    );
  }
  if (recipientTrimmed) {
    footerLinks.push(
      `<a href="${UNSUBSCRIBED_PAGE_EMAIL_HREF}" style="color:rgba(255,255,255,0.2);text-decoration:none;">notification settings</a>`,
    );
  }
  const footerLinkBlock = footerLinks.length ? ` | ${footerLinks.join(" | ")}` : "";

  let html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0D1B2A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">

  <!-- Single outer container -->
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">

    <!-- Logo -->
    <div style="margin-bottom:24px;">
      <span style="font-size:18px;font-weight:700;color:#ffffff;">Arbeid</span><span style="font-size:18px;font-weight:700;color:#C9A84C;">Match</span>
      <div style="width:32px;height:2px;background:#C9A84C;margin-top:6px;"></div>
    </div>

    <!-- Title -->
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:700;color:#ffffff;">${safeTitle}</p>
    
    <!-- Preheader if provided -->
    ${preheaderBlock}

    <!-- Divider -->
    <div style="height:1px;background:rgba(201,168,76,0.15);margin-bottom:24px;"></div>

    <!-- Body content injected directly — NO wrapper -->
    ${body}

    <!-- CTA if provided -->
    ${ctaBlock}

    <!-- Divider -->
    <div style="height:1px;background:rgba(201,168,76,0.08);margin-top:32px;margin-bottom:20px;"></div>

    <!-- Footer -->
    <p style="margin:0 0 4px 0;font-size:11px;color:rgba(255,255,255,0.35);">ArbeidMatch Norge AS | Org.nr 935 667 089 MVA</p>
    <p style="margin:0 0 4px 0;font-size:11px;color:rgba(255,255,255,0.35);">Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
    <p style="margin:0 0 4px 0;font-size:11px;color:rgba(255,255,255,0.35);">support@arbeidmatch.no | arbeidmatch.no${footerLinkBlock}</p>
    ${footerNoteBlock}

  </div>
</body>
</html>`;

  if (recipientTrimmed) {
    html = applyRecipientEmailPlaceholders(html, recipientTrimmed);
  }
  return html;
}
