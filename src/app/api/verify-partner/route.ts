import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { getSupabaseServiceClient } from "@/lib/supabaseService";

const schema = z.object({
  email: z.string().email(),
  token: z.string().uuid(),
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
    const { data: partner, error: partnerError } = await supabase
      .from("partners")
      .select("email, active")
      .eq("email", email)
      .eq("active", true)
      .maybeSingle();

    if (partnerError) {
      if (partnerError.code === "42P01") {
        return NextResponse.json({ verified: false });
      }
      throw partnerError;
    }

    if (!partner) {
      return NextResponse.json({ verified: false });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase.from("partner_sessions").insert({
      email,
      session_token: sessionToken,
      request_token: parsed.data.token,
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://arbeidmatch.no";
    const secureUrl = `${baseUrl}/request/partner/${sessionToken}`;

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "Your secure partner access link",
      text: `Use this secure link to continue your request: ${secureUrl}\n\nThis link expires in 1 hour.`,
      html: `<p style="margin:0 0 12px;">Use this secure link to continue your request:</p><p style="margin:0 0 16px;"><a href="${secureUrl}" style="color:#C9A84C;">${secureUrl}</a></p><p style="margin:0;color:#666;">This link expires in 1 hour.</p>`,
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    await notifyError({ route: "/api/verify-partner", error });
    return NextResponse.json({ verified: false }, { status: 500 });
  }
}
