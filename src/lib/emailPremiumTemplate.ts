import { escapeHtml } from "@/lib/htmlSanitizer";
import { buildB2BFooter, buildB2CFooter, type EmailAudience } from "@/lib/emailTemplate";

/** From header (must match SMTP auth mailbox for one.com / similar providers). */
export const EMAIL_FROM = '"ArbeidMatch Norge AS" <no-replay@arbeidmatch.no>';
export const EMAIL_REPLY_TO = "support@arbeidmatch.no";

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

export function wrapPremiumEmail(
  bodyHtml: string,
  options?: { audience?: EmailAudience; unsubscribeEmail?: string; footerNoteHtml?: string },
): string {
  const audience = options?.audience || "b2b";
  const footerHtml =
    audience === "b2c"
      ? buildB2CFooter({ unsubscribeEmail: options?.unsubscribeEmail, footerNoteBlock: options?.footerNoteHtml })
      : buildB2BFooter({ unsubscribeEmail: options?.unsubscribeEmail, footerNoteBlock: options?.footerNoteHtml });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
</head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#0D1B2A;padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
      <span style="font-size:28px;font-weight:700;color:#C9A84C;">ArbeidMatch</span>
    </div>
    <div style="background:#0f1f30;padding:32px;color:#ffffff;line-height:1.6;">
      <div style="padding-top:2px;border-top:1px solid rgba(255,255,255,0.08);">
        ${bodyHtml}
      </div>
    </div>
    <!--AM_FOOTER_START-->
    ${footerHtml}
  </div>
</body>
</html>`;
}

export function withRecipientUnsubscribeLink(emailHtml: string, recipientEmail?: string | null): string {
  const safeEmail = encodeURIComponent((recipientEmail || "[email_destinatar]").trim() || "[email_destinatar]");
  return emailHtml.replaceAll("https://arbeidmatch.no/unsubscribed?email=%5Bemail_destinatar%5D", `https://arbeidmatch.no/unsubscribed?email=${safeEmail}`);
}

export function addFollowUpFooter(emailHtml: string, followUpText: string): string {
  const banner = `<div style="background:rgba(201,168,76,0.08);border-top:1px solid rgba(201,168,76,0.15);padding:16px 32px;text-align:center;color:rgba(255,255,255,0.6);font-size:13px;">
${escapeHtml(followUpText)}
</div>`;
  return emailHtml.replace("<!--AM_FOOTER_START-->", `${banner}\n<!--AM_FOOTER_START-->`);
}

export function premiumCtaButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<a href="${safeHref}"
   style="display:inline-block;background:#C9A84C;
          color:#0D1B2A;text-decoration:none;font-size:15px;font-weight:700;
          padding:14px 28px;border-radius:8px;">
  ${safeLabel}
</a>`;
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;line-height:1.7;color:#ffffff;font-size:15px;">${html}</p>`;
}

/** Short CTA fallback - support address lives in the shared footer only. */
export function emailSupportAfterCta(): string {
  return `<p style="margin:20px 0 0;line-height:1.65;color:rgba(255,255,255,0.65);font-size:13px;">${escapeHtml(
    "If the button does not work, reply to this email and we will help you on business days.",
  )}</p>`;
}

export function emailDataTable(rows: { label: string; value: string }[]): string {
  const cells = rows
    .map(
      (r) => `<div style="margin:16px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);">${escapeHtml(r.label)}</p>
      <p style="margin:0;font-size:16px;color:#ffffff;">${escapeHtml(r.value)}</p>
    </div>`,
    )
    .join("");
  return `<div style="margin:0 0 8px;">${cells}</div>`;
}

export function emailNoteBox(html: string): string {
  return `<div style="margin:20px 0;padding:16px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);">
    <div style="font-size:14px;line-height:1.7;color:#ffffff;">${html}</div>
  </div>`;
}

export function emailCtaSection(titleHtml: string, buttonHtml: string): string {
  return `<div style="margin:24px 0;padding:20px 22px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);text-align:center;">
    <div style="font-size:15px;font-weight:700;color:#ffffff;margin-bottom:14px;line-height:1.5;">${titleHtml}</div>
    ${buttonHtml}
  </div>`;
}

