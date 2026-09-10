import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { TALENT_NETWORK_FORM_ENABLED } from "@/lib/featureFlags";
import { isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet, mailHeaders } from "@/lib/emailPremiumTemplate";
import { profileRequestLetter, verifiedProfileNoticeLetter } from "@/lib/emails/letters";
import { unsubscribeUrlFor } from "@/lib/emailSubscription";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  gdpr_consent: z.literal(true),
  eu_eea_passport_confirmed: z.literal(true),
});

export async function POST(request: NextRequest) {
  try {
    if (!TALENT_NETWORK_FORM_ENABLED) {
      return NextResponse.json(
        {
          error: "endpoint_disabled",
          message: "Talent network registration is currently routed through https://jobs.arbeidmatch.no",
        },
        { status: 410 },
      );
    }

    const json = (await request.json()) as unknown;
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request. Please check your email and consent." }, { status: 400 });
    }

    const { email } = parsed.data;
    if (isRateLimited(request, `candidate-join-network:${email}`, 1, 60 * 1000)) {
      return NextResponse.json({ error: "Please wait one minute before sending another request." }, { status: 429 });
    }
    const transporter = createSmtpTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const ts = formatEmailTimestampCet();
    const internalText = `Verified profile request\n\nCandidate email: ${email}\nEU/EEA passport confirmed: yes\nGDPR consent confirmed: yes\nTimestamp: ${ts}`;

    const notice = verifiedProfileNoticeLetter({ email, timestamp: ts });
    await transporter.sendMail({
      ...mailHeaders(),
      to: "cv@arbeidmatch.no",
      subject: notice.subject,
      text: internalText,
      html: notice.html,
    });

    const letter = profileRequestLetter({
      to: email,
      unsubscribeUrl: await unsubscribeUrlFor(email, "candidate-join-network"),
    });
    await transporter.sendMail({
      ...mailHeaders(),
      to: email,
      subject: letter.subject,
      text: `You are receiving this email because you, or someone who entered your email address, requested to create a candidate profile with ArbeidMatch.\n\nIf this was you, continue by creating your profile here: https://jobs.arbeidmatch.no/sign-up\n\nThis confirmation step helps us reduce false accounts and make sure we handle personal data in accordance with GDPR. If you did not make this request, you can safely ignore this email.`,
      html: letter.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-join-network", error });
    console.error("[candidate-join-network]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
