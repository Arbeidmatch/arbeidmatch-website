import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { getPublicBaseUrl, type DsbGuideSlug } from "@/lib/dsbGuideAccess";
import { signDsbEmailVerifyToken } from "@/lib/dsbEmailVerifyToken";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";

export const dynamic = "force-dynamic";

type Body = {
  guide_slug?: string;
  email?: string;
  website?: string;
};

const VERIFY_LINK_TTL_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(raw)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "dsb-guide-verify-email", 15, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = raw as Body;
    const guideSlug = body.guide_slug?.trim() as DsbGuideSlug | undefined;
    const email = body.email?.trim().toLowerCase();

    if (guideSlug !== "eu" && guideSlug !== "non-eu") {
      return NextResponse.json({ success: false, error: "Invalid guide." }, { status: 400 });
    }
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });
    }

    let token: string;
    try {
      token = signDsbEmailVerifyToken({
        email,
        guide_slug: guideSlug,
        expMs: Date.now() + VERIFY_LINK_TTL_MS,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Verification is not configured.";
      console.error("[dsb-guide/verify-email] token:", message);
      return NextResponse.json({ success: false, error: "Verification is not configured." }, { status: 500 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const { data: guide, error: guideError } = await supabase
      .from("dsb_guides")
      .select("slug, title")
      .eq("slug", guideSlug)
      .maybeSingle();

    if (guideError || !guide) {
      return NextResponse.json({ success: false, error: "Guide not found." }, { status: 404 });
    }

    const baseUrl = getPublicBaseUrl();
    const verifyUrl = `${baseUrl}/dsb-support/verify?token=${encodeURIComponent(token)}`;

    const smtpPass = process.env.SMTP_PASS;
    if (!smtpPass) {
      console.error("[dsb-guide/verify-email] SMTP_PASS missing; cannot send email.");
      return NextResponse.json({ success: false, error: "Email is not configured." }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: smtpPass,
      },
    });

    const title = (guide.title as string) || "DSB Guide";

    await transporter.sendMail({
      from: '"ArbeidMatch" <no-replay@arbeidmatch.no>',
      to: email,
      subject: "Confirm your email to continue to checkout",
      text: `Hi,

Please confirm your email to continue to secure checkout for: ${title}

Open this link (expires in 30 minutes):
${verifyUrl}

If you did not request this, you can ignore this email.

ArbeidMatch Norge AS`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#F5F6F8;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #E2E5EA;padding:24px;color:#0D1B2A;">
            <p>Hi,</p>
            <p>Please confirm your email to continue to secure checkout for: <strong>${title}</strong></p>
            <p><a href="${verifyUrl}" style="display:inline-block;margin-top:12px;padding:12px 20px;background:#C9A84C;color:#0a0f14;font-weight:600;border-radius:8px;text-decoration:none;">Continue to checkout</a></p>
            <p style="font-size:13px;color:#5c6470;margin-top:16px;">This link expires in 30 minutes.</p>
            <p style="font-size:13px;color:#5c6470;">If you did not request this, you can ignore this email.</p>
            <p style="margin-top:24px;">ArbeidMatch Norge AS</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[dsb-guide/verify-email]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
