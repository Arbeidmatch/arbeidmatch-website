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

export async function sendEmployerJobDraftReadyEmail(input: { to: string; jobId: string; editToken: string; title: string }) {
  const transport = createSmtpTransporter();
  if (!transport) {
    logApiError("employerJobEmails draft", new Error("SMTP not configured"), {});
    return;
  }

  const origin = getSiteOrigin();
  const link = `${origin}/jobs/edit/${input.jobId}?token=${input.editToken}`;

  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Your job post is ready to review</h1>
    <p style="margin:0 0 16px;line-height:1.5;color:rgba(232,238,245,0.85);">
      We generated a professional draft for <strong style="color:#fff;">${escapeHtml(input.title)}</strong>.
      Review it once within 7 days. After you save, the post goes live on the job board.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:linear-gradient(135deg,#C9A84C,#b8953f);color:#0D1B2A;font-weight:700;text-decoration:none;">
        Review and publish
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:rgba(232,238,245,0.55);">
      Link expires in 7 days and works for a single publish action.
    </p>
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject: "Your ArbeidMatch job post is ready to review",
    html: wrapHtml(inner),
  });
}

export async function sendEmployerNewCandidateEmail(input: {
  to: string;
  applicationId: string;
  token: string;
  jobTitle: string;
}) {
  const transport = createSmtpTransporter();
  if (!transport) {
    logApiError("employerJobEmails new candidate", new Error("SMTP not configured"), {});
    return;
  }

  const origin = getSiteOrigin();
  const link = `${origin}/employer/candidates/${input.applicationId}?token=${input.token}`;

  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">New candidate applied</h1>
    <p style="margin:0 0 16px;line-height:1.5;color:rgba(232,238,245,0.85);">
      Someone applied to <strong style="color:#fff;">${escapeHtml(input.jobTitle)}</strong>.
      Open the anonymized review first, then unlock contact if you proceed.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:linear-gradient(135deg,#C9A84C,#b8953f);color:#0D1B2A;font-weight:700;text-decoration:none;">
        Review candidate
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:rgba(232,238,245,0.55);">
      Secure link expires in 7 days.
    </p>
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject: "New candidate application on ArbeidMatch",
    html: wrapHtml(inner),
  });
}

export async function sendCandidateApplicationReceivedEmail(input: { to: string; jobTitle: string }) {
  const transport = createSmtpTransporter();
  if (!transport) return;

  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Application received</h1>
    <p style="margin:0;line-height:1.5;color:rgba(232,238,245,0.85);">
      Thank you. Your application for <strong style="color:#fff;">${escapeHtml(input.jobTitle)}</strong> is with the employer for review.
    </p>
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject: "We received your ArbeidMatch application",
    html: wrapHtml(inner),
  });
}

export async function sendCandidateAcceptedEmail(input: { to: string; jobTitle: string; mode: "interview" | "hire" }) {
  const transport = createSmtpTransporter();
  if (!transport) return;

  const label = input.mode === "hire" ? "accepted for hire" : "accepted for interview";
  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Great news</h1>
    <p style="margin:0;line-height:1.5;color:rgba(232,238,245,0.85);">
      The employer has <strong style="color:#fff;">${label}</strong> for <strong style="color:#fff;">${escapeHtml(input.jobTitle)}</strong>.
      They can now reach you with the details you shared for hiring contact.
    </p>
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject:
      input.mode === "hire" ? "You were accepted for hire on ArbeidMatch" : "You were accepted for interview on ArbeidMatch",
    html: wrapHtml(inner),
  });
}

export async function sendCandidateRejectionFeedbackEmail(input: { to: string; jobTitle: string; reason: string; details: string }) {
  const transport = createSmtpTransporter();
  if (!transport) return;

  const inner = `
    <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#C9A84C;">ArbeidMatch</p>
    <h1 style="margin:0 0 12px;font-size:22px;color:#fff;">Application update</h1>
    <p style="margin:0 0 12px;line-height:1.5;color:rgba(232,238,245,0.85);">
      Regarding <strong style="color:#fff;">${escapeHtml(input.jobTitle)}</strong>, the employer shared structured feedback.
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#C9A84C;">Reason: ${escapeHtml(input.reason)}</p>
    <p style="margin:0;line-height:1.5;color:rgba(232,238,245,0.85);">${escapeHtml(input.details)}</p>
  `;

  await transport.sendMail({
    from: PROFILE_TRANSACTIONAL_FROM,
    to: input.to,
    subject: "Feedback on your ArbeidMatch application",
    html: wrapHtml(inner),
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
