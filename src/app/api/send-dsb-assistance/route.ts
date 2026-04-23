import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { mailHeaders, premiumCtaButton } from "@/lib/emailPremiumTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { buildEmail, emailBodyParagraph, emailFieldRows } from "@/lib/emailTemplate";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

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
    const internalBody = emailFieldRows([
      { label: "Email", value: data.email },
      { label: "Consent", value: data.consent },
      { label: "Source", value: "/dsb-assistance" },
      { label: "Reference", value: ref },
    ]);

    await transporter.sendMail({
      ...mailHeaders(),
      to: "post@arbeidmatch.no",
      subject: `New DSB assistance interest: ${data.email}`,
      html: buildEmail({
        title: `New DSB assistance interest: ${data.email}`,
        preheader: "Internal DSB assistance lead",
        body: internalBody,
        audience: "b2b",
        unsubscribeEmail: "post@arbeidmatch.no",
      }),
    });

    const userInner = [
      emailBodyParagraph("Thank you for your request."),
      emailBodyParagraph("We registered your interest in DSB support for electricians."),
      emailBodyParagraph("As soon as this assistance option becomes active, we will contact you with details by email."),
      emailBodyParagraph(`<strong>Registered email:</strong> ${data.email}`),
      `<p style="margin:8px 0 0;text-align:center;">${premiumCtaButton("https://arbeidmatch.no/feedback", "Share feedback")}</p>`,
    ].join("");

    if (!(await isUnsubscribed(data.email))) {
      const unsubToken = await getOrCreateSubscription(data.email, "dsb-assistance");
      await transporter.sendMail({
        ...mailHeaders(),
        to: data.email,
        subject: "DSB support notification registered | ArbeidMatch",
        html: buildEmail({
          title: "DSB support notification registered",
          preheader: "We registered your DSB assistance interest",
          body: userInner,
          unsubscribeToken: unsubToken,
          audience: "b2c",
          unsubscribeEmail: data.email,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/send-dsb-assistance", error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
