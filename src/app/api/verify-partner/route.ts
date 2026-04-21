import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";

const schema = z.object({
  email: z.string().email(),
  token: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ verified: false }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const email = parsed.data.email.trim().toLowerCase();
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return NextResponse.json({ verified: false });

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, company_name, domain")
      .eq("domain", domain)
      .eq("active", true)
      .maybeSingle();

    if (partnerError) {
      if (partnerError.code === "PGRST116") {
        return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
      }
      if (partnerError.code === "42P01") {
        return NextResponse.json({ verified: false });
      }
      throw partnerError;
    }

    if (!partner) {
      return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
    }

    let requestToken = parsed.data.token;
    if (!requestToken) {
      requestToken = crypto.randomUUID();
      const requestExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error: requestTokenError } = await supabase.from("request_tokens").insert({
        token: requestToken,
        full_name: "Partner Contact",
        company: partner.company_name || domain,
        email,
        phone: "N/A",
        job_summary: "Partner candidate request",
        gdpr_consent: true,
        expires_at: requestExpiresAt,
        used: false,
      });
      if (requestTokenError) {
        throw requestTokenError;
      }
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("partner_sessions").insert({
      email,
      session_token: sessionToken,
      request_token: requestToken,
      expires_at: expiresAt,
    });

    if (sessionError) {
      if (sessionError.code === "42P01") {
        return NextResponse.json({ verified: false });
      }
      throw sessionError;
    }

    const transporter = createSmtpTransporter();
    if (!transporter) return NextResponse.json({ verified: true });

    const secureUrl = `https://arbeidmatch.no/request/partner/${sessionToken}`;
    const html = buildEmail({
      title: "Your secure access link is ready.",
      preheader: "Partner verification completed. Secure access link inside.",
      body: `
        <p style="margin:0 0 10px 0;font-size:11px;color:rgba(255,255,255,0.4);letter-spacing:0.12em;">YOU ARE VERIFIED AS A PARTNER</p>
        <p style="margin:0 0 16px 0;font-size:15px;color:rgba(255,255,255,0.8);line-height:1.7;">
          Click the button below to access candidate profiles. Your link is personal and valid for 30 minutes from the moment it was generated.
        </p>
        <div style="text-align:center;margin:8px 0 20px;">
          <a href="${secureUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;">Access Candidate Profiles</a>
        </div>
        <p style="font-size:12px;color:rgba(255,255,255,0.35);line-height:1.6;margin:0;">
          This link is linked to your partner account. Do not share it with others. If you did not request this, contact post@arbeidmatch.no immediately.
        </p>
      `,
    });

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "Your ArbeidMatch secure access link",
      text: `Here is your secure link to access candidate profiles and submit requests: ${secureUrl}\n\nThis link is valid for 30 minutes and is linked to your partner account.`,
      html,
    });

    return NextResponse.json({ verified: true, company_name: partner.company_name });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "PGRST116"
    ) {
      return NextResponse.json({ verified: false, reason: "not_found" }, { status: 200 });
    }
    await notifyError({ route: "/api/verify-partner", error });
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
