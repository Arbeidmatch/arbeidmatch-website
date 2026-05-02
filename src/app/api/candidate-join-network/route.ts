import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet, mailHeaders, wrapPremiumEmail, emailParagraph } from "@/lib/emailPremiumTemplate";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  gdpr_consent: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    if (isRateLimited(request, "candidate-join-network", 8, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request. Please check your email and consent." }, { status: 400 });
    }

    const { email } = parsed.data;
    const transporter = createSmtpTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const ts = formatEmailTimestampCet();
    const internalText = `Talent network join request\n\nCandidate email: ${email}\nTimestamp: ${ts}`;

    await transporter.sendMail({
      ...mailHeaders(),
      to: "cv@arbeidmatch.no",
      subject: `New talent network interest: ${email}`,
      text: internalText,
    });

    const innerHtml = [
      `<h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0D1B2A;letter-spacing:-0.02em;">We received your interest</h1>`,
      emailParagraph(
        "Thank you for reaching out to ArbeidMatch. We are currently building our system and the registration process may be delayed. We are doing our best to make this as fast as possible.",
      ),
      emailParagraph(
        'In the meantime, you can send your CV directly to <a href="mailto:cv@arbeidmatch.no" style="color:#B8860B;text-decoration:none;font-weight:600;">cv@arbeidmatch.no</a> and we will be in touch soon.',
      ),
    ].join("");

    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: "We received your interest - ArbeidMatch",
      text: `We received your interest\n\nThank you for reaching out to ArbeidMatch. We are currently building our system and the registration process may be delayed. We are doing our best to make this as fast as possible.\n\nIn the meantime, you can send your CV directly to cv@arbeidmatch.no and we will be in touch soon.`,
      html: wrapPremiumEmail(innerHtml),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-join-network", error });
    console.error("[candidate-join-network]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
