import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { getPublicBaseUrl, type DsbGuideSlug } from "@/lib/dsbGuideAccess";
import { signDsbEmailVerifyToken } from "@/lib/dsbEmailVerifyToken";
import { validateCouponForCheckout } from "@/lib/dsbDiscountLeads";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import {
  emailParagraph,
  emailSupportAfterCta,
  mailHeaders,
  premiumCtaButton,
  wrapPremiumEmail,
} from "@/lib/emailPremiumTemplate";

export const dynamic = "force-dynamic";

type Body = {
  guide_slug?: string;
  email?: string;
  website?: string;
  coupon_code?: string;
};

const VERIFY_LINK_TTL_MS = 30 * 60 * 1000;

function guideAudienceLabel(slug: DsbGuideSlug): string {
  return slug === "eu" ? "EU/EEA" : "Non-EU";
}

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

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    let couponInToken: string | undefined;
    const rawCoupon = typeof body.coupon_code === "string" ? body.coupon_code.trim() : "";
    if (rawCoupon) {
      const valid = await validateCouponForCheckout(supabase, email, guideSlug, rawCoupon);
      if (valid) {
        couponInToken = rawCoupon;
      }
    }

    let token: string;
    try {
      token = signDsbEmailVerifyToken({
        email,
        guide_slug: guideSlug,
        expMs: Date.now() + VERIFY_LINK_TTL_MS,
        ...(couponInToken ? { coupon_code: couponInToken } : {}),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Verification is not configured.";
      console.error("[dsb-guide/verify-email] token:", message);
      return NextResponse.json({ success: false, error: "Verification is not configured." }, { status: 500 });
    }

    const { data: guideRow, error: guideError } = await supabase
      .from("dsb_guides")
      .select("slug")
      .eq("slug", guideSlug)
      .maybeSingle();

    if (guideError || !guideRow) {
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

    const audience = guideAudienceLabel(guideSlug);
    const innerHtml = [
      emailParagraph("Hi there,"),
      emailParagraph(
        `You requested access to the <strong>${audience}</strong> DSB Authorization Guide.`,
      ),
      emailParagraph(
        "Click the button below to verify your email and proceed to payment. This link expires in 30 minutes.",
      ),
      `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton(verifyUrl, "Verify Email and Continue to Payment")}</div>`,
      emailSupportAfterCta(),
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "Verify your email to access the DSB Guide",
      text: `Hi there,

You requested access to the ${audience} DSB Authorization Guide.

Please open the HTML version of this email and use the "Verify Email and Continue to Payment" button. This step expires in 30 minutes.

If you cannot use the button, contact support@arbeidmatch.no and we will assist you.

ArbeidMatch Norge AS`,
      html: wrapPremiumEmail(innerHtml),
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[dsb-guide/verify-email]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
