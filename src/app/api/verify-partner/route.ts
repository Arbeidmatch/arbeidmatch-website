import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

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

    const supabase = getSupabaseServiceClient();
    if (!supabase) return NextResponse.json({ verified: false }, { status: 500 });

    const email = parsed.data.email.trim().toLowerCase();
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return NextResponse.json({ verified: false });

    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("id, company_name, domain")
      .eq("domain", domain)
      .eq("active", true)
      .single();

    if (partnerError) {
      if (partnerError.code === "42P01") {
        return NextResponse.json({ verified: false });
      }
      throw partnerError;
    }

    if (!partner) {
      return NextResponse.json({ verified: false });
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
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

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
      title: "Secure Partner Access",
      preheader: "Your link is valid for 14 days",
      body: [
        "<p>Here is your secure link to access candidate profiles and submit requests.</p>",
        "<p>This link is valid for 14 days and is linked to your partner account.</p>",
        `<a href="${secureUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">Access Candidate Profiles</a>`,
        '<p style="font-size:12px;color:rgba(255,255,255,0.4);">If you did not request this link, please contact us at post@arbeidmatch.no</p>',
      ].join(""),
    });

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "Your ArbeidMatch secure access link",
      text: `Here is your secure link to access candidate profiles and submit requests: ${secureUrl}\n\nThis link is valid for 14 days and is linked to your partner account.`,
      html,
    });

    return NextResponse.json({ verified: true, company_name: partner.company_name });
  } catch (error) {
    await notifyError({ route: "/api/verify-partner", error });
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
