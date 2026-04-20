import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildInternalEmailHtml } from "@/lib/emailPremiumTemplate";
import { buildDiscountOfferEmailHtml, mailHeaders } from "@/lib/dsbDiscountEmail";
import { findActiveUnusedLead } from "@/lib/dsbDiscountLeads";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { createDiscountCoupon } from "@/lib/stripeCoupons";
import type { DsbDiscountGuideType } from "@/lib/stripeCoupons";
import { notifyError } from "@/lib/errorNotifier";

export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  guide_type?: string;
  website?: string;
};

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(raw)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "dsb-guide-discount-offer", 10, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = raw as Body;
    const email = body.email?.trim().toLowerCase();
    const guideType = body.guide_type?.trim() as DsbDiscountGuideType | undefined;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });
    }
    if (guideType !== "eu" && guideType !== "non-eu") {
      return NextResponse.json({ success: false, error: "Invalid guide type." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const existing = await findActiveUnusedLead(supabase, email, guideType);
    if (existing) {
      const expiresAt = new Date(existing.expires_at);
      return NextResponse.json({
        success: true,
        couponCode: existing.coupon_code,
        expiresAt: expiresAt.toISOString(),
        reused: true,
      });
    }

    const created = await createDiscountCoupon(email, guideType);
    if (!created) {
      return NextResponse.json({ success: false, error: "Could not create discount. Please try again later." }, { status: 500 });
    }

    const { error: insErr } = await supabase.from("discount_leads").insert({
      email,
      guide_type: guideType,
      coupon_code: created.couponCode,
      expires_at: created.expiresAt.toISOString(),
      used: false,
      reminder_sent: false,
    });

    if (insErr) {
      console.error("[discount-offer] insert:", insErr.message);
      return NextResponse.json({ success: false, error: "Could not save discount." }, { status: 500 });
    }

    const smtpPass = process.env.SMTP_PASS;
    if (!smtpPass) {
      console.error("[discount-offer] SMTP_PASS missing");
      return NextResponse.json({ success: false, error: "Email is not configured." }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: { user: "no-replay@arbeidmatch.no", pass: smtpPass },
    });

    const html = buildDiscountOfferEmailHtml({
      guideType,
      couponCode: created.couponCode,
      expiresAt: created.expiresAt,
    });

    try {
      await transporter.sendMail({
        ...mailHeaders(),
        to: email,
        subject: "Your exclusive DSB Guide discount - valid 7 days",
        html,
      });

      await transporter.sendMail({
        ...mailHeaders(),
        to: "post@arbeidmatch.no",
        subject: `New discount lead: ${email} (${guideType})`,
        html: buildInternalEmailHtml({
          title: `New discount lead: ${email}`,
          rows: [
            { label: "Email", value: email },
            { label: "Guide", value: guideType },
            { label: "Coupon", value: created.couponCode },
            { label: "Expires", value: created.expiresAt.toISOString() },
          ],
        }),
      });
    } catch (error) {
      console.error("[Discount] Email failed:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      couponCode: created.couponCode,
      expiresAt: created.expiresAt.toISOString(),
      reused: false,
    });
  } catch (e) {
    await notifyError({ route: "/api/dsb-guide/discount-offer", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[discount-offer]", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
