import { NextRequest, NextResponse } from "next/server";
import { createSmtpTransporter, sendMailWithRetry, signedInMailHeaders } from "@/lib/createSmtpTransporter";
import { isRecipientRefused } from "@/lib/visitorMail";
import { notifyError } from "@/lib/errorNotifier";
import { TALENT_NETWORK_FORM_ENABLED } from "@/lib/featureFlags";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { formatEmailTimestampCet } from "@/lib/emailPremiumTemplate";
import { CANDIDATE_REGISTER_URL, profileRequestLetter, verifiedProfileNoticeLetter } from "@/lib/emails/letters";
import { unsubscribeUrlFor } from "@/lib/emailSubscription";
import { candidateGateBodySchema, gateSourceFrom, isAdult, parseCitizenshipRule } from "@/lib/candidateGate";
import { candidateRegisterUrlWithGate } from "@/lib/candidatePortal";
import { atsBase, portalSecret, visitorIp } from "@/lib/prosjekter/ats";

export const dynamic = "force-dynamic";

/**
 * The server side of the one entry gate (ORDER 396). The sheet on
 * /candidate-register posts citizenship, date of birth, e-mail, the consent
 * and the source here; this asks RecOS to store them (api/public/candidate-gate,
 * server to server with the portal secret) and gets a single-use token back.
 * The visitor's letter carries that token to RecOS's register page, which
 * makes no profile without it. The notice to cv@ stays, as before.
 *
 * GET says which citizenship rule RecOS holds, so the sheet asks the right
 * question.
 */

async function askRecos(path: string, init: RequestInit & { ip?: string | null }): Promise<Response | null> {
  const secret = portalSecret();
  if (!secret) return null;
  const headers: Record<string, string> = { "x-arbeidmatch-website-secret": secret, "Content-Type": "application/json" };
  if (init.ip) headers["x-arbeidmatch-applicant-ip"] = init.ip;
  const { ip: _ip, ...rest } = init;
  void _ip;
  try {
    return await fetch(`${atsBase()}${path}`, { ...rest, headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    return null;
  }
}

export async function GET() {
  const res = await askRecos("/api/public/candidate-gate", { method: "GET" });
  const body = (await res?.json().catch(() => null)) as { citizenship_rule?: unknown } | null;
  return NextResponse.json({ citizenship_rule: parseCitizenshipRule(body?.citizenship_rule) });
}

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
    const parsed = candidateGateBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please check your answers and try again. If this page is old, reload it." }, { status: 400 });
    }
    const { email, citizenship, date_of_birth, consent_text_version } = parsed.data;
    // The door the sheet was opened from; else the general advert the visitor came by (am_ga, ORDER 253), else the site.
    const source = gateSourceFrom(new URLSearchParams({ source: parsed.data.source ?? "" }), request.cookies.get("am_ga")?.value);
    if (!isAdult(date_of_birth)) {
      return NextResponse.json({ error: "You must be 18 or older to create a profile.", code: "under_age" }, { status: 403 });
    }

    if (isRateLimited(request, `candidate-join-network:${email}`, 1, 60 * 1000)) {
      return NextResponse.json({ error: "Please wait one minute before sending another request." }, { status: 429 });
    }
    // One visitor cannot fill the gate with other people's addresses: a few requests per address of origin (ORDER 396).
    if (isRateLimited(request, "candidate-join-network-visitor", 5, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const gate = await askRecos("/api/public/candidate-gate", {
      method: "POST",
      ip: visitorIp(request.headers),
      body: JSON.stringify({ email, citizenship, date_of_birth, consent: true, consent_text_version, source }),
    });
    const gateBody = (await gate?.json().catch(() => null)) as { token?: unknown; error?: unknown } | null;
    if (gate?.status === 403 && gateBody?.error === "under_age") {
      return NextResponse.json({ error: "You must be 18 or older to create a profile.", code: "under_age" }, { status: 403 });
    }
    if (gate?.status === 403 && gateBody?.error === "citizenship_not_accepted") {
      return NextResponse.json({ error: "At this time, ArbeidMatch accepts candidate profiles only from EU/EEA citizens.", code: "citizenship" }, { status: 403 });
    }
    const token = typeof gateBody?.token === "string" ? gateBody.token : "";
    if (!gate?.ok || !token) {
      await notifyError({ route: "/api/candidate-join-network (gate)", error: new Error(`RecOS gate answered ${gate?.status ?? "nothing"}`) });
      return NextResponse.json({ error: "We could not create your link right now. Please try again in a few minutes." }, { status: 503 });
    }

    const transporter = createSmtpTransporter();
    if (!transporter) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const ts = formatEmailTimestampCet();
    const citizenshipLine = citizenship === "eu_eea" ? "EU/EEA citizen" : "Norwegian work permit";
    const internalText = `Verified profile request\n\nCandidate email: ${email}\nCitizenship: ${citizenshipLine}\nAge 18 or older: yes\nGDPR consent confirmed: yes (${consent_text_version})\nSource: ${source ?? "site"}\nTimestamp: ${ts}`;

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

    const registerUrl = candidateRegisterUrlWithGate(token);
    const letter = profileRequestLetter({
      to: email,
      unsubscribeUrl: await unsubscribeUrlFor(email, "candidate-join-network"),
      registerUrl,
    });
    try {
      await sendMailWithRetry(transporter, {
        ...signedInMailHeaders(),
        to: email,
        subject: letter.subject,
        text: `You are receiving this email because you, or someone who entered your email address, requested to create a candidate profile with ArbeidMatch.

If this was you, continue by creating your profile here: ${registerUrl}

The link works once, for 7 days. This confirmation step helps us reduce false accounts and make sure we handle personal data in accordance with GDPR. If you did not make this request, you can safely ignore this email.`,
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
