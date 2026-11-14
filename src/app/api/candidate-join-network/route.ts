import { NextRequest, NextResponse } from "next/server";
import { createSmtpTransporter, sendMailWithRetry, signedInMailHeaders } from "@/lib/createSmtpTransporter";
import { isRecipientRefused } from "@/lib/visitorMail";
import { notifyError } from "@/lib/errorNotifier";
import { TALENT_NETWORK_FORM_ENABLED } from "@/lib/featureFlags";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet } from "@/lib/emailPremiumTemplate";
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
    if (json && typeof json === "object" && hasHoneypotValue(json as Record<string, unknown>)) {
      return NextResponse.json({ success: true });
    }
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

    // Our own notice goes first: it is the lead. The address typed is the visitor's,
    // and a mistyped one is refused by the server (550 5.1.1); that must never cost
    // us the candidate (ORDER 284, INC-2026-7C14AC). A failing notice is told to
    // #errors and does not stop the visitor's letter either (13 October 2026).
    const notice = verifiedProfileNoticeLetter({ email, timestamp: ts });
    const noticeSent = await sendMailWithRetry(transporter, {
      ...signedInMailHeaders(),
      to: "cv@arbeidmatch.no",
      subject: notice.subject,
      text: internalText,
      html: notice.html,
    }).then(
      () => true,
      async (error) => {
        await notifyError({ route: "/api/candidate-join-network (internal notice)", error });
        return false;
      },
    );

    const letter = profileRequestLetter({
      to: email,
      unsubscribeUrl: await unsubscribeUrlFor(email, "candidate-join-network"),
    });
    try {
      await sendMailWithRetry(transporter, {
        ...signedInMailHeaders(),
        to: email,
        subject: letter.subject,
        text: `You are receiving this email because you, or someone who entered your email address, requested to create a candidate profile with ArbeidMatch.

If this was you, continue by creating your profile here: ${CANDIDATE_REGISTER_URL}

This confirmation step helps us reduce false accounts and make sure we handle personal data in accordance with GDPR. If you did not make this request, you can safely ignore this email.`,
        html: letter.html,
      });
    } catch (error) {
      if (isRecipientRefused(error)) {
        // Not our fault and not an incident: the visitor is asked to check the address.
        return NextResponse.json(
          { error: "We could not send the link to that address. Please check it and try again.", code: "address_refused" },
          { status: 422 },
        );
      }
      if (!noticeSent) throw error;
      await notifyError({ route: "/api/candidate-join-network (visitor letter)", error });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/candidate-join-network", error });
    console.error("[candidate-join-network]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again later." }, { status: 500 });
  }
}
