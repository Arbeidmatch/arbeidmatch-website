import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const freeEmailDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "live.com",
  "msn.com",
]);

const schema = z.object({
  email: z.string().email(),
});

function getDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() || "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const domain = getDomain(email);
    if (!domain || freeEmailDomains.has(domain)) {
      return NextResponse.json({ success: false, reason: "personal_email" }, { status: 200 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing" }, { status: 500 });
    }

    const token = crypto.randomUUID();
    const { error: insertError } = await supabase.from("partner_requests").insert({
      email,
      status: "email_sent",
      token,
      gdpr_consent: false,
    });
    if (insertError) {
      throw insertError;
    }

    const applicationUrl = `https://arbeidmatch.no/become-a-partner?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    const unsubscribeUrl = "mailto:post@arbeidmatch.no?subject=Unsubscribe%20from%20ArbeidMatch%20emails";

    const transporter = createSmtpTransporter();
    if (transporter) {
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: "Complete your ArbeidMatch partner application",
        text:
          `Complete your application here: ${applicationUrl}\n\n` +
          `This link is confidential and valid for 30 minutes.\n` +
          `Source website: https://arbeidmatch.no\n\n` +
          `If you did not request this email, ignore it.\n` +
          `To stop receiving emails, unsubscribe here: ${unsubscribeUrl}`,
        html: buildEmail({
          title: "Complete your application",
          preheader: "Continue your partner application with ArbeidMatch.",
          body: `
            <p style="margin:0 0 16px 0;font-size:15px;color:rgba(255,255,255,0.82);line-height:1.7;">
              Click the button below to continue your partner application with ArbeidMatch.
            </p>
            <p style="margin:0 0 16px 0;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.7;">
              This link is confidential and valid for 30 minutes.
            </p>
          `,
          ctaText: "Continue application",
          ctaUrl: applicationUrl,
          footerNoteHtml: `If you did not request this, ignore this email. <a href="${escapeHtml(unsubscribeUrl)}" style="color:rgba(255,255,255,0.5);text-decoration:underline;">Unsubscribe</a>.`,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST205"
    ) {
      return NextResponse.json(
        { success: false, reason: "table_missing", error: "Partner requests table is not configured." },
        { status: 503 },
      );
    }
    await notifyError({ route: "/api/partner-request/start", error });
    return NextResponse.json({ success: false, error: "Could not start partner request." }, { status: 500 });
  }
}
