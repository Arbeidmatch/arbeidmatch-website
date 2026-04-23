import { escapeHtml } from "@/lib/htmlSanitizer";

/** Label + value as two stacked <p> tags only (no wrapper). */
export function buildEmailFieldRow(label: string, valueHtml: string): string {
  return `<div style="margin:16px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
  <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);">${label}</p>
  <p style="margin:0;font-size:16px;font-weight:500;color:#ffffff;">${valueHtml}</p>
</div>`;
}

/** Label/value rows for `buildEmail` bodies; labels and values are HTML-escaped. */
export function emailFieldRows(rows: { label: string; value: string }[]): string {
  return rows.map((r) => buildEmailFieldRow(escapeHtml(r.label), escapeHtml(r.value))).join("");
}

/** Paragraph for dark `buildEmail` bodies. */
export function emailBodyParagraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#ffffff;">${text}</p>`;
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
  footerNoteHtml?: string;
  unsubscribeToken?: string;
  unsubscribeEmail?: string;
}): string {
  const { title, preheader, body, ctaText, ctaUrl, footerNote, footerNoteHtml, unsubscribeToken, unsubscribeEmail } = options;
  const safeTitle = escapeHtml(title);
  const preheaderBlock = preheader
    ? `<p style="margin:0 0 24px 0;font-size:13px;color:#C9A84C;">${escapeHtml(preheader)}</p>`
    : '<div style="margin-bottom:24px;"></div>';

  const ctaBlock =
    ctaText && ctaUrl
      ? `
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;text-decoration:none;">${escapeHtml(ctaText)}</a>
    </div>`
      : "";

  const footerNoteBlock = footerNoteHtml
    ? `<p style="margin:8px 0 0 0;font-size:11px;color:rgba(255,255,255,0.2);">${footerNoteHtml}</p>`
    : footerNote
      ? `<p style="margin:8px 0 0 0;font-size:11px;color:rgba(255,255,255,0.2);">${escapeHtml(footerNote)}</p>`
      : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#0D1B2A;padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
      <span style="font-size:28px;font-weight:700;color:#C9A84C;">ArbeidMatch</span>
    </div>

    <div style="background:#0f1f30;padding:32px;color:#ffffff;line-height:1.6;">
      <p style="margin:0;font-size:24px;font-weight:700;line-height:1.25;color:#ffffff;">${safeTitle}</p>
      ${preheaderBlock}
      <div style="padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
        ${body}
      </div>
      ${ctaBlock}
    </div>

    <!--AM_FOOTER_START-->
    <div style="background:#0D1B2A;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;">
        ArbeidMatch Norge AS<br>
        Org.nr: 935 667 089 MVA<br>
        Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway<br>
        post@arbeidmatch.no · arbeidmatch.no
      </p>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
        <a href="https://arbeidmatch.no/unsubscribed?email=${encodeURIComponent(
          (unsubscribeEmail || "[email_destinatar]").trim() || "[email_destinatar]",
        )}" style="font-size:11px;color:rgba(255,255,255,0.4);text-decoration:underline;">
          Unsubscribe from these emails
        </a>
      </div>
      <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.3);text-align:center;">
        This email was sent by ArbeidMatch Norge AS. We process your data in accordance with GDPR. You have the right to access,
        correct, or delete your personal data at any time. Contact us at post@arbeidmatch.no for data requests.
      </p>
      ${unsubscribeToken ? `<p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.35);">Legacy unsubscribe token: ${escapeHtml(unsubscribeToken)}</p>` : ""}
      ${footerNoteBlock}
    </div>
  </div>
</body>
</html>`;
}

export function addFollowUpFooter(emailHtml: string, followUpText: string): string {
  const banner = `<div style="background:rgba(201,168,76,0.08);border-top:1px solid rgba(201,168,76,0.15);padding:16px 32px;text-align:center;color:rgba(255,255,255,0.6);font-size:13px;">${escapeHtml(
    followUpText,
  )}</div>`;
  return emailHtml.replace("<!--AM_FOOTER_START-->", `${banner}\n<!--AM_FOOTER_START-->`);
}