export function inDevelopmentBadgeStatic(): string {
  return `<div style="display:inline-block;margin:12px 0;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.2);background:rgba(201,168,76,0.2);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C9A84C;">
    In Development
  </div>`;
}

/** Internal / ops notifications: plain layout, monospace values. */
export function buildInternalEmailHtml(opts: { title: string; rows: { label: string; value: string }[] }): string {
  const ts = formatEmailTimestampCet();
  const rowsHtml = opts.rows
    .map(
      (r) => `<div style="margin:16px 0 0;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.5);">${escapeHtml(r.label)}</p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#ffffff;word-break:break-word;">${escapeHtml(r.value)}</p>
    </div>`,
    )
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a1628;font-family:Arial,sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#0D1B2A;padding:32px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1);">
      <span style="font-size:28px;font-weight:700;color:#C9A84C;">ArbeidMatch</span>
    </div>
    <div style="background:#0f1f30;padding:32px;color:#ffffff;line-height:1.6;">
      <h1 style="font-size:22px;margin:0 0 8px;font-weight:800;color:#ffffff;">${escapeHtml(opts.title)}</h1>
      <p style="margin:0 0 16px;font-size:12px;color:rgba(255,255,255,0.7);">${escapeHtml(ts)}</p>
      <div style="padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">
        ${rowsHtml}
      </div>
    </div>
    <div style="background:#0D1B2A;padding:24px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);">
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">ArbeidMatch Norge AS · Sverre Svendsens veg 38, 7056 Ranheim · post@arbeidmatch.no · arbeidmatch.no</p>
    </div>
  </div>
</body></html>`;
}

function emailPremiumTemplate(title: string, bodyHtml: string, preheader?: string): string {
  const preheaderBlock = preheader
    ? `<p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.7);">${escapeHtml(preheader)}</p>`
    : "";
  return wrapPremiumEmail(`
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#ffffff;">${escapeHtml(title)}</h1>
    ${preheaderBlock}
    ${bodyHtml}
  `);
}

type RoleAlertEmailOptions = {
  role: string;
  count: number;
  alertId: string;
  ctaUrl: string;
  manageUrl: string;
};

export function buildRoleAlertNotificationEmail(
  roleName: string,
  candidatesCount: number,
  viewLink: string,
): string;
export function buildRoleAlertNotificationEmail(opts: RoleAlertEmailOptions): string;
export function buildRoleAlertNotificationEmail(
  arg1: string | RoleAlertEmailOptions,
  arg2?: number,
  arg3?: string,
): string {
  if (typeof arg1 === "string") {
    const roleName = arg1;
    const candidatesCount = Number.isFinite(arg2) ? Number(arg2) : 0;
    const viewLink = typeof arg3 === "string" ? arg3 : "#";
    return emailPremiumTemplate(
      "New candidates available for " + roleName,
      `
    <p style="color: white; margin-bottom: 20px;">
      We found <strong>${candidatesCount}</strong> qualified candidates for <strong>${escapeHtml(roleName)}</strong>.
    </p>
    <a href="${escapeHtml(viewLink)}" style="display: inline-block; background-color: #C9A84C; color: #0D1B2A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
      View Candidates
    </a>
    `,
      "View your role alert notifications",
    );
  }

  const opts = arg1;
  return emailPremiumTemplate(
    "New candidates available for " + opts.role,
    `
    <p style="color: white; margin-bottom: 20px;">
      We found <strong>${Math.max(0, Math.trunc(opts.count))}</strong> qualified candidates for <strong>${escapeHtml(opts.role)}</strong>.
    </p>
    <a href="${escapeHtml(opts.ctaUrl)}" style="display: inline-block; background-color: #C9A84C; color: #0D1B2A; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0;">
      View Candidates
    </a>
    <p style="margin-top:14px;color:rgba(255,255,255,0.55);font-size:12px;">
      Alert ID: ${escapeHtml(opts.alertId)} · <a href="${escapeHtml(opts.manageUrl)}" style="color:rgba(255,255,255,0.75);text-decoration:underline;">Manage preferences</a>
    </p>
    `,
    "View your role alert notifications",
  );
}
