import { NextRequest, NextResponse } from "next/server";

import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { hasHoneypotValue, isRateLimited } from "@/lib/requestProtection";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { escapeHtml } from "@/lib/htmlSanitizer";
import { buildEmail } from "@/lib/emailTemplate";
import { notifyError } from "@/lib/errorNotifier";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function buildPayload(
  specialty: string,
  guideWanted: boolean,
  featureName: string | undefined,
): { target_region: string; target_country: string; wants_assistance: string } {
  const region = specialty.slice(0, 120);
  const feat = featureName ? `|featureName=${featureName.slice(0, 80)}` : "";
  return {
    target_region: region,
    target_country: "guide-interest",
    wants_assistance: `guide-interest|specialty=${specialty}|guideWanted=${guideWanted ? "1" : "0"}|consent=1${feat}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(body)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "guide-interest-signup", 12, 10 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const specialty = typeof body.specialty === "string" ? body.specialty.trim().toLowerCase() : "";
    const consent = body.consent === true;
    const guideWanted = body.guideWanted === true;
    const featureName = typeof body.featureName === "string" ? body.featureName.trim() : undefined;

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }
    if (!specialty) {
      return NextResponse.json({ error: "Specialty is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
    }

    const payload = buildPayload(specialty, guideWanted, featureName);
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("guide_interest_signups")
      .select("id")
      .eq("notify_email", email)
      .eq("target_region", payload.target_region)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from("guide_interest_signups")
        .update({
          wants_assistance: payload.wants_assistance,
          target_country: payload.target_country,
          verified_at: now,
        })
        .eq("id", existing.id);
    } else {
      const { error } = await supabase.from("guide_interest_signups").insert({
        notify_email: email,
        ...payload,
        email_verified: true,
        verified_at: now,
      });
      if (error) {
        return NextResponse.json({ error: "Could not save signup." }, { status: 500 });
      }
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      const lines = [
        "Hi, thank you for registering your interest with ArbeidMatch.",
        "",
        `We have noted your profile as: ${specialty}.`,
        "",
        "We will contact you personally when we have a matching opportunity in Norway.",
      ];
      if (guideWanted) {
        lines.push("", "We will also notify you when the guide for your profession becomes available.");
      }
      lines.push("", "Best regards,", "ArbeidMatch Team", "post@arbeidmatch.no");
      const bodyText = lines.join("\n");

      try {
        if (await isUnsubscribed(email)) {
          return NextResponse.json({ success: true });
        }
        const unsubToken = await getOrCreateSubscription(email, "guide-interest");
        const safeSpecialty = escapeHtml(specialty);
        const htmlBody = [
          `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">Hi, thank you for registering your interest with ArbeidMatch.</p>`,
          `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">We have noted your profile as: <strong>${safeSpecialty}</strong>.</p>`,
          `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">We will contact you personally when we have a matching opportunity in Norway.</p>`,
          guideWanted
            ? `<p style="margin:0 0 16px;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">We will also notify you when the guide for your profession becomes available.</p>`
            : "",
          `<p style="margin:0;line-height:1.7;font-size:15px;color:rgba(255,255,255,0.92);">Best regards,<br/>ArbeidMatch Team<br/>post@arbeidmatch.no</p>`,
        ]
          .filter(Boolean)
          .join("");
        await transporter.sendMail({
          from: `"ArbeidMatch" <no-reply@arbeidmatch.no>`,
          to: email,
          subject: "You are registered with ArbeidMatch",
          text: bodyText,
          html: buildEmail({
            title: "You are registered with ArbeidMatch",
            preheader: "We will notify you when opportunities match your profile",
            body: htmlBody,
            recipientEmail: email,
            unsubscribeToken: unsubToken,
          }),
        });
      } catch {
        /* ignore email transport errors */
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/guide-interest-signup", error });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
