import nodemailer from "nodemailer";

function createTransporter() {
  const pass = process.env.SMTP_PASS;
  if (!pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "send.one.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || "no-replay@arbeidmatch.no",
      pass,
    },
  });
}

export interface ErrorNotificationParams {
  route: string;
  error: unknown;
  context?: Record<string, unknown>;
}

export async function notifyError({ route, error, context = {} }: ErrorNotificationParams): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[DEV ERROR] ${route}:`, error, context);
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack || "No stack trace" : "No stack trace";
  const timestamp = new Date().toISOString();

  const contextLines = Object.entries(context)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

  const emailBody = `
ArbeidMatch - Error Notification
==================================

Time: ${timestamp}
Route: ${route}
Environment: Production

ERROR:
${errorMessage}

STACK TRACE:
${errorStack}

CONTEXT:
${contextLines || "No additional context"}

==================================
This is an automated error notification from arbeidmatch.no
  `.trim();

  const fromAddr = process.env.SMTP_USER || "no-replay@arbeidmatch.no";
  const subjectSnippet = errorMessage.slice(0, 60).replace(/\s+/g, " ").trim() || "Error";

  try {
    const transporter = createTransporter();
    if (!transporter) {
      console.error("[errorNotifier] SMTP_PASS or transporter missing; cannot send alert.");
      return;
    }

    await transporter.sendMail({
      from: fromAddr,
      to: "post@arbeidmatch.no",
      subject: `[ERROR] ${route} - ${subjectSnippet}`,
      text: emailBody,
    });
  } catch (notifyErr) {
    console.error("Failed to send error notification:", notifyErr);
  }
}
