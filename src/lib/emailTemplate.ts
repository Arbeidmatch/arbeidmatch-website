/**
 * Standard label/value row for transactional emails (inline styles for client compatibility).
 * FIELD ROW: border-bottom, padding-bottom 12px, margin-bottom 12px
 * FIELD LABEL: 11px uppercase tracking
 * FIELD VALUE: 14px medium white
 */
export function buildEmailFieldRow(label: string, valueHtml: string): string {
  return `<div style="border-bottom:1px solid rgba(201,168,76,0.06);padding-bottom:12px;margin-bottom:12px;">
    <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:3px;">${label}</div>
    <div style="font-size:14px;font-weight:500;color:#ffffff;margin-bottom:16px;">${valueHtml}</div>
  </div>`;
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
  const ctaHtml =
    ctaText && ctaUrl
      ? `<a href="${ctaUrl}" style="display:block;margin:24px auto 0;max-width:180px;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:13px;padding:12px 28px;border-radius:8px;text-decoration:none;text-align:center;">${ctaText}</a>`
      : "";
  const footerNoteHtml = footerNote
    ? `<div style="color:rgba(255,255,255,0.2);font-size:11px;margin-top:8px;">${footerNote}</div>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0D1B2A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#0D1B2A;">
      <div style="background:#0D1B2A;padding:24px 40px 0;">
        <div style="font-size:18px;font-weight:700;line-height:1.2;">
          <span style="color:#ffffff;">Arbeid</span><span style="color:#C9A84C;">Match</span>
        </div>
        <div style="width:32px;height:2px;background:#C9A84C;margin-top:6px;margin-bottom:24px;"></div>
      </div>
      <div style="background:#111e2e;border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:32px;">
        <div style="color:#ffffff;font-size:22px;font-weight:700;margin-bottom:6px;">${title}</div>
        ${
          preheader
            ? `<div style="color:#C9A84C;font-size:13px;margin-bottom:28px;">${preheader}</div>`
            : ""
        }
        <div style="color:#ffffff;font-size:14px;line-height:1.8;">${body}</div>
        ${ctaHtml}
      </div>
      <div style="background:#0D1B2A;padding:16px 32px;border-top:1px solid rgba(201,168,76,0.1);margin-top:20px;">
        <div style="color:rgba(255,255,255,0.35);font-size:11px;line-height:1.7;">
          <div>ArbeidMatch Norge AS | Org.nr 935 667 089 MVA</div>
          <div>Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</div>
          <div>post@arbeidmatch.no | arbeidmatch.no</div>
          ${footerNoteHtml}
        </div>
      </div>
    </div>
  </body>
</html>`;
}
