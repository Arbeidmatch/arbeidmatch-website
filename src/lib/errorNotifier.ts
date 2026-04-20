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

function serializeUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  return String(error);
}

function extractUnknownStack(error: unknown): string {
  if (error instanceof Error) return error.stack || "No stack trace";
  if (error && typeof error === "object") {
    try {
      const text = JSON.stringify(error, null, 2);
      return text || "No stack trace";
    } catch {
      return "No stack trace";
    }
  }
  return "No stack trace";
}

export async function notifyError({ route, error, context = {} }: ErrorNotificationParams): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[DEV ERROR] ${route}:`, error, context);
    return;
  }

  const errorMessage = serializeUnknownError(error);
  const errorStack = extractUnknownStack(error);
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
