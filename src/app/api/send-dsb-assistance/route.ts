import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { emailParagraph, mailHeaders, premiumCtaButton } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { buildEmail } from "@/lib/emailTemplate";

export async function POST(request: NextRequest) {
  try {
    const rawBody = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(rawBody)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "send-dsb-assistance", 8, 10 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const data = sanitizeStringRecord(rawBody);
    if (!data.email || !data.email.includes("@")) {
      return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });
    }
    if (data.consent !== "Yes") {
      return NextResponse.json({ success: false, error: "Consent is required." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: "send.one.com",
      port: 465,
      secure: true,
      auth: {
        user: "no-replay@arbeidmatch.no",
        pass: process.env.SMTP_PASS,
      },
    });

    const ref = `DSB-${Date.now()}`;
    const internalBody = [
      { label: "Email", value: data.email },
      { label: "Consent", value: data.consent },
      { label: "Source", value: "/dsb-assistance" },
      { label: "Reference", value: ref },
    ]
      .map(
        (row) =>
          `<div style="padding:12px 0;border-bottom:1px solid rgba(201,168,76,0.08);"><div style="color:rgba(255,255,255,0.5);font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">${row.label}</div><div style="color:#ffffff;font-size:15px;font-weight:500;margin-top:4px;">${row.value}</div></div>`,
      )
      .join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New DSB assistance interest: ${data.email}`,
      html: buildEmail({
        title: `New DSB assistance interest: ${data.email}`,
        preheader: "Internal DSB assistance lead",
        body: internalBody,
      }),
    });

    const userInner = [
      emailParagraph("Thank you for your request."),
      emailParagraph("We registered your interest in DSB support for electricians."),
      emailParagraph("As soon as this assistance option becomes active, we will contact you with details by email."),
      emailParagraph(`<strong>Registered email:</strong> ${data.email}`),
      `<div style="text-align:center;margin:8px 0 0;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</div>`,
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: data.email,
      subject: "DSB support notification registered | ArbeidMatch",
      html: buildEmail({
        title: "DSB support notification registered",
        preheader: "We registered your DSB assistance interest",
        body: userInner,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/send-dsb-assistance", error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
