import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabaseService";
import { hasHoneypotValue } from "@/lib/requestProtection";
import { isRateLimited } from "@/lib/requestProtection";
import { sanitizeStringRecord } from "@/lib/htmlSanitizer";
import { createSmtpTransporter } from "@/lib/createSmtpTransporter";
import { notifyError } from "@/lib/errorNotifier";
import { buildEmail } from "@/lib/emailTemplate";
import {
  emailParagraph,
  inDevelopmentBadgeStatic,
  mailHeaders,
} from "@/lib/emailPremiumTemplate";

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
        const inner = [
          emailParagraph("Hi there,"),
          emailParagraph(
            "You are on the list. We will notify you as soon as the ArbeidMatch app is available on iOS and Android.",
          ),
          `<div style="text-align:center;margin:8px 0 20px;">${inDevelopmentBadgeStatic()}</div>`,
          emailParagraph("We are building something great and you will be among the first to know."),
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
          }),
        });
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
