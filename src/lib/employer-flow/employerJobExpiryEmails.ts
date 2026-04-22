import { createSmtpTransporter, PROFILE_TRANSACTIONAL_FROM } from "@/lib/candidates/smtpShared";
import { getSiteOrigin } from "@/lib/candidates/siteOrigin";
import { logApiError } from "@/lib/secureLogger";

function wrapHtml(inner: string): string {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0D1B2A;color:#e8eef5;font-family:Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0D1B2A;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid rgba(201,168,76,0.2);border-radius:16px;background:rgba(255,255,255,0.03);padding:24px;">
        <tr><td>${inner}</td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renewBlock(jobId: string, renewToken: string | null): string {
  if (!renewToken) {
    return `<p style="margin:0;font-size:12px;color:rgba(232,238,245,0.55);">Contact support if you need a renewal link.</p>`;
  }
  const origin = getSiteOrigin();
  const href = `${origin}/api/employer/board-job/${jobId}/renew?renewToken=${encodeURIComponent(renewToken)}`;
  return `<p style="margin:0 0 20px;">
      <a href="${href}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:linear-gradient(135deg,#C9A84C,#b8953f);color:#0D1B2A;font-weight:700;text-decoration:none;">
        Renew for another 30 days
      </a>
    </p>`;
}

export async function sendEmployerJobExpiryReminderEmail(input: {
  to: string;
  jobId: string;
  title: string;
  renewToken: string | null;
  variant: "7d" | "3d" | "1d";
}) {
  const transport = createSmtpTransporter();
  if (!transport) {
    logApiError("employerJobExpiryEmails reminder", new Error("SMTP not configured"), {});
    return;
  }

  const title = escapeHtml(input.title);
  const headline =
    input.variant === "7d"
      ? "Your job post expires in 7 days"
      : input.variant === "3d"
        ? "Your job post expires in 3 days"
        : "Your job post expires tomorrow";

  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">${headline}</h1>
    <p style="margin:0 0 16px;line-height:1.5;color:rgba(232,238,245,0.85);">
      Listing <strong style="color:#fff;">${title}</strong> will leave the public board when the 30-day window ends.
    </p>
    ${renewBlock(input.jobId, input.renewToken)}
    <p style="margin:0;font-size:12px;color:rgba(232,238,245,0.55);">If you already renewed, you can ignore this message.</p>
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject: headline,
    html: wrapHtml(inner),
  });
}

export async function sendEmployerJobExpiredEmail(input: { to: string; jobId: string; title: string; renewToken: string | null }) {
  const transport = createSmtpTransporter();
  if (!transport) {
    logApiError("employerJobExpiryEmails expired", new Error("SMTP not configured"), {});
    return;
  }

  const title = escapeHtml(input.title);
  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Your job post has expired today</h1>
    <p style="margin:0 0 16px;line-height:1.5;color:rgba(232,238,245,0.85);">
      <strong style="color:#fff;">${title}</strong> is no longer visible on the job board. You can still renew to go live again.
    </p>
    ${renewBlock(input.jobId, input.renewToken)}
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject: "Your job post has expired today",
    html: wrapHtml(inner),
  });
}
