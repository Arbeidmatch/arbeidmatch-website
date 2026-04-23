import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue } from "@/lib/requestProtection";
import { isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { buildEmail, emailBodyParagraph } from "@/lib/emailTemplate";
import { mailHeaders } from "@/lib/emailPremiumTemplate";
import { logEmailSent } from "@/lib/audit/masterAuditLog";
import { getOrCreateSubscription, isUnsubscribed } from "@/lib/emailSubscription";

export const dynamic = "force-dynamic";

type Body = {
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const raw = (await request.json()) as Record<string, unknown>;
    if (hasHoneypotValue(raw)) {
      return NextResponse.json({ success: true });
    }
    if (isRateLimited(request, "app-waitlist", 8, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = sanitizeStringRecord(raw) as Body;
    const email = (body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const { error } = await supabase.from("app_waitlist").insert({ email });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ success: true, message: "You are already on the list." });
      }
      console.error("[app-waitlist]", error.message);
      return NextResponse.json({ success: false, error: "Could not save. Please try again." }, { status: 500 });
    }

    const transporter = createSmtpTransporter();
    if (transporter) {
      try {
        if (await isUnsubscribed(email)) {
          return NextResponse.json({ success: true });
        }
        const unsubToken = await getOrCreateSubscription(email, "app-waitlist");
        const inner = [
          emailBodyParagraph("Hi there,"),
          emailBodyParagraph(
            "You are on the list. We will notify you as soon as the ArbeidMatch app is available on iOS and Android.",
          ),
          `<p style="text-align:center;margin:8px 0 20px;"><span style="display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid rgba(184,134,11,0.45);background:rgba(184,134,11,0.1);font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#C9A84C;">In Development</span></p>`,
          emailBodyParagraph("We are building something great and you will be among the first to know."),
        ].join("");
        await transporter.sendMail({
          ...mailHeaders(),
          to: email,
          subject: "You are on the ArbeidMatch App waitlist",
          text: `Hi there,

You are on the ArbeidMatch app waitlist. We will notify you when the app is available on iOS and Android.

Visit https://arbeidmatch.no`,
          html: buildEmail({
            title: "You are on the ArbeidMatch App waitlist",
            preheader: "We will notify you when the app is available",
            body: inner,
            ctaText: "Visit ArbeidMatch",
            ctaUrl: "https://arbeidmatch.no",
            unsubscribeToken: unsubToken,
            audience: "b2c",
            unsubscribeEmail: email,
          }),
        });
        logEmailSent("app_waitlist_confirmation", { toDomain: email.split("@")[1] ?? "" });
      } catch (e) {
        console.error("[app-waitlist] confirmation email", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    await notifyError({ route: "/api/app-waitlist", error: e });
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
