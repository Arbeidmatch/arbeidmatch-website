import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { applyRecipientEmailPlaceholders, UNSUBSCRIBED_PAGE_EMAIL_HREF } from "@/lib/websiteEmailTemplates";

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

function buildStartEmailHtml(applicationUrl: string, unsubscribeUrl: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0f18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f18;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0D1B2A;border:1px solid rgba(201,168,76,0.2);border-top:2px solid rgba(201,168,76,0.45);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px 18px;text-align:center;">
              <span style="color:#ffffff;font-weight:700;font-size:24px;">Arbeid</span><span style="color:#C9A84C;font-weight:700;font-size:24px;">Match</span>
              <div style="width:60px;height:2px;background:#C9A84C;margin:12px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 32px;">
              <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Partner Application</p>
              <h1 style="margin:12px 0 0;font-size:26px;line-height:1.25;color:#ffffff;">Complete your application.</h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.62);">
                Click the button below to continue your partner application with ArbeidMatch.
              </p>
              <div style="margin:28px 0;text-align:center;">
                <a href="${applicationUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;padding:14px 26px;">
                  Continue application
                </a>
              </div>
              <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">
                This link is confidential and intended only for your company account.
              </p>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">
                For security reasons, this link is valid for 30 minutes.
              </p>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">
                Source website: <a href="https://arbeidmatch.no" style="color:rgba(201,168,76,0.8);text-decoration:none;">arbeidmatch.no</a>
              </p>
              <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">
                If you did not request this, you can ignore this email.
              </p>
              <p style="margin:10px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.35);">
                To stop receiving emails from us, click
                <a href="${unsubscribeUrl}" style="color:rgba(201,168,76,0.8);text-decoration:none;"> Unsubscribe</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
    const unsubscribeUrl = UNSUBSCRIBED_PAGE_EMAIL_HREF;
    const unsubscribeResolved = `https://arbeidmatch.no/unsubscribed?email=${encodeURIComponent(email)}`;

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
          `To stop receiving emails, open: ${unsubscribeResolved}`,
        html: applyRecipientEmailPlaceholders(buildStartEmailHtml(applicationUrl, unsubscribeUrl), email),
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
