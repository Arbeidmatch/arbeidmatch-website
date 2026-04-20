import { escapeHtml } from "@/lib/htmlSanitizer";

/**
 * Standard label/value row for transactional emails (inline styles for client compatibility).
 * Single block: label + value as stacked <p> tags (no div-inside-div for text).
 */
export function buildEmailFieldRow(label: string, valueHtml: string): string {
  return `<div style="border-bottom:1px solid rgba(201,168,76,0.06);padding-bottom:12px;margin-bottom:12px;">
  <p style="margin:0 0 3px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);">${label}</p>
  <p style="margin:0;font-size:14px;font-weight:500;color:#ffffff;line-height:1.5;">${valueHtml}</p>
</div>`;
}

/** Label/value rows for dark `buildEmail` bodies; labels and values are HTML-escaped. */
export function emailFieldRows(rows: { label: string; value: string }[]): string {
  return rows.map((r) => buildEmailFieldRow(escapeHtml(r.label), escapeHtml(r.value))).join("");
}

/** Paragraph for dark-card transactional emails (replaces premium `emailParagraph` which uses dark text). */
export function emailBodyParagraph(html: string): string {
  return `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">${html}</p>`;
}

export function emailBodySupportHint(): string {
  return `<p style="margin:20px 0 0;line-height:1.65;font-size:13px;color:rgba(255,255,255,0.55);">${escapeHtml(
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
}): string {
  const { title, preheader, body, ctaText, ctaUrl, footerNote } = options;
  const safeTitle = escapeHtml(title);
  const safePreheader = preheader ? escapeHtml(preheader) : "";
  const safeFooterNote = footerNote ? escapeHtml(footerNote) : "";

  const ctaHtml =
    ctaText && ctaUrl
      ? `<p style="margin:24px 0 0;text-align:center;"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;">${escapeHtml(
          ctaText,
        )}</a></p>`
      : "";
  const footerNoteHtml = safeFooterNote
    ? `<p style="margin:8px 0 0;color:rgba(255,255,255,0.2);font-size:11px;line-height:1.5;">${safeFooterNote}</p>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0D1B2A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;">
      <div style="padding:24px 40px 0;">
        <p style="margin:0;font-size:18px;font-weight:700;line-height:1.2;">
          <span style="color:#ffffff;">Arbeid</span><span style="color:#C9A84C;">Match</span>
        </p>
        <div style="width:32px;height:2px;background:#C9A84C;margin-top:6px;margin-bottom:24px;"></div>
      </div>
      <div style="background:#111e2e;border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:32px;font-size:14px;line-height:1.8;color:rgba(255,255,255,0.92);">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#ffffff;">${safeTitle}</p>
        ${safePreheader ? `<p style="margin:0 0 28px;font-size:13px;color:#C9A84C;">${safePreheader}</p>` : ""}
        ${body}
        ${ctaHtml}
      </div>
      <div style="padding:16px 32px;border-top:1px solid rgba(201,168,76,0.1);margin-top:20px;">
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.7;">ArbeidMatch Norge AS | Org.nr 935 667 089 MVA</p>
        <p style="margin:0 0 4px;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.7;">Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
        <p style="margin:0;color:rgba(255,255,255,0.35);font-size:11px;line-height:1.7;">post@arbeidmatch.no | arbeidmatch.no</p>
        ${footerNoteHtml}
      </div>
    </div>
  </body>
</html>`;
}
