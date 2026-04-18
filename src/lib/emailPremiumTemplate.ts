import { escapeHtml } from "@/lib/htmlSanitizer";

/** Display From (transactional mail; SMTP auth may still use no-replay@). */
export const EMAIL_FROM = '"ArbeidMatch Norge AS" <post@arbeidmatch.no>';
export const EMAIL_REPLY_TO = "support@arbeidmatch.no";

const SUPPORT_LINE =
  "If this button does not work, contact us at support@arbeidmatch.no and we will respond within 24 hours on business days.";

/** Standard nodemailer fields for outbound mail. */
export function mailHeaders() {
  return { from: EMAIL_FROM, replyTo: EMAIL_REPLY_TO } as const;
}

export function formatEmailTimestampCet(date = new Date()): string {
  return (
    date.toLocaleString("en-GB", {
      timeZone: "Europe/Oslo",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " CET"
  );
}

export function wrapPremiumEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:40px 20px;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#B8860B,#C9A84C);padding:32px 40px;text-align:center;">
              <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
                Arbeid<span style="color:rgba(255,255,255,0.7);">Match</span>
              </div>
              <div style="font-size:11px;color:rgba(255,255,255,0.8);letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">
                Norge AS
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;border-top:1px solid #eeeeee;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <div style="font-size:12px;font-weight:600;color:#0D1B2A;margin-bottom:4px;">
                      ArbeidMatch Norge AS
                    </div>
                    <div style="font-size:11px;color:#888888;line-height:1.6;">
                      Org. nr. 935 667 089 (MVA)<br>
                      Sverre Svendsens veg 38, 7056 Ranheim, Norway<br>
                      post@arbeidmatch.no · arbeidmatch.no<br>
                      Support: support@arbeidmatch.no
                    </div>
                    <div style="font-size:10px;color:#aaaaaa;margin-top:12px;line-height:1.5;">
                      This email was sent by ArbeidMatch Norge AS.
                      If you need assistance, contact us at support@arbeidmatch.no and we will
                      respond within 24 hours on business days.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

export function premiumCtaButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeHref}"
   style="display:inline-block;background:linear-gradient(135deg,#B8860B,#C9A84C);
          color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;
          padding:16px 36px;border-radius:10px;letter-spacing:-0.01em;
          box-shadow:0 4px 15px rgba(184,134,11,0.3);">
  ${safeLabel}
</a>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;line-height:1.7;color:#0D1B2A;font-size:15px;">${html}</p>`;
}

export function emailSupportAfterCta(): string {
  return `<p style="margin:20px 0 0;line-height:1.7;color:#555555;font-size:13px;">${escapeHtml(SUPPORT_LINE)}</p>`;
}

export function emailDataTable(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (r) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-size:14px;font-weight:600;color:#0D1B2A;width:38%;vertical-align:top;">${escapeHtml(r.label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-size:14px;line-height:1.6;color:#333333;vertical-align:top;">${escapeHtml(r.value)}</td>
    </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 8px;">${cells}</table>`;
}

export function emailNoteBox(html: string): string {
  return `<div style="margin:20px 0;padding:16px 18px;border-radius:10px;border:1px solid #e8e0c8;background:#fffbf0;">
    <div style="font-size:14px;line-height:1.7;color:#0D1B2A;">${html}</div>
  </div>`;
}

export function emailCtaSection(titleHtml: string, buttonHtml: string): string {
  return `<div style="margin:24px 0;padding:20px 22px;border-radius:12px;border:1px solid rgba(184,134,11,0.25);background:#fffef8;text-align:center;">
    <div style="font-size:15px;font-weight:700;color:#0D1B2A;margin-bottom:14px;line-height:1.5;">${titleHtml}</div>
    ${buttonHtml}
  </div>`;
}

export function inDevelopmentBadgeStatic(): string {
  return `<div style="display:inline-block;margin:12px 0;padding:8px 14px;border-radius:999px;border:1px solid rgba(184,134,11,0.45);background:rgba(184,134,11,0.1);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8a6a12;">
    In Development
  </div>`;
}

/** Internal / ops notifications: plain layout, monospace values. */
export function buildInternalEmailHtml(opts: { title: string; rows: { label: string; value: string }[] }): string {
  const ts = formatEmailTimestampCet();
  const rowsHtml = opts.rows
    .map(
      (r) => `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;font-weight:600;color:#0D1B2A;vertical-align:top;width:200px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;">${escapeHtml(r.label)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e5e5;vertical-align:top;font-family:ui-monospace,Consolas,'Courier New',monospace;font-size:12px;color:#111;word-break:break-all;">${escapeHtml(r.value)}</td>
    </tr>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:20px;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111;">
  <h1 style="font-size:18px;margin:0 0 8px;font-weight:800;color:#0D1B2A;">${escapeHtml(opts.title)}</h1>
  <p style="margin:0 0 16px;font-size:12px;color:#666;">${escapeHtml(ts)}</p>
  <table style="width:100%;max-width:720px;border-collapse:collapse;background:#fff;border:1px solid #e5e5e5;">${rowsHtml}</table>
  <p style="margin:16px 0 0;font-size:11px;color:#888;">ArbeidMatch internal notification · Reply goes to support@arbeidmatch.no</p>
</body></html>`;
}
