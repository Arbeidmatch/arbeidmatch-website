import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { logAuditEvent } from "@/lib/audit/masterAuditLog";
import { createSmtpTransporter, PROFILE_TRANSACTIONAL_FROM } from "@/lib/candidates/smtpShared";
import { notifyError } from "@/lib/errorNotifier";
import { emailParagraph, withRecipientUnsubscribeLink, wrapPremiumEmail } from "@/lib/emailPremiumTemplate";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Valid email is required." }, { status: 400 });

    const email = parsed.data.email.toLowerCase();
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ success: false, error: "Supabase not configured." }, { status: 500 });

    await supabase
      .from("email_subscriptions")
      .upsert({ email, unsubscribed: false, subscribed: true, unsubscribed_at: null }, { onConflict: "email" });

    try {
      await supabase.from("candidates").update({ unsubscribed: false }).eq("email", email);
    } catch {
      // ignore
    }
    try {
      await supabase.from("employer_requests").update({ unsubscribed: false }).eq("email", email);
    } catch {
      // ignore
    }

    void logAuditEvent("email_subscription_resubscribed", "email", email, "candidate", { via: "post-email" });

    const transporter = createSmtpTransporter();
    if (transporter) {
      const html = withRecipientUnsubscribeLink(
        wrapPremiumEmail(
          [emailParagraph("You're back! Welcome to ArbeidMatch again."), emailParagraph("We will continue sending relevant updates.")].join(
            "",
          ),
          { audience: "b2c", unsubscribeEmail: email },
        ),
        email,
      );
      await transporter.sendMail({
        from: PROFILE_TRANSACTIONAL_FROM,
        to: email,
        subject: "You're back! Welcome to ArbeidMatch again.",
        html,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    await notifyError({ route: "/api/unsubscribe/resubscribe", error });
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}

