import { NextRequest } from "next/server";
import { z } from "zod";

import { buildNonEuLeadEmail } from "@/lib/emails/nonEuLeadEmail";
import { buildEmail, emailFieldRows } from "@/lib/emailTemplate";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import {
  getRateLimitResult,
  hasHoneypotValue,
  noStoreJson,
  parseJsonBodyWithSchema,
} from "@/lib/apiSecurity";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { notifyError } from "@/lib/errorNotifier";
import { notifySlack } from "@/lib/slackNotifier";
import { logApiError } from "@/lib/secureLogger";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    firstName: z.string().trim().min(2).max(80),
    email: z.string().trim().email().max(200),
    website: z.string().max(256).optional(),
    honeypot: z.string().max(256).optional(),
  })
  .strict();

export async function POST(request: NextRequest) {
  try {
    const rate = getRateLimitResult(request, "non-eu-lead", 10, 10 * 60 * 1000);
    if (rate.limited) {
      return noStoreJson(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const parsed = await parseJsonBodyWithSchema(request, bodySchema, { maxBytes: 8 * 1024 });
    if (!parsed.ok) return parsed.response;

    if (hasHoneypotValue(parsed.data)) {
      return noStoreJson({ success: true });
    }

    const { firstName, email } = parsed.data;
    const emailLower = email.trim().toLowerCase();

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return noStoreJson({ success: false, error: "SMTP not configured" }, { status: 500 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return noStoreJson({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const { error: insertError } = await supabase.from("non_eu_leads").insert({
      first_name: firstName,
      email: emailLower,
    });

    if (insertError) {
      throw insertError;
    }

    if (!(await isUnsubscribed(emailLower))) {
      const unsubToken = await getOrCreateSubscription(emailLower, "non-eu-lead");
      await transporter.sendMail({
        ...mailHeaders(),
        to: emailLower,
        subject: "Your free Norway work guide — ArbeidMatch",
        html: buildNonEuLeadEmail(firstName, unsubToken),
      });
    }

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New Non-EU Lead: ${firstName} ${emailLower}`,
      html: buildEmail({
        title: "New Non-EU Lead",
        preheader: "Internal lead notification",
        body: emailFieldRows([
          { label: "Name", value: firstName },
          { label: "Email", value: emailLower },
        ]),
      }),
    });

    void notifySlack("nonEu", {
      title: "New Non-EU Lead",
      fields: { Name: firstName, Email: email },
    });

    return noStoreJson({ success: true });
  } catch (error) {
    console.error("[non-eu-lead] detailed error:", JSON.stringify(error, null, 2), (error as Error)?.message, (error as Error)?.stack);
    logApiError("non-eu-lead", error);
    await notifyError({ route: "/api/non-eu-lead", error });
    return noStoreJson({ success: false, error: "Could not complete signup." }, { status: 500 });
  }
}
