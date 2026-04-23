import "server-only";

import { createHash } from "crypto";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Transporter } from "nodemailer";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyEmailFailed } from "@/lib/slack/notify";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

type MailHeaders = Record<string, string>;

type SafeSendOptions = {
  text?: string;
  from?: string;
  replyTo?: string;
  headers?: MailHeaders;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Mail.Attachment[];
  ipAddress?: string;
  transporter?: Transporter<SMTPTransport.SentMessageInfo>;
};

const perIpMinuteWindow = new Map<string, number[]>();
const PER_IP_LIMIT = 10;
const WINDOW_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanIp(ipAddress?: string): string {
  const raw = (ipAddress || "unknown").trim();
  if (!raw) return "unknown";
  if (raw.startsWith("::ffff:")) return raw.slice(7);
  return raw;
}

function checkRateLimit(ipAddress?: string): boolean {
  const key = cleanIp(ipAddress);
  const now = Date.now();
  const entries = (perIpMinuteWindow.get(key) || []).filter((ts) => now - ts < WINDOW_MS);
  if (entries.length >= PER_IP_LIMIT) {
    perIpMinuteWindow.set(key, entries);
    return false;
  }
  entries.push(now);
  perIpMinuteWindow.set(key, entries);
  return true;
}

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

async function isUnsubscribedEmail(email: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  const normalized = email.trim().toLowerCase();
  const { data } = await supabase
    .from("email_subscriptions")
    .select("unsubscribed,subscribed")
    .eq("email", normalized)
    .maybeSingle();
  if (!data) return false;
  const byUnsubscribed = Boolean((data as { unsubscribed?: boolean }).unsubscribed);
  const bySubscribed = (data as { subscribed?: boolean }).subscribed === false;
  return byUnsubscribed || bySubscribed;
}

export async function safeSendEmail(
  to: string,
  subject: string,
  html: string,
  options: SafeSendOptions = {},
): Promise<{ success: boolean; skipped?: boolean; reason?: string }> {
  const normalizedTo = to.trim().toLowerCase();
  const ipAddress = cleanIp(options.ipAddress);
  const supabase = getSupabaseAdminClient();
  const transport = options.transporter ?? createSmtpTransporter();

  if (!transport) {
    await notifyEmailFailed(normalizedTo, subject, "SMTP transporter is not configured", 0);
    return { success: false, reason: "smtp_not_configured" };
  }

  if (!checkRateLimit(ipAddress)) {
    await notifyEmailFailed(normalizedTo, subject, "IP rate limit exceeded", 0);
    return { success: false, reason: "rate_limited" };
  }

  if (await isUnsubscribedEmail(normalizedTo)) {
    await logAuditEvent("email_skipped_unsubscribed", "email", null, "system", {
      to_hash: sha256(normalizedTo),
      subject,
      ip: ipAddress,
    });
    return { success: true, skipped: true, reason: "unsubscribed" };
  }

  const delays = [1000, 3000, 9000];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await transport.sendMail({
        to: normalizedTo,
        subject,
        html,
        text: options.text,
        from: options.from,
        replyTo: options.replyTo,
        headers: options.headers,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments,
      });
      await logAuditEvent("email_sent", "email", null, "system", {
        to_hash: sha256(normalizedTo),
        subject,
        ip: ipAddress,
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? `${error.message}\n${error.stack || ""}` : String(error);
      if (attempt >= 3) {
        await notifyEmailFailed(normalizedTo, subject, message, attempt);
        if (supabase) {
          await logAuditEvent("email_failed", "email", null, "system", {
            to_hash: sha256(normalizedTo),
            subject,
            attempt,
            ip: ipAddress,
          });
        }
        return { success: false, reason: "send_failed" };
      }
      await sleep(delays[attempt - 1]);
    }
  }

  return { success: false, reason: "unknown" };
}
