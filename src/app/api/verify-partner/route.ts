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
    const testUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const testKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const keyPreview = testKey ? testKey.substring(0, 20) + "..." : "MISSING";
    await notifyError({
      route: "/api/verify-partner DEBUG",
      error: new Error(`URL: ${testUrl ? "OK" : "MISSING"} | KEY: ${keyPreview}`),
    });

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
      title: "Your secure access link is ready.",
      preheader: "Partner verification completed. Secure access link inside.",
      body: `
        <div style="margin:0;padding:0;background:#0D1B2A;">
          <div style="max-width:600px;margin:0 auto;background:#0D1B2A;">
            <div style="background:#0a0f18;padding:32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;line-height:1.2;">Arbeid</span><span style="font-size:24px;font-weight:700;color:#C9A84C;line-height:1.2;">Match</span>
            </div>
            <div style="width:60px;height:2px;background:#C9A84C;margin:0 auto;"></div>
            <div style="padding:40px 36px;background:#0D1B2A;">
              <p style="margin:0 0 8px 0;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.45);">You are verified as a partner.</p>
              <h1 style="margin:0 0 16px 0;font-size:26px;font-weight:700;line-height:1.3;color:#ffffff;">Your secure access link is ready.</h1>
              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.6);">
                Click the button below to access candidate profiles. Your link is personal and valid for 14 days from the moment it was generated.
              </p>
              <div style="text-align:left;">
                <a href="${secureUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:700;font-size:15px;padding:16px 40px;border-radius:10px;text-decoration:none;">Access Candidate Profiles</a>
              </div>
              <p style="margin:32px 0 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.3);">
                🔒 This link is linked to your partner account. Do not share it with others. If you did not request this, contact post@arbeidmatch.no immediately.
              </p>
            </div>
            <div style="background:#0a0f18;padding:24px 36px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;color:rgba(255,255,255,0.25);">ArbeidMatch Norge AS | Org.nr 935 667 089 MVA</p>
              <p style="margin:0 0 8px 0;font-size:11px;color:rgba(255,255,255,0.25);">Sverre Svendsens veg 38, 7056 Ranheim, Trondheim, Norway</p>
              <p style="margin:0;font-size:11px;">
                <a href="mailto:post@arbeidmatch.no" style="color:rgba(201,168,76,0.5);text-decoration:none;">post@arbeidmatch.no</a>
                <span style="color:rgba(255,255,255,0.25);"> | </span>
                <a href="https://arbeidmatch.no" style="color:rgba(201,168,76,0.5);text-decoration:none;">arbeidmatch.no</a>
              </p>
            </div>
          </div>
        </div>
      `,
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
