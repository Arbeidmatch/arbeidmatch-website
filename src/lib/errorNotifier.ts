import nodemailer from "nodemailer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

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
  fixApplied?: string;
  fixCommit?: string;
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

export async function notifyError({
  route,
  error,
  context = {},
  fixApplied,
  fixCommit,
}: ErrorNotificationParams): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[DEV ERROR] ${route}:`, error, context);
    return;
  }

  const errorMessage = serializeUnknownError(error);
  const errorStack = extractUnknownStack(error);
  const timestamp = new Date().toISOString();
  const status = fixApplied ? "fixed" : "open";
  const resolvedAt = fixApplied ? timestamp : null;

  const contextLines = Object.entries(context)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");

  try {
    const supabase = getSupabaseServiceClient();
    if (supabase) {
      const { error: insertError } = await supabase.from("error_log").insert({
        route,
        error_message: errorMessage,
        error_stack: errorStack,
        context,
        fix_applied: fixApplied ?? null,
        fix_commit: fixCommit ?? null,
        status,
        resolved_at: resolvedAt,
        environment: process.env.NODE_ENV || "unknown",
      });
      if (insertError) {
        console.error("[errorNotifier] Failed to insert error_log row:", insertError);
      }
    } else {
      console.error("[errorNotifier] Supabase client missing; cannot persist error_log row.");
    }
  } catch (persistErr) {
    console.error("[errorNotifier] Unexpected error while persisting error_log:", persistErr);
  }

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
      await createGitHubIssue({ route, errorMessage, errorStack, context });
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

  await createGitHubIssue({ route, errorMessage, errorStack, context });
}

async function createGitHubIssue({
  route,
  errorMessage,
  errorStack,
  context,
}: {
  route: string;
  errorMessage: string;
  errorStack: string;
  context: Record<string, unknown>;
}): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO || "Arbeidmatch/arbeidmatch-website";

  if (!token) return null;

  const body = `## Auto-detected error

**Route:** ${route}
**Time:** ${new Date().toISOString()}
**Environment:** Production

## Error message
\`\`\`
${errorMessage}
\`\`\`

## Stack trace
\`\`\`
${errorStack}
\`\`\`

## Context
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

---
_This issue was created automatically by errorNotifier.ts_
_Label: auto-fix-pending_`;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        title: `[AUTO] ${route}: ${errorMessage.slice(0, 80)}`,
        body,
        labels: ["auto-fix-pending"],
      }),
    });
    const data = (await res.json()) as { number?: number };
    return data.number ? String(data.number) : null;
  } catch {
    return null;
  }
}

export async function markErrorFixed(route: string, fixApplied: string, fixCommit?: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      console.error("[errorNotifier] Supabase client missing; cannot mark error as fixed.");
      return;
    }

    const { error } = await supabase
      .from("error_log")
      .update({
        status: "fixed",
        resolved_at: new Date().toISOString(),
        fix_applied: fixApplied,
        fix_commit: fixCommit ?? null,
      })
      .eq("route", route)
      .eq("status", "open");

    if (error) {
      console.error("[errorNotifier] Failed to update fixed error_log rows:", error);
    }
  } catch (updateErr) {
    console.error("[errorNotifier] Unexpected error while marking error fixed:", updateErr);
  }
}
