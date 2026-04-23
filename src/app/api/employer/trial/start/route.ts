import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { mailHeaders, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";
import { safeSendEmail } from "@/lib/email/safeSend";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
});

function buildTrialStartEmailHtml(accessUrl: string): string {
  return wrapPremiumEmail(`
    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#ffffff;">Confirm your email address</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#ffffff;">
      Someone (hopefully you) requested access to ArbeidMatch. Click below to confirm your email and continue setting up your account. If this wasn't you, simply ignore this email — no action needed.
    </p>
    <div style="margin:24px 0 12px;">
      <a href="${accessUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;text-decoration:none;font-size:15px;font-weight:700;padding:14px 28px;border-radius:8px;">Confirm my email →</a>
    </div>
    <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.7);">This link expires in 48 hours.</p>
  `);
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse((await request.json().catch(() => null)) as unknown);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Service unavailable." }, { status: 503 });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const trialLabel = "employer_trial";

    const withType = await supabase.from("request_tokens").insert({
      token,
      full_name: "Employer trial",
      company: "Employer trial",
      email,
      phone: null,
      job_summary: trialLabel,
      type: trialLabel,
      expires_at: expiresAt,
      used: false,
      gdpr_consent: true,
    } as Record<string, unknown>);

    if (withType.error) {
      const fallback = await supabase.from("request_tokens").insert({
        token,
        full_name: "Employer trial",
        company: "Employer trial",
        email,
        phone: null,
        job_summary: trialLabel,
        expires_at: expiresAt,
        used: false,
        gdpr_consent: true,
      });
      if (fallback.error) throw fallback.error;
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://arbeidmatch.no";
    const accessUrl = `${origin}/employer/verify/${token}`;
    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = buildTrialStartEmailHtml(accessUrl);
      await safeSendEmail(email, "Confirm your email — ArbeidMatch", html, {
        ...mailHeaders(),
        text:
          "Confirm your email address.\n\nSomeone (hopefully you) requested access to ArbeidMatch. Click below to confirm your email and continue setting up your account. If this wasn't you, simply ignore this email — no action needed.\n\nConfirm my email: " +
          accessUrl +
          "\n\nThis link expires in 48 hours.",
        transporter,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/employer/trial/start", error });
    return NextResponse.json({ success: false, error: "Could not start trial flow." }, { status: 500 });
  }
}

