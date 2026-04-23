import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter, PROFILE_TRANSACTIONAL_FROM } from "@/lib/candidates/smtpShared";
import { unsubscribeByToken } from "@/lib/emailSubscription";
import { notifyError } from "@/lib/errorNotifier";
import { emailParagraph, premiumCtaButton, withRecipientUnsubscribeLink, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const unsubscribeSchema = z.object({
  email: z.string().trim().email(),
  feedback: z.string().trim().max(300).optional().default(""),
});

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.redirect(new URL("/unsubscribed?success=false", request.url));
    const success = await unsubscribeByToken(token);
    if (success) void logAuditEvent("email_subscription_unsubscribed", "email", token, "candidate", { via: "get" });
    return NextResponse.redirect(new URL(`/unsubscribed?success=${success}`, request.url));
  } catch (error) {
    await notifyError({ route: "/api/unsubscribe", error });
    return NextResponse.redirect(new URL("/unsubscribed?success=false", request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = unsubscribeSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });

    const email = parsed.data.email.toLowerCase();
    const feedback = parsed.data.feedback || null;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ success: false, error: "Supabase not configured." }, { status: 500 });

    await supabase.from("email_subscriptions").upsert(
      {
        email,
        unsubscribed: true,
        subscribed: false,
        unsubscribed_at: new Date().toISOString(),
        feedback,
      },
      { onConflict: "email" },
    );

    // Best-effort sync to candidate/employer rows if unsubscribed field exists.
    try {
      await supabase.from("candidates").update({ unsubscribed: true }).eq("email", email);
    } catch {
      // ignore if column/table mismatch
    }
    try {
      await supabase.from("employer_requests").update({ unsubscribed: true }).eq("email", email);
    } catch {
      // ignore if column/table mismatch
    }

    void logAuditEvent("email_subscription_unsubscribed", "email", email, "candidate", {
      via: "post-email",
      feedback: feedback || "",
    });

    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = withRecipientUnsubscribeLink(
        wrapPremiumEmail(
          [
            emailParagraph("You have been unsubscribed from ArbeidMatch emails."),
            emailParagraph("Thank you for the time you spent with us."),
            `<div style="margin:20px 0;text-align:left;">${premiumCtaButton(
              `https://arbeidmatch.no/unsubscribed?resubscribe=true&email=${encodeURIComponent(email)}`,
              "Resubscribe",
            )}</div>`,
          ].join(""),
          { audience: "b2c", unsubscribeEmail: email },
        ),
        email,
      );
      await transporter.sendMail({
        from: PROFILE_TRANSACTIONAL_FROM,
        to: email,
        subject: "You've been unsubscribed – ArbeidMatch",
        html,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/unsubscribe POST", error });
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
