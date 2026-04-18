import nodemailer from "nodemailer";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { buildDiscountReminderEmailHtml, mailHeaders } from "@/lib/dsbDiscountEmail";
import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";
import { buildInternalEmailHtml } from "@/lib/emailPremiumTemplate";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function createTransporter() {
  const pass = process.env.SMTP_PASS;
  if (!pass) return null;
  return nodemailer.createTransport({
    host: "send.one.com",
    port: 465,
    secure: true,
    auth: { user: "no-replay@arbeidmatch.no", pass },
  });
}

export type SendReminderResult = {
  processed: number;
  sent: number;
  errors: string[];
};

/**
 * Sends reminder emails for discount leads created ≥3 days ago,
 * not used, reminder not yet sent, and not expired.
 */
export async function sendPendingReminders(): Promise<SendReminderResult> {
  const result: SendReminderResult = { processed: 0, sent: 0, errors: [] };
  const supabase = getSupabaseServiceClient();
  const transporter = createTransporter();
  if (!supabase) {
    result.errors.push("Supabase not configured");
    return result;
  }
  if (!transporter) {
    result.errors.push("SMTP_PASS not configured");
    return result;
  }

  const cutoff = new Date(Date.now() - THREE_DAYS_MS).toISOString();
  const now = new Date().toISOString();

  const { data: rows, error } = await supabase
    .from("discount_leads")
    .select("id, email, guide_type, coupon_code, expires_at")
    .eq("used", false)
    .eq("reminder_sent", false)
    .lt("created_at", cutoff)
    .gt("expires_at", now);

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const list = rows ?? [];
  for (const row of list) {
    result.processed += 1;
    const email = (row.email as string)?.trim().toLowerCase();
    const guideType = row.guide_type as DsbDiscountGuideType;
    const couponCode = row.coupon_code as string;
    const expiresAt = new Date(row.expires_at as string);
    const id = row.id as string;

    if (!email || !couponCode || (guideType !== "eu" && guideType !== "non-eu")) {
      result.errors.push(`Invalid row ${id}`);
      continue;
    }

    try {
      const html = buildDiscountReminderEmailHtml({ guideType, couponCode, expiresAt });
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: "Your DSB Guide discount expires in 4 days",
        html,
      });

      const { error: upErr } = await supabase.from("discount_leads").update({ reminder_sent: true }).eq("id", id);
      if (upErr) {
        result.errors.push(`Update ${id}: ${upErr.message}`);
        continue;
      }
      result.sent += 1;
    } catch (e) {
      result.errors.push(`${email}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (result.sent > 0) {
    try {
      await transporter.sendMail({
        ...mailHeaders(),
        to: "post@arbeidmatch.no",
        subject: `Discount reminders sent: ${result.sent}`,
        html: buildInternalEmailHtml({
          title: "Discount reminder batch",
          rows: [
            { label: "Processed", value: String(result.processed) },
            { label: "Sent", value: String(result.sent) },
            { label: "Errors", value: result.errors.length ? result.errors.join("; ") : "none" },
          ],
        }),
      });
    } catch {
      /* optional internal notify */
    }
  }

  return result;
}
