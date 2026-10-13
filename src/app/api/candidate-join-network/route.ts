import { NextRequest, NextResponse } from "next/server";
import { createSmtpTransporter, sendMailWithRetry } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { TALENT_NETWORK_FORM_ENABLED } from "@/lib/featureFlags";
import { isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet, mailHeaders } from "@/lib/emailPremiumTemplate";
import { CANDIDATE_REGISTER_URL, profileRequestLetter, verifiedProfileNoticeLetter } from "@/lib/emails/letters";
import { unsubscribeUrlFor } from "@/lib/emailSubscription";
import { candidateJoinBodySchema } from "@/lib/candidateJoinConsent";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (!TALENT_NETWORK_FORM_ENABLED) {
      return NextResponse.json(
        {
          error: "endpoint_disabled",
          message: `Talent network registration is currently routed through ${CANDIDATE_REGISTER_URL}`,
        },
        { status: 410 },
      );
    }

    const json = (await request.json()) as unknown;
    const parsed = candidateJoinBodySchema.safeParse(json);
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
    const internalText = `Verified profile request\n\nCandidate email: ${email}\nEU/EEA citizenship confirmed (passport or national ID card): yes\nGDPR consent confirmed: yes\nTimestamp: ${ts}`;

    // The person waiting gets their letter first; our own notice must never be the
    // reason they see an error (13 October 2026, an SMTP timeout on the notice).
    const letter = profileRequestLetter({
      to: email,
      unsubscribeUrl: await unsubscribeUrlFor(email, "candidate-join-network"),
    });
    await sendMailWithRetry(transporter, {
      ...mailHeaders(),
      to: email,
      subject: letter.subject,
      text: `You are receiving this email because you, or someone who entered your email address, requested to create a candidate profile with ArbeidMatch.\n\nIf this was you, continue by creating your profile here: ${CANDIDATE_REGISTER_URL}\n\nThis confirmation step helps us reduce false accounts and make sure we handle personal data in accordance with GDPR. If you did not make this request, you can safely ignore this email.`,
      html: letter.html,
    });

    const notice = verifiedProfileNoticeLetter({ email, timestamp: ts });
    await sendMailWithRetry(transporter, {
      ...mailHeaders(),
      to: "cv@arbeidmatch.no",
      subject: notice.subject,
      text: internalText,
      html: notice.html,
    }).catch((error) => notifyError({ route: "/api/candidate-join-network (internal notice)", error }));

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-join-network", error });
    console.error("[candidate-join-network]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
