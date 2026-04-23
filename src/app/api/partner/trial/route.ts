import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { buildEmail } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Supabase configuration missing." }, { status: 500 });
    }

    const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const upsertRes = await supabase.from("partners").upsert(
      {
        email,
        company_name: "Trial Partner",
        active: true,
        tier: "trial",
        trial_expires_at: trialExpiresAt,
      },
      { onConflict: "email" },
    );
    if (upsertRes.error) {
      throw upsertRes.error;
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: "Your ArbeidMatch trial is active",
        text: `Your 7-day trial is now active and expires on ${new Date(trialExpiresAt).toUTCString()}.`,
        html: buildEmail({
          title: "Trial activated",
          preheader: "Your 7-day trial has started.",
          body: `<p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
            Your 7-day trial is now active. Trial expiry: <strong>${new Date(trialExpiresAt).toUTCString()}</strong>.
          </p>`,
          ctaText: "Open platform",
          ctaUrl: "https://arbeidmatch.no/request",
        }),
      });
    }

    return NextResponse.json({ success: true, tier: "trial", trial_expires_at: trialExpiresAt });
  } catch (error) {
    await notifyError({ route: "/api/partner/trial", error });
    return NextResponse.json({ success: false, error: "Could not start trial." }, { status: 500 });
  }
}
